import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { isPublicAnnouncement, ownsOrganization } from "@/lib/access";
import { checkRateLimit, getRateLimitHeaders, requestIp } from "@/lib/rate-limit";
import { offerSchema } from "@/lib/offer-validation";
import { appUrl, serializeMailAttachments } from "@/lib/mail";
import { notifyOrganizationUsers } from "@/lib/notifications";
import { verifyUploadToken } from "@/lib/upload-token";
import { offerUploadOwner } from "@/lib/offer-security";
import { offerReceiptText, queuedOfferAttachments } from "@/lib/offer-receipt";
import { markOffersOpened } from "@/lib/offer-open";
import { auditRequestContext } from "@/lib/audit-context";
import { isAnnouncementOpen } from "@/lib/announcement-lifecycle";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const session = await auth();
    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement || !ownsOrganization(session, announcement.organizationId)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }
    if (session!.user.role === "ORGANIZATION") {
      await markOffersOpened(id, session!.user.id, auditRequestContext(request));
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
    const parsed = offerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Nieprawidłowe dane" }, { status: 400 });
    }
    const { confirmation: _confirmation, website: _website, bidderNip, attachmentIds = [], ...rawData } = parsed.data;
    const data = { ...rawData, bidderEmail: rawData.bidderEmail.toLowerCase() };

    const uploadOwner = offerUploadOwner(session, request);
    const uploads = attachmentIds
      .map((token) => verifyUploadToken(token, uploadOwner, "offer"))
      .filter((u): u is NonNullable<typeof u> => !!u);
    if (attachmentIds.length && uploads.length !== attachmentIds.length) {
      return NextResponse.json({ error: "Nieprawidłowy załącznik oferty" }, { status: 400 });
    }

    const contractorUserId =
      session?.user?.role === "CONTRACTOR" && session.user.id ? session.user.id : undefined;

    const outcome = await prisma.$transaction(async (tx) => {
      // Serialize submission against resolve/cancel/update of this announcement.
      await tx.$queryRaw`SELECT "id" FROM "announcements" WHERE "id" = ${id} FOR UPDATE`;
      const announcement = await tx.announcement.findUnique({
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
        return { ok: false as const, status: 404, error: "Nie znaleziono ogłoszenia" };
      }
      if (!announcement.submissionMethods.includes("PLATFORM")) {
        return { ok: false as const, status: 409, error: "To ogłoszenie nie przyjmuje ofert przez serwis" };
      }
      if (!isAnnouncementOpen(announcement)) {
        return { ok: false as const, status: 409, error: "Postępowanie nie jest jeszcze otwarte albo termin składania ofert upłynął" };
      }

      const created = await tx.offer.create({
        data: {
          ...data,
          bidderNip: bidderNip || null,
          announcementId: id,
          userId: contractorUserId,
          submissionMethod: "PLATFORM",
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
        include: { attachments: true },
      });
      await tx.auditLog.create({
        data: {
          action: "SUBMIT",
          entity: "OFFER",
          entityId: created.id,
          details: JSON.stringify({ announcementId: id, submissionMethod: "PLATFORM" }),
          ipAddress: requestIp(request),
          userAgent: request.headers.get("user-agent"),
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
      const mailAttachments = serializeMailAttachments(queuedOfferAttachments(created.attachments));
      await tx.emailOutbox.createMany({
        data: [...recipients].map((to) => ({
          to,
          subject: `Nowa oferta do ogłoszenia ${announcement.procedureNumber}`,
          text: offerReceiptText(announcement, created, created.attachments, "ORGANIZATION", panelLink),
          attachments: mailAttachments,
        })),
      });
      const publicLink = appUrl(`/ogloszenia/${id}`);
      await tx.emailOutbox.create({
        data: {
          to: data.bidderEmail,
          subject: `Potwierdzenie złożenia oferty — ${announcement.procedureNumber}`,
          text: `${offerReceiptText(announcement, created, created.attachments, "BIDDER", publicLink)}\n\n${
            contractorUserId
              ? "Oferta jest dostępna w historii na Twoim koncie wykonawcy."
              : "Oferty anonimowej nie można później przypisać do konta wyłącznie na podstawie adresu e-mail."
          }`,
          attachments: mailAttachments,
        },
      });
      return { ok: true as const, offer: created };
    });
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }
    return NextResponse.json({ id: outcome.offer.id, submittedAt: outcome.offer.submittedAt }, { status: 201, headers: getRateLimitHeaders(rate) });
  } catch (error) {
    return apiError(error);
  }
}
