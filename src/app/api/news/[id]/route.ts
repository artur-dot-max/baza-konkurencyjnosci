import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { newsInputSchema, newsStatus, newsWriteData } from "@/lib/news";

type Context = { params: Promise<{ id: string }> };

async function adminSession() {
  const session = await auth();
  return session?.user?.role === "ADMIN" ? session : null;
}

export async function GET(_request: Request, { params }: Context) {
  try {
    if (!await adminSession()) return NextResponse.json({ error: "Brak uprawnień" }, { status: 401 });
    const { id } = await params;
    const item = await prisma.news.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Aktualność nie istnieje" }, { status: 404 });
    return NextResponse.json({ ...item, status: newsStatus(item) });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const session = await adminSession();
    if (!session) return NextResponse.json({ error: "Brak uprawnień" }, { status: 401 });
    const { id } = await params;
    const current = await prisma.news.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Aktualność nie istnieje" }, { status: 404 });
    const parsed = newsInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Nieprawidłowe dane" }, { status: 400 });
    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.news.update({ where: { id, updatedAt: current.updatedAt }, data: newsWriteData(parsed.data, current) });
      await tx.auditLog.create({ data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "NEWS",
        entityId: updated.id,
        details: JSON.stringify({ title: updated.title, from: newsStatus(current), to: newsStatus(updated) }),
      } });
      return updated;
    });
    return NextResponse.json({ ...item, status: newsStatus(item) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const session = await adminSession();
    if (!session) return NextResponse.json({ error: "Brak uprawnień" }, { status: 401 });
    const { id } = await params;
    const item = await prisma.news.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Aktualność nie istnieje" }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.news.delete({ where: { id } });
      await tx.auditLog.create({ data: {
        userId: session.user.id,
        action: "DELETE",
        entity: "NEWS",
        entityId: id,
        details: JSON.stringify({ title: item.title }),
      } });
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
