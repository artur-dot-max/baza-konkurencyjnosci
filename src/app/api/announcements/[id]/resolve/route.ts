import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canWriteOrganization } from "@/lib/access";
import { apiError } from "@/lib/api-error";
import { procurementResultSchema, cancellationSchema } from "@/lib/validators";
import { appUrl } from "@/lib/mail";
import { createNotificationsForUsers } from "@/lib/notifications";

class ResolutionError extends Error {
  constructor(message: string, readonly status: 403 | 404 | 409) {
    super(message);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    let ann = await prisma.announcement.findUnique({
      where: { id },
      include: {
        offers: { select: { bidderEmail: true, bidderName: true, userId: true } },
      },
    });
    if (!ann) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canWriteOrganization(session, ann.organizationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!["PUBLISHED", "IN_PROGRESS"].includes(ann.status)) {
      return NextResponse.json({ error: "Postępowanie nie jest otwarte" }, { status: 409 });
    }
    const body = await request.json();
    const type = String(body.type ?? body.action ?? "").toLowerCase();
    if (!["resolve", "cancel"].includes(type)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    if (type === "resolve" && (!ann.bidsDeadline || ann.bidsDeadline > new Date())) {
      return NextResponse.json({ error: "Termin składania ofert jeszcze nie upłynął" }, { status: 409 });
    }
    const result = procurementResultSchema.safeParse({ ...body, price: Number(body.price) });
    const cancellation = cancellationSchema.safeParse(body);
    if (type === "resolve" && !result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    if (type === "cancel" && !cancellation.success) {
      return NextResponse.json({ error: cancellation.error.issues[0].message }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "announcements" WHERE "id" = ${id} FOR UPDATE`;
      const locked = await tx.announcement.findUnique({
        where: { id },
        include: { offers: { select: { bidderEmail: true, bidderName: true, userId: true } } },
      });
      if (!locked) throw new ResolutionError("Not found", 404);
      if (!canWriteOrganization(session, locked.organizationId)) throw new ResolutionError("Forbidden", 403);
      if (!["PUBLISHED", "IN_PROGRESS"].includes(locked.status)) {
        throw new ResolutionError("Postępowanie nie jest otwarte", 409);
      }
      if (type === "resolve" && (!locked.bidsDeadline || locked.bidsDeadline > new Date())) {
        throw new ResolutionError("Termin składania ofert jeszcze nie upłynął", 409);
      }
      ann = locked;

      const updated = await tx.announcement.update({
        where: { id, status: ann.status, updatedAt: ann.updatedAt },
        data: {
          status: type === "resolve" ? "RESOLVED" : "CANCELLED",
          ...(type === "cancel" && cancellation.success && { cancellationReason: cancellation.data.cancellationReason }),
          ...(type === "resolve" && result.success && { result: { create: result.data } }),
          history: {
            create: {
              userId: session.user.id,
              action: type.toUpperCase(),
              details: type === "resolve" ? "Rozstrzygnięto postępowanie" : "Unieważniono postępowanie",
            },
          },
        },
      });
      await tx.auditLog.create({
        data: { userId: session.user.id, entity: "ANNOUNCEMENT", entityId: id, action: type.toUpperCase() },
      });

      const publicLink = appUrl(`/ogloszenia/${id}`);
      const bidderEmails = [...new Set(ann.offers.map((o) => o.bidderEmail).filter(Boolean))];
      const bidderUserIds = [
        ...new Set(ann.offers.map((o) => o.userId).filter((uid): uid is string => !!uid)),
      ];

      if (type === "resolve" && result.success) {
        const subject = `Rozstrzygnięto postępowanie ${ann.procedureNumber}`;
        const text = [
          `Postępowanie „${ann.title}" (${ann.procedureNumber}) zostało rozstrzygnięte.`,
          "",
          `Wybrany wykonawca: ${result.data.contractorName}`,
          `Szczegóły: ${publicLink}`,
        ].join("\n");
        if (bidderEmails.length) {
          await tx.emailOutbox.createMany({
            data: bidderEmails.map((to) => ({ to, subject, text })),
          });
        }
        if (bidderUserIds.length) {
          await createNotificationsForUsers(tx, bidderUserIds, {
            type: "RESOLVED",
            title: "Postępowanie rozstrzygnięte",
            body: `Ogłoszenie ${ann.procedureNumber} zostało rozstrzygnięte.`,
            href: `/ogloszenia/${id}`,
          });
        }
      }

      if (type === "cancel" && cancellation.success) {
        const subject = `Unieważniono postępowanie ${ann.procedureNumber}`;
        const text = [
          `Postępowanie „${ann.title}" (${ann.procedureNumber}) zostało unieważnione.`,
          "",
          `Powód: ${cancellation.data.cancellationReason}`,
          `Szczegóły: ${publicLink}`,
        ].join("\n");
        if (bidderEmails.length) {
          await tx.emailOutbox.createMany({
            data: bidderEmails.map((to) => ({ to, subject, text })),
          });
        }
        if (bidderUserIds.length) {
          await createNotificationsForUsers(tx, bidderUserIds, {
            type: "CANCELLED",
            title: "Postępowanie unieważnione",
            body: `Ogłoszenie ${ann.procedureNumber} zostało unieważnione.`,
            href: `/ogloszenia/${id}`,
          });
        }
      }

      return updated;
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ResolutionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return apiError(error);
  }
}
