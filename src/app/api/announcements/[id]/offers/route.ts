import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { isPublicAnnouncement, ownsOrganization } from "@/lib/access";
import { checkRateLimit, getRateLimitHeaders, requestIp } from "@/lib/rate-limit";
import { offerSchema } from "@/lib/offer-validation";
import { appUrl } from "@/lib/mail";
import { notifyOrganizationUsers } from "@/lib/notifications";
import { verifyOfferUploadToken } from "@/lib/upload-token";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const session = await auth();
    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement || !ownsOrganization(session, announcement.organizationId)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }
    const offers = await prisma.offer.findMany({
      where: { announcementId: id },
      orderBy: { submittedAt: "asc" },
      include: { attachments: true },
    });
    return NextResponse.json(offers);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const session = await auth();
    const rate = await checkRateLimit(`offer:${id}:${requestIp(request)}`, 5, 86400000);
    if (!rate.success) {
      return NextResponse.json({ error: "Osiągnięto limit składanych ofert. Spróbuj później." }, { status: 429, headers: getRateLimitHeaders(rate) });
    }
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            email: true,
            users: { where: { isActive: true }, select: { email: true } },
          },
        },
      },
    });
    if (!announcement || !isPublicAnnouncement(announcement)) {
      return NextResponse.json({ error: "Nie znaleziono ogłoszenia" }, { status: 404 });
    }
    if (!announcement.submissionMethods.includes("PLATFORM")) {
      return NextResponse.json({ error: "To ogłoszenie nie przyjmuje ofert przez serwis" }, { status: 409 });
    }
    if (!["PUBLISHED", "IN_PROGRESS"].includes(announcement.status) || !announcement.bidsDeadline || announcement.bidsDeadline <= new Date()) {
      return NextResponse.json({ error: "Termin składania ofert upłynął" }, { status: 409 });
    }
    const parsed = offerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Nieprawidłowe dane" }, { status: 400 });
    }
    const { confirmation: _confirmation, website: _website, bidderNip, attachmentIds = [], ...data } = parsed.data;

    const uploads = attachmentIds
      .map((token) => verifyOfferUploadToken(token))
      .filter((u): u is NonNullable<typeof u> => !!u);
    if (attachmentIds.length && uploads.length !== attachmentIds.length) {
      return NextResponse.json({ error: "Nieprawidłowy załącznik oferty" }, { status: 400 });
    }

    const contractorUserId =
      session?.user?.role === "CONTRACTOR" && session.user.id ? session.user.id : undefined;

    const offer = await prisma.$transaction(async (tx) => {
      const created = await tx.offer.create({
        data: {
          ...data,
          bidderNip: bidderNip || null,
          announcementId: id,
          userId: contractorUserId,
          attachments: uploads.length
            ? {
                create: uploads.map((file) => ({
                  fileName: file.fileName,
                  originalName: file.originalName,
                  mimeType: file.mimeType,
                  fileSize: file.fileSize,
                  filePath: file.filePath,
                })),
              }
            : undefined,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "SUBMIT",
          entity: "OFFER",
          entityId: created.id,
          details: JSON.stringify({ announcementId: id }),
          userId: contractorUserId,
        },
      });
      if (announcement.status === "PUBLISHED") {
        await tx.announcement.update({
          where: { id },
          data: { status: "IN_PROGRESS" },
        });
      }
      const panelLink = appUrl(`/panel/ogloszenia/${id}/oferty`);
      await notifyOrganizationUsers(tx, announcement.organizationId, {
        type: "OFFER",
        title: "Nowa oferta",
        body: `Złożono ofertę do „${announcement.title}" (${announcement.procedureNumber}) — ${data.bidderName}, ${data.price} PLN.`,
        href: `/panel/ogloszenia/${id}/oferty`,
      });
      const recipients = new Set<string>([
        announcement.organization.email,
        ...announcement.organization.users.map((user) => user.email),
      ]);
      await tx.emailOutbox.createMany({
        data: [...recipients].map((to) => ({
          to,
          subject: `Nowa oferta do ogłoszenia ${announcement.procedureNumber}`,
          text: [
            `Do ogłoszenia „${announcement.title}" (${announcement.procedureNumber}) złożono nową ofertę przez serwis.`,
            "",
            `Wykonawca: ${data.bidderName}`,
            `Cena brutto: ${data.price} PLN`,
            uploads.length ? `Załączniki: ${uploads.length}` : "",
            "",
            `Przejrzyj oferty w panelu: ${panelLink}`,
          ]
            .filter(Boolean)
            .join("\n"),
        })),
      });
      const publicLink = appUrl(`/ogloszenia/${id}`);
      await tx.emailOutbox.create({
        data: {
          to: data.bidderEmail,
          subject: `Potwierdzenie złożenia oferty — ${announcement.procedureNumber}`,
          text: [
            `Dziękujemy. Twoja oferta do ogłoszenia „${announcement.title}" (${announcement.procedureNumber}) została przyjęta.`,
            "",
            `Numer potwierdzenia: ${created.id}`,
            `Wykonawca: ${data.bidderName}`,
            `Cena brutto: ${data.price} PLN`,
            uploads.length ? `Załączniki: ${uploads.length}` : "",
            "",
            `Ogłoszenie: ${publicLink}`,
            "",
            "Zapisz numer potwierdzenia. Dane oferty są widoczne wyłącznie dla zamawiającego.",
            "Konto wykonawcy (opcjonalne) pozwala przeglądać historię ofert: " + appUrl("/rejestracja-wykonawcy"),
          ]
            .filter(Boolean)
            .join("\n"),
        },
      });
      return created;
    });
    return NextResponse.json({ id: offer.id, submittedAt: offer.submittedAt }, { status: 201, headers: getRateLimitHeaders(rate) });
  } catch (error) {
    return apiError(error);
  }
}
