import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canWriteOrganization } from "@/lib/access";
import { answerSchema } from "@/lib/validators";
import { apiError } from "@/lib/api-error";
import { appUrl } from "@/lib/mail";
import { createNotificationsForUsers } from "@/lib/notifications";

class AnswerClosedError extends Error {}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  try {
    const session = await auth(); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, questionId } = await params;
    const ann = await prisma.announcement.findUnique({ where: { id } });
    if (!ann) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canWriteOrganization(session, ann.organizationId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!["PUBLISHED", "IN_PROGRESS"].includes(ann.status)) return NextResponse.json({ error: "Postępowanie jest zamknięte" }, { status: 409 });
    const question = await prisma.question.findFirst({ where: { id: questionId, announcementId: id } });
    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const parsed = answerSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const answer = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "announcements" WHERE "id" = ${id} FOR UPDATE`;
      const current = await tx.announcement.findUnique({ where: { id } });
      if (!current || !["PUBLISHED", "IN_PROGRESS"].includes(current.status)) {
        throw new AnswerClosedError("Postępowanie jest zamknięte");
      }
      const created = await tx.answer.create({ data: { content: parsed.data.content, questionId } });
      await tx.announcementHistory.create({ data: { announcementId: id, userId: session.user.id, action: "ANSWER_QUESTION", details: "Udzielono odpowiedzi na pytanie" } });
      await tx.auditLog.create({ data: {
        userId: session.user.id,
        action: "ANSWER_QUESTION",
        entity: "ANSWER",
        entityId: created.id,
        details: JSON.stringify({ announcementId: id, questionId }),
      } });
      if (question.authorEmail) {
        const publicLink = appUrl(`/ogloszenia/${id}`);
        const preview = parsed.data.content.length > 280
          ? `${parsed.data.content.slice(0, 277)}...`
          : parsed.data.content;
        await tx.emailOutbox.create({
          data: {
            to: question.authorEmail,
            subject: `Odpowiedź na pytanie do ogłoszenia ${ann.procedureNumber}`,
            text: [
              `Otrzymano odpowiedź na pytanie dotyczące ogłoszenia „${ann.title}" (${ann.procedureNumber}).`,
              "",
              "Twoje pytanie:",
              question.content,
              "",
              "Odpowiedź:",
              preview,
              "",
              `Pełna treść ogłoszenia: ${publicLink}`,
            ].join("\n"),
          },
        });
        const asker = await tx.user.findFirst({
          where: { email: question.authorEmail, isActive: true },
          select: { id: true },
        });
        if (asker) {
          await createNotificationsForUsers(tx, [asker.id], {
            type: "ANSWER",
            title: "Odpowiedź na pytanie",
            body: `Odpowiedź do ogłoszenia ${ann.procedureNumber}: ${preview}`,
            href: `/ogloszenia/${id}`,
          });
        }
      }
      return created;
    });
    return NextResponse.json(answer, { status: 201 });
  } catch (error) {
    if (error instanceof AnswerClosedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return apiError(error);
  }
}
