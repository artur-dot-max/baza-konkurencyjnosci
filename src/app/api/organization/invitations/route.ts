import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { appUrl } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { canManageOrganizationTeam, ownsOrganization } from "@/lib/access";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId || session.user.role !== "ORGANIZATION") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!ownsOrganization(session, session.user.organizationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const [members, invitations] = await Promise.all([
      prisma.user.findMany({
        where: { organizationId: session.user.organizationId, role: "ORGANIZATION" },
        select: { id: true, email: true, name: true, orgRole: true, isActive: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.organizationInvitation.findMany({
        where: { organizationId: session.user.organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return NextResponse.json({
      members,
      invitations,
      canManage: canManageOrganizationTeam(session, session.user.organizationId),
      currentUserId: session.user.id,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.organizationId || session.user.role !== "ORGANIZATION") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!canManageOrganizationTeam(session, session.user.organizationId)) {
      return NextResponse.json({ error: "Tylko właściciel może zapraszać członków" }, { status: 403 });
    }
    if (!(await checkRateLimit(`invite:${session.user.id}`, 20, 3600000)).success) {
      return NextResponse.json({ error: "Spróbuj później" }, { status: 429 });
    }

    const parsed = inviteSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });

    const email = parsed.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser?.organizationId === session.user.organizationId) {
      return NextResponse.json({ error: "Użytkownik już należy do organizacji" }, { status: 409 });
    }
    if (existingUser && existingUser.role !== "ORGANIZATION") {
      return NextResponse.json({ error: "Ten adres e-mail jest używany przez inne konto" }, { status: 409 });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const invite = await prisma.$transaction(async (tx) => {
      await tx.organizationInvitation.deleteMany({
        where: { organizationId: session.user.organizationId!, email, acceptedAt: null },
      });
      const created = await tx.organizationInvitation.create({
        data: {
          organizationId: session.user.organizationId!,
          email,
          role: parsed.data.role,
          tokenHash,
          invitedById: session.user.id,
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      const acceptUrl = appUrl(`/zaproszenie#token=${token}`);
      await tx.emailOutbox.create({
        data: {
          to: email,
          subject: "Zaproszenie do organizacji w Bazie Konkurencyjności",
          text: [
            "Otrzymujesz zaproszenie do dołączenia do organizacji w systemie Baza Konkurencyjności.",
            "",
            `Rola: ${parsed.data.role === "VIEWER" ? "Podgląd" : "Edycja"}`,
            `Akceptuj zaproszenie: ${acceptUrl}`,
            "",
            "Link jest ważny 7 dni.",
          ].join("\n"),
        },
      });
      return created;
    });

    return NextResponse.json({ id: invite.id, message: "Zaproszenie wysłane" }, { status: 201 });
  } catch (error) {
    return apiError(error, request);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!canManageOrganizationTeam(session, session.user.organizationId)) {
      return NextResponse.json({ error: "Tylko właściciel może anulować zaproszenia" }, { status: 403 });
    }
    const { invitationId } = z.object({ invitationId: z.string().min(1) }).parse(await request.json());
    await prisma.organizationInvitation.deleteMany({
      where: {
        id: invitationId,
        organizationId: session.user.organizationId,
        acceptedAt: null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, request);
  }
}
