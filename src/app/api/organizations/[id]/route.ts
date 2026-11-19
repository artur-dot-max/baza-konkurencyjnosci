import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canWriteOrganization, ownsOrganization, safeUserSelect } from "@/lib/access";
import { apiError } from "@/lib/api-error";
import { appUrl } from "@/lib/mail";
import { createNotificationsForUsers } from "@/lib/notifications";
import { z } from "zod";
import { auditRequestFields } from "@/lib/audit-context";
const updateSchema = z.object({
  name: z.string().trim().min(3).max(200).optional(), nip: z.string().regex(/^\d{10}$/).optional(),
  regon: z.string().regex(/^\d{9}(\d{5})?$/).optional(),
  krs: z.union([z.string().regex(/^\d{10}$/), z.literal("")]).optional(),
  address: z.string().trim().min(5).max(300).optional(), city: z.string().trim().min(2).max(100).optional(),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/).optional(), voivodeship: z.string().min(1).max(100).optional(),
  email: z.string().email().max(254).optional(), phone: z.string().max(30).optional(),
  status: z.enum(["PENDING", "ACTIVE", "BLOCKED"]).optional(),
  statusReason: z.string().trim().max(2000).optional(),
}).strict();
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); const { id } = await params;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!ownsOrganization(session, id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const org = await prisma.organization.findUnique({ where: { id }, include: { users: { select: safeUserSelect } } });
    return org ? NextResponse.json(org) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) { return apiError(error); }
}
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); const { id } = await params;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canWriteOrganization(session, id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe dane organizacji" }, { status: 400 });
    if (parsed.data.status && session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { statusReason, ...orgData } = parsed.data;
    const org = await prisma.$transaction(async tx => {
      const old = await tx.organization.findUniqueOrThrow({
        where: { id },
        include: { users: { select: { id: true, email: true } } },
      });
      const updated = await tx.organization.update({ where: { id }, data: orgData });
      if (old.status !== updated.status) {
        await tx.user.updateMany({ where: { organizationId: id }, data: { sessionVersion: { increment: 1 } } });
        if (updated.status === "ACTIVE") {
          for (const user of old.users) {
            await tx.emailOutbox.create({
              data: {
                to: user.email,
                subject: "Aktywacja konta organizacji",
                text: `Konto organizacji ${updated.name} jest aktywne. Możesz się zalogować: ${appUrl("/logowanie")}`,
              },
            });
          }
          await createNotificationsForUsers(
            tx,
            old.users.map((user) => user.id),
            {
              type: "ORG_ACTIVE",
              title: "Organizacja aktywowana",
              body: `Konto organizacji ${updated.name} jest aktywne. Możesz korzystać z panelu.`,
              href: "/panel",
            }
          );
        }
        if (updated.status === "BLOCKED" && statusReason) {
          for (const user of old.users) {
            await tx.emailOutbox.create({
              data: {
                to: user.email,
                subject: "Konto organizacji zablokowane",
                text: [
                  `Konto organizacji ${updated.name} zostało zablokowane.`,
                  "",
                  `Powód: ${statusReason}`,
                ].join("\n"),
              },
            });
          }
        }
      }
      await tx.auditLog.create({ data: { userId: session.user.id, action: "UPDATE", entity: "ORGANIZATION", entityId: id,
        details: JSON.stringify({ fields: Object.keys(orgData), status: updated.status, statusReason: statusReason || undefined }), ...auditRequestFields(request) } });
      return updated;
    });
    return NextResponse.json(org);
  } catch (error) { return apiError(error); }
}
