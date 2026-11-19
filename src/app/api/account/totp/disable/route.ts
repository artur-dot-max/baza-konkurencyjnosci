import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { decryptTotpSecret, totpCodeSchema, verifyTotpCode } from "@/lib/totp";
import { checkRateLimit } from "@/lib/rate-limit";
import { auditRequestFields } from "@/lib/audit-context";

const disableSchema = z.object({
  password: z.string().min(1, "Podaj hasło"),
  code: z.string().min(1, "Podaj kod z Authenticatora lub kod zapasowy"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    if (!(await checkRateLimit(`totp-disable:${session.user.id}`, 10, 3600000)).success) {
      return NextResponse.json({ error: "Spróbuj później" }, { status: 429 });
    }

    const parsed = disableSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Nieprawidłowe dane" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.totpEnabled || !user.totpSecret) {
      return NextResponse.json({ error: "Uwierzytelnianie dwuetapowe nie jest włączone" }, { status: 400 });
    }

    const passwordOk = await bcrypt.compare(parsed.data.password, user.password);
    if (!passwordOk) return NextResponse.json({ error: "Nieprawidłowe hasło" }, { status: 400 });

    const secret = decryptTotpSecret(user.totpSecret);
    const code = parsed.data.code.replace(/\s+/g, "");
    const totpOk = totpCodeSchema.regex.test(code) && verifyTotpCode(secret, code, user.email);
    let backupOk = false;
    if (!totpOk) {
      for (const hash of user.totpBackupCodes) {
        if (await bcrypt.compare(code.toUpperCase(), hash)) {
          backupOk = true;
          break;
        }
      }
    }
    if (!totpOk && !backupOk) {
      return NextResponse.json({ error: "Nieprawidłowy kod weryfikacyjny" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          totpEnabled: false,
          totpSecret: null,
          totpBackupCodes: [],
          sessionVersion: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "TOTP_DISABLE",
          entity: "USER",
          entityId: user.id,
          ...auditRequestFields(request),
        },
      });
    });

    return NextResponse.json({
      message: "Uwierzytelnianie dwuetapowe zostało wyłączone. Zaloguj się ponownie.",
      requireRelogin: true,
    });
  } catch (error) {
    return apiError(error, request);
  }
}
