import { pagination, safeUserSelect } from "@/lib/access";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { z } from "zod";

const sendSchema = z.object({
  subject: z.string().trim().min(3, "Temat musi mieć co najmniej 3 znaki").max(200),
  body: z.string().trim().min(5, "Treść musi mieć co najmniej 5 znaków").max(10000),
  userIds: z.array(z.string().min(1)).min(1, "Wybierz co najmniej jednego użytkownika").max(200),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { page, limit, skip } = pagination(request.url);
    const [data, total] = await Promise.all([
      prisma.adminMessage.findMany({
        skip,
        take: limit,
        include: {
          sender: { select: safeUserSelect },
          recipients: {
            include: { user: { select: safeUserSelect } },
            orderBy: { email: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.adminMessage.count(),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error, request);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = sendSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Nieprawidłowe dane" }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: parsed.data.userIds }, isActive: true },
      select: { id: true, email: true, name: true },
    });
    if (!users.length) {
      return NextResponse.json({ error: "Nie znaleziono aktywnych użytkowników do wysyłki" }, { status: 400 });
    }

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.adminMessage.create({
        data: {
          subject: parsed.data.subject,
          body: parsed.data.body,
          senderId: session.user.id,
          recipients: {
            create: users.map((user) => ({
              userId: user.id,
              email: user.email,
            })),
          },
        },
        include: {
          recipients: true,
          sender: { select: safeUserSelect },
        },
      });

      await tx.emailOutbox.createMany({
        data: users.map((user) => ({
          to: user.email,
          subject: parsed.data.subject,
          text: [
            user.name ? `Witaj ${user.name},` : "Witaj,",
            "",
            parsed.data.body,
            "",
            "—",
            "Wiadomość z panelu administratora Bazy Konkurencyjności Funduszu Sprawiedliwości",
          ].join("\n"),
        })),
      });

      await tx.auditLog.create({ data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "MESSAGE",
        entityId: created.id,
        details: JSON.stringify({ recipients: users.length, subject: parsed.data.subject }),
      } });

      return created;
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return apiError(error, request);
  }
}
