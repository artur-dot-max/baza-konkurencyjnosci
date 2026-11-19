import { announcementSchema as createAnnouncementSchema } from "@/lib/announcement-validation";
import { canWriteOrganization, publicAnnouncementWhere, pagination } from "@/lib/access";
import { apiError } from "@/lib/api-error";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { sanitizeRichText } from "@/lib/sanitize";
import { verifyUploadToken } from "@/lib/upload-token";
import { auditRequestFields } from "@/lib/audit-context";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = pagination(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const isAdmin = session?.user?.role === "ADMIN";

    const where: Record<string, unknown> = {};
    if (!isAdmin) {
      where.AND = [publicAnnouncementWhere()];
      if (status && !["PUBLISHED", "IN_PROGRESS", "RESOLVED", "CANCELLED", "COMPLETED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    } else if (status) {
      if (!["DRAFT", "PUBLISHED", "IN_PROGRESS", "RESOLVED", "CANCELLED", "COMPLETED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      where.status = status;
    }
    if (!isAdmin && status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { procedureNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        include: { organization: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.announcement.count({ where }),
    ]);

    return NextResponse.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Fetching announcements failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ORGANIZATION" || !session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canWriteOrganization(session, session.user.organizationId)) {
      return NextResponse.json({ error: "Brak uprawnień do tworzenia ogłoszeń (rola: tylko podgląd)" }, { status: 403 });
    }
    const userId = session.user.id;
    const organizationId = session.user.organizationId;

    const ip = `announcement:${session.user.id}`;
    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rateLimit) });
    }

    const parsed = createAnnouncementSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane", issues: parsed.error.flatten() }, { status: 400 });
    }

    const uploads = parsed.data.attachmentIds.map((token) => verifyUploadToken(token, session.user.id));
    if (uploads.some((upload) => !upload)) {
      return NextResponse.json({ error: "Co najmniej jeden załącznik wygasł lub jest nieprawidłowy" }, { status: 400 });
    }

    const data = parsed.data;
    const fileNames = uploads.map(u => u!.fileName);
    if (new Set(fileNames).size !== fileNames.length || await prisma.attachment.count({ where: { fileName: { in: fileNames } } }))
      return NextResponse.json({ error: "Załącznik jest już przypisany" }, { status: 409 });
    const announcement = await prisma.$transaction(async (tx) => {
      const created = await tx.announcement.create({ data: {
        procedureNumber: data.procedureNumber,
        title: data.title,
        orderType: data.orderType,
        description: sanitizeRichText(data.description),
        conditions: data.conditions ? sanitizeRichText(data.conditions) : null,
        submissionMethods: data.submissionMethods,
        eDeliveryAddress: data.eDeliveryAddress || null,
        contactPerson: data.contactPerson || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        bidsDeadline: data.bidsDeadline ? new Date(data.bidsDeadline) : null,
        status: data.status,
        voivodeship: data.voivodeship,
        location: data.location,
        executionTerm: data.executionTerm,
        organizationId,
        history: { create: { userId, action: data.status === "PUBLISHED" ? "PUBLISH" : "CREATE", details: "Utworzono ogłoszenie" } },
        criteria: { create: data.criteria },
        attachments: {
          create: uploads.map((upload) => ({
            fileName: upload!.fileName,
            originalName: upload!.originalName,
            mimeType: upload!.mimeType,
            fileSize: upload!.fileSize,
            filePath: upload!.filePath,
          })),
        },
      },
      include: { criteria: true, attachments: true },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "CREATE",
          entity: "ANNOUNCEMENT",
          entityId: created.id,
          ...auditRequestFields(request),
          details: JSON.stringify({ status: created.status }),
        },
      });
      return created;
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Creating announcement failed:", error);
    return NextResponse.json({ error: "Nie udało się utworzyć ogłoszenia" }, { status: 500 });
  }
}
