import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { passwordSchema } from "@/lib/password";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(20),
  name: z.string().trim().min(2).max(200),
  password: passwordSchema,
});

export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit(`invite-accept:${requestIp(request)}`, 20, 3600000)).success) {
      return NextResponse.json({ error: "Spróbuj później" }, { status: 429 });
    }
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });

    const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
    const invite = await prisma.organizationInvitation.findUnique({ where: { tokenHash } });
    if (!invite || invite.acceptedAt || invite.expiresAt <= new Date()) {
      return NextResponse.json({ error: "Zaproszenie wygasło lub jest nieprawidłowe" }, { status: 400 });
    }

    const password = await bcrypt.hash(parsed.data.password, 12);
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email: invite.email } });
      if (existing) {
        if (existing.organizationId && existing.organizationId !== invite.organizationId) {
          throw new Error("EMAIL_IN_USE");
        }
        await tx.user.update({
          where: { id: existing.id },
          data: {
            organizationId: invite.organizationId,
            role: "ORGANIZATION",
            orgRole: invite.role,
            name: parsed.data.name,
            password,
            isActive: true,
            sessionVersion: { increment: 1 },
          },
        });
      } else {
        await tx.user.create({
          data: {
            email: invite.email,
            name: parsed.data.name,
            password,
            role: "ORGANIZATION",
            orgRole: invite.role,
            organizationId: invite.organizationId,
            isActive: true,
          },
        });
      }
      await tx.organizationInvitation.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
    });

    return NextResponse.json({ message: "Dołączono do organizacji. Zaloguj się." });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_IN_USE") {
      return NextResponse.json({ error: "Ten e-mail należy już do innej organizacji" }, { status: 409 });
    }
    return apiError(error, request);
  }
}
