import { pagination, safeUserSelect } from "@/lib/access";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { page, limit, skip } = pagination(request.url);
    const [data, total] = await Promise.all([
      prisma.errorLog.findMany({
        skip,
        take: limit,
        include: { user: { select: safeUserSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.errorLog.count(),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error, request);
  }
}
