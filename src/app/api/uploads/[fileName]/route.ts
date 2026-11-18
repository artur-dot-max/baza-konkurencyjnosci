import { auth } from "@/auth";
import { canReadAnnouncement, ownsOrganization } from "@/lib/access";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { ownsOffer } from "@/lib/offer-security";

const uploadDirectory = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));

async function fileResponse(fileName: string, originalName: string, mimeType: string) {
  const contents = await readFile(path.join(uploadDirectory, fileName));
  const safeName = originalName.replace(/["\r\n]/g, "_");
  return new NextResponse(contents, {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(contents.length),
      "Content-Disposition": `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await params;
  if (path.basename(fileName) !== fileName) {
    return NextResponse.json({ error: "Nieprawidłowa nazwa pliku" }, { status: 400 });
  }

  const session = await auth();

  const attachment = await prisma.attachment.findFirst({
    where: { fileName },
    include: { announcement: true },
  });
  if (attachment) {
    if (!canReadAnnouncement(session, attachment.announcement)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
      return await fileResponse(fileName, attachment.originalName, attachment.mimeType);
    } catch {
      return NextResponse.json({ error: "Nie znaleziono pliku" }, { status: 404 });
    }
  }

  const offerAttachment = await prisma.offerAttachment.findFirst({
    where: { fileName },
    include: {
      offer: {
        include: {
          announcement: { select: { id: true, organizationId: true, status: true, publishedAt: true } },
        },
      },
    },
  });
  if (!offerAttachment) return NextResponse.json({ error: "Nie znaleziono pliku" }, { status: 404 });

  const { offer } = offerAttachment;
  const isOrgOwner = ownsOrganization(session, offer.announcement.organizationId);
  const isOfferOwner = ownsOffer(session?.user?.id, offer.userId);

  if (!isOrgOwner && !isOfferOwner && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    return await fileResponse(fileName, offerAttachment.originalName, offerAttachment.mimeType);
  } catch {
    return NextResponse.json({ error: "Nie znaleziono pliku" }, { status: 404 });
  }
}
