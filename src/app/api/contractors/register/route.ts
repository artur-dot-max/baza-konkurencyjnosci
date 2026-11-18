import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { passwordSchema } from "@/lib/password";

const schema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().email().max(254),
  password: passwordSchema,
});

export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit(`contractor-reg:${requestIp(request)}`, 10, 3600000)).success) {
      return NextResponse.json({ error: "Spróbuj później" }, { status: 429 });
    }
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Nieprawidłowe dane" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Konto z tym adresem e-mail już istnieje" }, { status: 409 });

    const password = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: {
        email: parsed.data.email.toLowerCase(),
        name: parsed.data.name,
        password,
        role: "CONTRACTOR",
        isActive: true,
      } });
      await tx.auditLog.create({ data: {
        userId: created.id,
        action: "REGISTER",
        entity: "USER",
        entityId: created.id,
        details: JSON.stringify({ role: "CONTRACTOR" }),
      } });
      return created;
    });

    return NextResponse.json({ id: user.id, message: "Konto wykonawcy utworzone. Możesz się zalogować." }, { status: 201 });
  } catch (error) {
    return apiError(error, request);
  }
}
