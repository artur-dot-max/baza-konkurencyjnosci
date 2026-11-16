import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canReadAnnouncement, isPublicAnnouncement, ownsOrganization } from "@/lib/access";
import { apiError } from "@/lib/api-error";
import { checkRateLimit, requestIp, getRateLimitHeaders } from "@/lib/rate-limit";
import { appUrl } from "@/lib/mail";
import { notifyOrganizationUsers } from "@/lib/notifications";
import { publicQuestionSchema, redactQuestionAuthor } from "@/lib/moderation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const session = await auth();
    const ann = await prisma.announcement.findUnique({ where: { id } });
    if (!ann || !canReadAnnouncement(session, ann)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const owner = ownsOrganization(session, ann.organizationId);
    const questions = await prisma.question.findMany({ where: { announcementId: id, ...(!owner && { isPublic: true }) }, include: { answers: true }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(owner ? questions : questions.map(redactQuestionAuthor));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rate = await checkRateLimit(`question:${requestIp(request)}`, 10, 3600000);
    if (!rate.success) return NextResponse.json({ error: "Spróbuj później" }, { status: 429, headers: getRateLimitHeaders(rate) });
    const ann = await prisma.announcement.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            name: true,
            email: true,
            users: { where: { isActive: true }, select: { email: true } },
          },
        },
      },
    });
    if (!ann || !isPublicAnnouncement(ann)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["PUBLISHED", "IN_PROGRESS"].includes(ann.status) || !ann.bidsDeadline || ann.bidsDeadline <= new Date()) {
      return NextResponse.json({ error: "Termin zadawania pytań upłynął" }, { status: 409 });
    }
    const parsed = publicQuestionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const question = await prisma.$transaction(async (tx) => {
      const created = await tx.question.create({ data: { ...parsed.data, announcementId: id } });
      const recipients = new Set<string>([
        ann.organization.email,
        ...ann.organization.users.map((user) => user.email),
      ]);
      const panelLink = appUrl(`/panel/ogloszenia/${id}/pytania`);
      const preview = parsed.data.content.length > 280
        ? `${parsed.data.content.slice(0, 277)}...`
        : parsed.data.content;
      await tx.emailOutbox.createMany({
        data: [...recipients].map((to) => ({
          to,
          subject: `Nowe pytanie do ogłoszenia ${ann.procedureNumber}`,
          text: [
            `Do ogłoszenia „${ann.title}" (${ann.procedureNumber}) zadano nowe pytanie.`,
            "",
            preview,
            "",
            `Odpowiedz w panelu organizacji: ${panelLink}`,
          ].join("\n"),
        })),
      });
      await notifyOrganizationUsers(tx, ann.organizationId, {
        type: "QUESTION",
        title: "Nowe pytanie",
        body: `Pytanie do „${ann.title}" (${ann.procedureNumber}): ${preview}`,
        href: `/panel/ogloszenia/${id}/pytania`,
      });
      return created;
    });

    return NextResponse.json({ id: question.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
