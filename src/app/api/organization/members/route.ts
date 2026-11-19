import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { canManageOrganizationTeam } from "@/lib/access";
import { auditRequestFields } from "@/lib/audit-context";

const updateSchema = z.object({
  userId: z.string().min(1),
  orgRole: z.enum(["EDITOR", "VIEWER"]).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => data.orgRole !== undefined || data.isActive !== undefined, {
  message: "Brak zmian",
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.organizationId || session.user.role !== "ORGANIZATION") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!canManageOrganizationTeam(session, session.user.organizationId)) {
      return NextResponse.json({ error: "Tylko właściciel może zarządzać zespołem" }, { status: 403 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Nieprawidłowe dane" }, { status: 400 });
    }

    const member = await prisma.user.findFirst({
      where: {
        id: parsed.data.userId,
        organizationId: session.user.organizationId,
        role: "ORGANIZATION",
      },
    });
    if (!member) return NextResponse.json({ error: "Nie znaleziono członka" }, { status: 404 });
    if (member.orgRole === "OWNER") {
      return NextResponse.json({ error: "Nie można zmieniać konta właściciela" }, { status: 409 });
    }
    if (member.id === session.user.id) {
      return NextResponse.json({ error: "Nie możesz zmieniać własnego konta w ten sposób" }, { status: 409 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.user.update({
        where: { id: member.id },
        data: {
          ...(parsed.data.orgRole && { orgRole: parsed.data.orgRole }),
          ...(parsed.data.isActive !== undefined && {
            isActive: parsed.data.isActive,
            sessionVersion: { increment: 1 },
          }),
        },
        select: { id: true, email: true, name: true, orgRole: true, isActive: true },
      });
      await tx.auditLog.create({ data: {
        userId: session.user.id,
        action: "UPDATE_MEMBER",
        entity: "USER",
        ...auditRequestFields(request),
        entityId: member.id,
        details: JSON.stringify({ orgRole: changed.orgRole, isActive: changed.isActive }),
      } });
      return changed;
    });

    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, request);
  }
}
