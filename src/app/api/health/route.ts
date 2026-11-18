import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const failedMailCount = await prisma.emailOutbox.count({ where: { failedAt: { not: null } } });
    return NextResponse.json({
      status: "ok",
      mailQueue: failedMailCount ? "degraded" : "ok",
      failedMailCount,
    });
  }
  catch { return NextResponse.json({ status: "unavailable" }, { status: 503 }); }
}
