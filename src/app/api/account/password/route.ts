import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { changePasswordSchema } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    if (!(await checkRateLimit(`password-change:${session.user.id}`, 10, 3600000)).success) {
      return NextResponse.json({ error: "Spróbuj później" }, { status: 429 });
    }

    const parsed = changePasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });

    const matches = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!matches) return NextResponse.json({ error: "Aktualne hasło jest nieprawidłowe" }, { status: 400 });

    if (parsed.data.currentPassword === parsed.data.newPassword) {
      return NextResponse.json({ error: "Nowe hasło musi różnić się od aktualnego" }, { status: 400 });
    }

    const password = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password, sessionVersion: { increment: 1 } },
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_CHANGE",
          entity: "USER",
          entityId: user.id,
        },
      });
    });

    return NextResponse.json({
      message: "Hasło zostało zmienione. Zaloguj się ponownie.",
      requireRelogin: true,
    });
  } catch (error) {
    return apiError(error, request);
  }
}
