import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { isPublicAnnouncement } from "@/lib/access";
import { sha256Checksum } from "@/lib/checksum";
import { createAnnouncementPdf } from "@/lib/announcement-pdf";

type Context = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        organization: true,
        criteria: { orderBy: { id: "asc" } },
        attachments: { orderBy: { id: "asc" } },
        questions: { where: { isPublic: true }, orderBy: { createdAt: "asc" }, include: { answers: { orderBy: { createdAt: "asc" } } } },
        history: { orderBy: { createdAt: "asc" } },
        result: true,
      },
    });
    if (!announcement || !isPublicAnnouncement(announcement)) return NextResponse.json({ error: "Nie znaleziono ogłoszenia" }, { status: 404 });

    const generatedAt = new Date();
    const checksum = sha256Checksum({
      id: announcement.id,
      updatedAt: announcement.updatedAt,
      procedureNumber: announcement.procedureNumber,
      title: announcement.title,
      status: announcement.status,
      orderType: announcement.orderType,
      description: announcement.description,
      conditions: announcement.conditions,
      submissionMethods: announcement.submissionMethods,
      eDeliveryAddress: announcement.eDeliveryAddress,
      contactPerson: announcement.contactPerson,
      contactEmail: announcement.contactEmail,
      contactPhone: announcement.contactPhone,
      publishedAt: announcement.publishedAt,
      bidsDeadline: announcement.bidsDeadline,
      voivodeship: announcement.voivodeship,
      location: announcement.location,
      executionTerm: announcement.executionTerm,
      organization: announcement.organization.name,
      criteria: announcement.criteria.map(({ name, weight, description }) => ({ name, weight, description })),
      attachments: announcement.attachments.map(({ originalName, fileName, fileSize }) => ({ originalName, fileName, fileSize })),
      questions: announcement.questions.map((question) => ({
        content: question.content,
        createdAt: question.createdAt,
        answers: question.answers.map((answer) => ({ content: answer.content, createdAt: answer.createdAt })),
      })),
      history: announcement.history.map(({ action, details, createdAt }) => ({ action, details, createdAt })),
      result: announcement.result ? {
        contractorName: announcement.result.contractorName,
        contractorNip: announcement.result.contractorNip,
        price: announcement.result.price.toString(),
        justification: announcement.result.justification,
      } : null,
      cancellationReason: announcement.cancellationReason,
      resolution: announcement.resolution,
    });
    const buffer = await createAnnouncementPdf(announcement, generatedAt, checksum);
    const filename = `ogloszenie-${announcement.procedureNumber.replace(/[^a-zA-Z0-9_-]+/g, "-")}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
