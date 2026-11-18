import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import {
  decryptTotpSecret,
  generateBackupCodes,
  hashBackupCodes,
  totpCodeSchema,
  verifyTotpCode,
} from "@/lib/totp";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

const enableSchema = z.object({
  code: z.string().regex(totpCodeSchema.regex, totpCodeSchema.message),
  password: z.string().min(1, "Podaj aktualne hasło"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    if (!(await checkRateLimit(`totp-enable:${session.user.id}`, 20, 3600000)).success) {
      return NextResponse.json({ error: "Spróbuj później" }, { status: 429 });
    }

    const parsed = enableSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Nieprawidłowy kod" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.totpSecret) {
      return NextResponse.json({ error: "Najpierw rozpocznij konfigurację 2FA" }, { status: 400 });
    }
    if (user.totpEnabled) {
      return NextResponse.json({ error: "Uwierzytelnianie dwuetapowe jest już włączone" }, { status: 400 });
    }

    if (!await bcrypt.compare(parsed.data.password, user.password)) {
      return NextResponse.json({ error: "Nieprawidłowe hasło" }, { status: 400 });
    }

    const secret = decryptTotpSecret(user.totpSecret);
    if (!verifyTotpCode(secret, parsed.data.code, user.email)) {
      return NextResponse.json({ error: "Nieprawidłowy kod z aplikacji Authenticator" }, { status: 400 });
    }

    const backupCodes = generateBackupCodes();
    const hashed = await hashBackupCodes(backupCodes);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          totpEnabled: true,
          totpBackupCodes: hashed,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "TOTP_ENABLE",
          entity: "USER",
          entityId: user.id,
        },
      });
    });

    return NextResponse.json({
      message: "Uwierzytelnianie dwuetapowe zostało włączone",
      backupCodes,
    });
  } catch (error) {
    return apiError(error, request);
  }
}
