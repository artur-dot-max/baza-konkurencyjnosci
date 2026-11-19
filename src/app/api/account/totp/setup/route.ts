import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { buildTotp, encryptTotpSecret, generateTotpSecret } from "@/lib/totp";
import { checkRateLimit } from "@/lib/rate-limit";
import { auditRequestFields } from "@/lib/audit-context";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    if (!(await checkRateLimit(`totp-setup:${session.user.id}`, 10, 3600000)).success) {
      return NextResponse.json({ error: "Spróbuj później" }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });
    if (user.totpEnabled) {
      return NextResponse.json({ error: "Uwierzytelnianie dwuetapowe jest już włączone" }, { status: 400 });
    }

    const secret = generateTotpSecret();
    const totp = buildTotp(secret, user.email);
    const otpauthUrl = totp.toString();
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 220,
      color: { dark: "#123F36", light: "#FFFFFF" },
    });

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          totpSecret: encryptTotpSecret(secret.base32),
          totpEnabled: false,
          totpBackupCodes: [],
        },
      });
      await tx.auditLog.create({ data: {
        userId: user.id,
        action: "TOTP_SETUP",
        entity: "USER",
        entityId: user.id,
        ...auditRequestFields(request),
      } });
    });

    return NextResponse.json({
      secret: secret.base32,
      otpauthUrl,
      qrDataUrl,
      issuer: "Baza Konkurencyjności FS",
    });
  } catch (error) {
    return apiError(error, request);
  }
}
