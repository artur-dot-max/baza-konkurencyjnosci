import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    if (!(await checkRateLimit(`prelogin:${ip}`, 30, 900000)).success) {
      return NextResponse.json({ error: "Spróbuj później" }, { status: 429 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Nieprawidłowy email lub hasło" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    if (!(await checkRateLimit(`login:${email}`, 10, 900000)).success) {
      return NextResponse.json({ error: "Spróbuj później" }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    const invalid = NextResponse.json({ error: "Nieprawidłowy email lub hasło" }, { status: 401 });
    if (!user?.password || !user.isActive) return invalid;
    if (user.role === "ORGANIZATION" && user.organization?.status !== "ACTIVE") return invalid;

    const passwordsMatch = await bcrypt.compare(parsed.data.password, user.password);
    if (!passwordsMatch) return invalid;

    return NextResponse.json({
      requires2FA: user.totpEnabled,
    });
  } catch (error) {
    return apiError(error, request);
  }
}
