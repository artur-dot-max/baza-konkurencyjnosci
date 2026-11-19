import { auth } from "@/auth";
import { checkRateLimit, requestIp, getRateLimitHeaders } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";
import { pagination, safeUserSelect } from "@/lib/access";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerOrganizationSchema } from "@/lib/validators";
import { auditRequestFields } from "@/lib/audit-context";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = pagination(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const where: any = {};
    if (status && !["ACTIVE", "PENDING", "BLOCKED"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    if (status) where.status = status;
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.organization.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const rate = await checkRateLimit(`register:${requestIp(request)}`, 5, 3600000);
    if (!rate.success) return NextResponse.json({ error: "Spróbuj później" }, { status: 429, headers: getRateLimitHeaders(rate) });
    const parsed = registerOrganizationSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" }, { status: 400 });
    const body = parsed.data;

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const organization = await prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({ data: {
        name: body.organizationName,
        nip: body.nip,
        regon: body.regon,
        krs: body.krs || null,
        address: body.address,
        city: body.city,
        postalCode: body.postalCode,
        voivodeship: body.voivodeship,
        email: body.email.toLowerCase(),
        phone: body.phone,
        status: "PENDING",
        users: {
          create: {
            email: body.email.toLowerCase(),
            password: hashedPassword,
            name: body.organizationName,
            role: "ORGANIZATION",
          }
        }
      },
      include: { users: { select: safeUserSelect } }
      });
      await tx.auditLog.create({ data: {
        userId: created.users[0].id,
        action: "CREATE",
        entity: "ORGANIZATION",
        ...auditRequestFields(request),
        entityId: created.id,
        details: JSON.stringify({ name: created.name }),
      } });
      return created;
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
