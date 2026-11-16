import { canReadAnnouncement, canWriteOrganization, ownsOrganization } from "@/lib/access";
import { announcementSchema, criteriaSchema, publishedBidsDeadlineChangeError } from "@/lib/announcement-validation";
import { apiError } from "@/lib/api-error";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { sanitizeRichText } from "@/lib/sanitize";
import { SUBMISSION_METHODS } from "@/lib/utils";
import { z } from "zod";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        organization: true,
        criteria: true,
        history: { orderBy: { createdAt: "desc" } },
        questions: {
          include: { answers: true },
        },
        attachments: true,
        result: true,
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await auth();
    if (!canReadAnnouncement(session, announcement)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!ownsOrganization(session, announcement.organizationId)) {
      return NextResponse.json({
        ...announcement,
        organization: { id: announcement.organization.id, name: announcement.organization.name },
        questions: announcement.questions.filter((q) => q.isPublic).map(({ authorEmail, authorName, ...q }) => q),
      });
    }
    return NextResponse.json(announcement);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const oldAnn = await prisma.announcement.findUnique({ where: { id }, include: { criteria: true } });
    if (!oldAnn) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!canWriteOrganization(session, oldAnn.organizationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["DRAFT", "PUBLISHED", "IN_PROGRESS"].includes(oldAnn.status)) {
      return NextResponse.json({ error: "Zakończone postępowanie nie podlega edycji" }, { status: 409 });
    }

    const body = await request.json();
    const updateSchema = z.object({
      status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
      criteria: criteriaSchema.optional(),
      contactPerson: z.string().max(200).optional(),
      title: z.string().trim().min(1).max(500).optional(),
      procedureNumber: z.string().trim().min(1).max(100).optional(),
      orderType: z.enum(["SUPPLIES", "SERVICES", "CONSTRUCTION"]).optional(),
      description: z.string().min(1).optional(),
      conditions: z.string().nullable().optional(),
      bidsDeadline: z.string().datetime().nullable().optional(),
      executionTerm: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
      voivodeship: z.string().nullable().optional(),
      submissionMethods: z
        .array(z.enum(SUBMISSION_METHODS))
        .max(SUBMISSION_METHODS.length)
        .refine((methods) => new Set(methods).size === methods.length, "Każdy sposób składania ofert można wybrać tylko raz")
        .optional(),
      eDeliveryAddress: z.string().nullable().optional(),
      contactEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
      contactPhone: z.string().nullable().optional(),
    });
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" }, { status: 400 });
    }
    const data = parsed.data;
    if (data.status === "DRAFT" && oldAnn.status !== "DRAFT") {
      return NextResponse.json({ error: "Nie można cofnąć publikacji" }, { status: 409 });
    }

    const alreadyPublished = oldAnn.status === "PUBLISHED" || oldAnn.status === "IN_PROGRESS";
    if (alreadyPublished && data.bidsDeadline !== undefined) {
      const deadlineError = publishedBidsDeadlineChangeError(oldAnn.bidsDeadline, data.bidsDeadline);
      if (deadlineError) {
        return NextResponse.json({ error: deadlineError }, { status: 409 });
      }
    }

    const publishing = oldAnn.status === "DRAFT" && data.status === "PUBLISHED";
    if (oldAnn.status !== "DRAFT" || publishing) {
      const merged = {
        ...oldAnn,
        ...data,
        status: "PUBLISHED",
        criteria: data.criteria ?? oldAnn.criteria,
        publishedAt: publishing ? new Date().toISOString() : oldAnn.publishedAt?.toISOString(),
        bidsDeadline: data.bidsDeadline === undefined ? oldAnn.bidsDeadline?.toISOString() : data.bidsDeadline,
      };
      for (const key of ["conditions", "contactPerson", "contactEmail", "contactPhone", "eDeliveryAddress"] as const) {
        merged[key] ??= "";
      }
      const valid = announcementSchema.safeParse(merged);
      if (!valid.success) return NextResponse.json({ error: valid.error.issues[0].message }, { status: 400 });
    }

    const deadlineExtended =
      alreadyPublished &&
      !!data.bidsDeadline &&
      !!oldAnn.bidsDeadline &&
      new Date(data.bidsDeadline).getTime() > oldAnn.bidsDeadline.getTime();

    const ann = await prisma.$transaction(async (tx) => {
      const updated = await tx.announcement.update({
        where: { id, updatedAt: oldAnn.updatedAt },
        data: {
          ...(publishing && { status: "PUBLISHED", publishedAt: new Date() }),
          ...(data.criteria && { criteria: { deleteMany: {}, create: data.criteria } }),
          ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
          ...(data.title !== undefined && { title: data.title }),
          ...(data.procedureNumber !== undefined && { procedureNumber: data.procedureNumber }),
          ...(data.orderType !== undefined && { orderType: data.orderType }),
          ...(data.description !== undefined && { description: sanitizeRichText(data.description) }),
          ...(data.conditions !== undefined && {
            conditions: data.conditions ? sanitizeRichText(data.conditions) : null,
          }),
          ...(data.bidsDeadline !== undefined && {
            bidsDeadline: data.bidsDeadline ? new Date(data.bidsDeadline) : null,
          }),
          ...(data.executionTerm !== undefined && { executionTerm: data.executionTerm }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.voivodeship !== undefined && { voivodeship: data.voivodeship }),
          ...(data.submissionMethods !== undefined && { submissionMethods: data.submissionMethods }),
          ...(data.eDeliveryAddress !== undefined && { eDeliveryAddress: data.eDeliveryAddress || null }),
          ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail || null }),
          ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
        },
      });

      await tx.announcementHistory.create({
        data: {
          announcementId: id,
          userId: session.user.id,
          action: deadlineExtended ? "EXTEND_DEADLINE" : "UPDATE",
          details: deadlineExtended
            ? `Przedłużono termin składania ofert do ${data.bidsDeadline}`
            : "Ogłoszenie zaktualizowane",
        },
      });

      return updated;
    });

    await createAuditLog({
      userId: session.user.id,
      action: deadlineExtended ? "EXTEND_DEADLINE" : "UPDATE",
      entity: "ANNOUNCEMENT",
      entityId: id,
      details: JSON.stringify({ before: oldAnn, after: ann }),
    });

    return NextResponse.json(ann);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ann = await prisma.announcement.findUnique({ where: { id } });
    if (!ann) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!canWriteOrganization(session, ann.organizationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (ann.status !== "DRAFT") {
      return NextResponse.json({ error: "Cannot delete non-draft announcement" }, { status: 400 });
    }

    await prisma.announcement.delete({ where: { id } });

    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entity: "ANNOUNCEMENT",
      entityId: id,
      details: JSON.stringify(ann),
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
