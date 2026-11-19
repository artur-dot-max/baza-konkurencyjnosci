import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { canWriteOrganization } from "@/lib/access";
import { manualOfferSchema } from "@/lib/manual-offer";
import { offerUploadOwner } from "@/lib/offer-security";
import { verifyUploadToken } from "@/lib/upload-token";
import { auditRequestContext } from "@/lib/audit-context";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const session = await auth();
    const { id } = await params;
    if (!session?.user?.id) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    const parsed = manualOfferSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Nieprawidłowe dane" }, { status: 400 });
    }

    const { attachmentIds, bidderEmail, bidderNip, description, entryNote, ...data } = parsed.data;
    const uploadOwner = offerUploadOwner(session, request);
    const uploads = attachmentIds
      .map((token) => verifyUploadToken(token, uploadOwner, "offer"))
      .filter((file): file is NonNullable<typeof file> => Boolean(file));
    if (uploads.length !== attachmentIds.length) {
      return NextResponse.json({ error: "Nieprawidłowy załącznik oferty" }, { status: 400 });
    }
    const context = auditRequestContext(request);

    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "announcements" WHERE "id" = ${id} FOR UPDATE`;
      const announcement = await tx.announcement.findUnique({ where: { id } });
      if (!announcement || !canWriteOrganization(session, announcement.organizationId)) {
        return { ok: false as const, status: 403, error: "Brak uprawnień" };
      }
      if (!["PUBLISHED", "IN_PROGRESS"].includes(announcement.status)) {
        return { ok: false as const, status: 409, error: "Oferty można wprowadzać wyłącznie do trwającego postępowania" };
      }
      if (!announcement.submissionMethods.includes(data.submissionMethod)) {
        return { ok: false as const, status: 409, error: "Ten sposób składania nie został dopuszczony w ogłoszeniu" };
      }
      if (bidderEmail) {
        const duplicate = await tx.offer.findFirst({
          where: { announcementId: id, bidderEmail: bidderEmail.toLowerCase() },
          select: { id: true },
        });
        if (duplicate) return { ok: false as const, status: 409, error: "Oferta tego wykonawcy jest już zarejestrowana" };
      }

      const offer = await tx.offer.create({
        data: {
          announcementId: id,
          bidderName: data.bidderName,
          bidderEmail: bidderEmail ? bidderEmail.toLowerCase() : null,
          bidderNip: bidderNip || null,
          price: data.price,
          description: description || null,
          submissionMethod: data.submissionMethod,
          submittedAt: data.submittedAt,
          enteredById: session.user.id,
          entryNote: entryNote || null,
          attachments: uploads.length ? { create: uploads.map((file) => ({
            fileName: file.fileName,
            originalName: file.originalName,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            filePath: file.filePath,
          })) } : undefined,
        },
      });
      if (announcement.status === "PUBLISHED") {
        await tx.announcement.update({ where: { id }, data: { status: "IN_PROGRESS" } });
      }
      await tx.auditLog.create({
        data: {
          action: "MANUAL_ENTRY",
          entity: "OFFER",
          entityId: offer.id,
          userId: session.user.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          details: JSON.stringify({
            announcementId: id,
            submissionMethod: data.submissionMethod,
            submittedAt: data.submittedAt.toISOString(),
            path: context.path,
          }),
        },
      });
      return { ok: true as const, id: offer.id };
    });

    if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    return NextResponse.json({ id: outcome.id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
