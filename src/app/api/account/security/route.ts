import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
        totpEnabled: true,
        totpBackupCodes: true,
      },
    });
    if (!user) return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });

    return NextResponse.json({
      email: user.email,
      name: user.name,
      totpEnabled: user.totpEnabled,
      backupCodesRemaining: user.totpBackupCodes.length,
    });
  } catch (error) {
    return apiError(error);
  }
}
