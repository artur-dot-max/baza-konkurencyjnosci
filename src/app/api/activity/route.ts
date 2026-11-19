import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { auditRequestContext } from "@/lib/audit-context";
import { checkRateLimit } from "@/lib/rate-limit";

const activitySchema = z.object({
  path: z.string().trim().min(1).max(500).refine((value) => value.startsWith("/") && !value.startsWith("//")),
  referrer: z.string().trim().max(500).optional().default(""),
});

export async function POST(request: Request) {
  const context = auditRequestContext(request);
  if (!(await checkRateLimit(`activity:${context.ipAddress}`, 2_000, 3_600_000)).success) {
    return new NextResponse(null, { status: 204 });
  }
  const parsed = activitySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe zdarzenie" }, { status: 400 });
  const session = await auth();
  await prisma.auditLog.create({
    data: {
      action: "PAGE_VIEW",
      entity: "PAGE",
      userId: session?.user?.id || null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: JSON.stringify({ path: parsed.data.path, referrer: parsed.data.referrer || null }),
    },
  });
  return new NextResponse(null, { status: 204 });
}
