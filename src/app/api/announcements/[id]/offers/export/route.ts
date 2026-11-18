import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ownsOrganization } from "@/lib/access";
import { apiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/utils";
import { csvSafeCell } from "@/lib/offer-security";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        offers: { orderBy: { submittedAt: "asc" }, include: { attachments: true } },
        organization: { select: { name: true } },
      },
    });
    if (!announcement || !ownsOrganization(session, announcement.organizationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const format = new URL(request.url).searchParams.get("format") || "csv";

    if (format === "csv") {
      const header = ["Data złożenia", "Wykonawca", "NIP", "E-mail", "Cena brutto (PLN)", "Opis", "Załączniki"];
      const rows = announcement.offers.map((offer) => [
        formatDateTime(offer.submittedAt),
        offer.bidderName,
        offer.bidderNip || "",
        offer.bidderEmail,
        String(offer.price),
        (offer.description || "").replace(/\r?\n/g, " "),
        offer.attachments.map((a) => a.originalName).join("; "),
      ]);
      const csv = [header, ...rows].map((row) => row.map(csvSafeCell).join(";")).join("\n");
      const filename = `oferty-${announcement.procedureNumber.replace(/[^a-zA-Z0-9_-]+/g, "-")}.csv`;
      return new NextResponse("\uFEFF" + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const lines = [
      `Oferty — ${announcement.procedureNumber}`,
      announcement.title,
      announcement.organization.name,
      "",
      ...announcement.offers.flatMap((offer, index) => [
        `${index + 1}. ${offer.bidderName} | ${Number(offer.price).toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}`,
        `   E-mail: ${offer.bidderEmail}${offer.bidderNip ? ` | NIP: ${offer.bidderNip}` : ""}`,
        `   Data: ${formatDateTime(offer.submittedAt)}`,
        offer.description ? `   Opis: ${offer.description}` : "",
        offer.attachments.length
          ? `   Załączniki: ${offer.attachments.map((a) => a.originalName).join(", ")}`
          : "",
        "",
      ]),
    ].filter((line) => line !== undefined);

    const filename = `oferty-${announcement.procedureNumber.replace(/[^a-zA-Z0-9_-]+/g, "-")}.txt`;
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return apiError(error, request);
  }
}
