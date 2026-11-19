import "server-only";

import path from "node:path";
import pdfMake from "pdfmake";
import sanitizeHtml from "sanitize-html";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { formatDateTime, ORDER_TYPE_LABELS, STATUS_LABELS, SUBMISSION_METHOD_LABELS } from "@/lib/utils";

let configured = false;

function configurePdfMake() {
  if (configured) return;
  const fontDirectory = path.join(process.cwd(), "node_modules", "pdfmake", "fonts", "Roboto");
  pdfMake.setFonts({
    Roboto: {
      normal: path.join(fontDirectory, "Roboto-Regular.ttf"),
      bold: path.join(fontDirectory, "Roboto-Medium.ttf"),
      italics: path.join(fontDirectory, "Roboto-Italic.ttf"),
      bolditalics: path.join(fontDirectory, "Roboto-MediumItalic.ttf"),
    },
  });
  pdfMake.setUrlAccessPolicy(() => false);
  pdfMake.setLocalAccessPolicy((filePath) => path.resolve(filePath).startsWith(path.resolve(fontDirectory)));
  configured = true;
}

function textFromHtml(value: string | null | undefined) {
  if (!value) return "—";
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() || "—";
}

function detail(label: string, value: unknown): Content {
  return {
    columns: [
      { width: 150, text: label, bold: true, color: "#145447" },
      { width: "*", text: value === null || value === undefined || value === "" ? "—" : String(value) },
    ],
    columnGap: 12,
    margin: [0, 0, 0, 6],
  };
}

type AnnouncementPdfData = {
  procedureNumber: string;
  title: string;
  status: string;
  orderType: string;
  description: string;
  conditions: string | null;
  submissionMethods: string[];
  eDeliveryAddress: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  publishedAt: Date | null;
  bidsDeadline: Date | null;
  voivodeship: string | null;
  location: string | null;
  executionTerm: string | null;
  cancellationReason: string | null;
  organization: { name: string; address: string; postalCode: string; city: string };
  criteria: Array<{ name: string; weight: number; description: string | null }>;
  attachments: Array<{ originalName: string; fileSize: number }>;
  questions: Array<{ content: string; createdAt: Date; answers: Array<{ content: string; createdAt: Date }> }>;
  result: { contractorName: string; contractorNip: string | null; price: { toString(): string }; justification: string | null } | null;
};

export async function createAnnouncementPdf(announcement: AnnouncementPdfData, generatedAt: Date, checksum: string) {
  configurePdfMake();

  const content: Content[] = [
    { text: "BAZA KONKURENCYJNOŚCI FUNDUSZU SPRAWIEDLIWOŚCI", style: "brand" },
    { text: announcement.title, style: "title" },
    { text: announcement.procedureNumber, style: "procedure" },
    { text: "Dane podstawowe", style: "heading" },
    detail("Status", STATUS_LABELS[announcement.status] || announcement.status),
    detail("Rodzaj zamówienia", ORDER_TYPE_LABELS[announcement.orderType] || announcement.orderType),
    detail("Zamawiający", announcement.organization.name),
    detail("Miejsce realizacji", [announcement.location, announcement.voivodeship].filter(Boolean).join(", ")),
    detail("Data i godzina otwarcia", announcement.publishedAt ? formatDateTime(announcement.publishedAt) : null),
    detail("Data i godzina zamknięcia składania ofert", announcement.bidsDeadline ? formatDateTime(announcement.bidsDeadline) : null),
    detail("Termin realizacji", announcement.executionTerm),
    { text: "Opis przedmiotu zamówienia", style: "heading" },
    { text: textFromHtml(announcement.description) },
  ];

  if (announcement.conditions) content.push(
    { text: "Warunki udziału", style: "heading" },
    { text: textFromHtml(announcement.conditions) },
  );

  content.push(
    { text: "Kryteria oceny ofert", style: "heading" },
    announcement.criteria.length ? {
      table: {
        headerRows: 1,
        widths: ["*", 65],
        body: [
          [{ text: "Kryterium", bold: true }, { text: "Waga", bold: true }],
          ...announcement.criteria.map((criterion) => [
            criterion.description ? `${criterion.name}\n${criterion.description}` : criterion.name,
            `${criterion.weight}%`,
          ]),
        ],
      },
      layout: "lightHorizontalLines",
    } : { text: "Brak określonych kryteriów." },
    { text: "Składanie ofert i kontakt", style: "heading" },
    detail("Sposoby składania ofert", announcement.submissionMethods.map((method) => SUBMISSION_METHOD_LABELS[method] || method).join(", ")),
  );

  if (announcement.submissionMethods.includes("E_DELIVERY")) content.push(detail("Adres do e-Doręczeń", announcement.eDeliveryAddress));
  if (announcement.submissionMethods.includes("IN_PERSON")) content.push(detail("Miejsce złożenia", `${announcement.organization.address}, ${announcement.organization.postalCode} ${announcement.organization.city}`));
  content.push(
    detail("Osoba do kontaktu", announcement.contactPerson),
    detail("E-mail", announcement.contactEmail),
    detail("Telefon", announcement.contactPhone),
    { text: "Załączniki", style: "heading" },
    announcement.attachments.length ? { ul: announcement.attachments.map((attachment) => `${attachment.originalName} (${Math.round(attachment.fileSize / 1024)} KB)`) } : { text: "Brak załączników." },
  );

  if (announcement.result) content.push(
    { text: "Wynik postępowania", style: "heading" },
    detail("Wybrany wykonawca", announcement.result.contractorName),
    detail("NIP", announcement.result.contractorNip),
    detail("Cena", `${Number(announcement.result.price).toLocaleString("pl-PL", { minimumFractionDigits: 2 })} PLN`),
    detail("Uzasadnienie", announcement.result.justification),
  );
  if (announcement.cancellationReason) content.push(
    { text: "Informacja o unieważnieniu", style: "heading" },
    { text: announcement.cancellationReason },
  );

  content.push(
    { text: "Pytania i odpowiedzi", style: "heading" },
    announcement.questions.length ? {
      stack: announcement.questions.map((question) => ({
        stack: [
          { text: `Pytanie z ${formatDateTime(question.createdAt)}`, bold: true },
          { text: question.content },
          ...question.answers.flatMap((answer) => [
            { text: `Odpowiedź z ${formatDateTime(answer.createdAt)}`, bold: true, margin: [12, 5, 0, 0] } as Content,
            { text: answer.content, margin: [12, 0, 0, 7] } as Content,
          ]),
        ],
        margin: [0, 0, 0, 8],
      })),
    } : { text: "Brak pytań." },
  );

  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [42, 48, 42, 78],
    defaultStyle: { font: "Roboto", fontSize: 9.5, lineHeight: 1.25 },
    styles: {
      brand: { fontSize: 9, bold: true, color: "#145447", characterSpacing: 0.6 },
      title: { fontSize: 20, bold: true, margin: [0, 10, 0, 4], color: "#111827" },
      procedure: { fontSize: 9, color: "#4B5563", margin: [0, 0, 0, 12] },
      heading: { fontSize: 13, bold: true, color: "#145447", margin: [0, 15, 0, 7] },
    },
    content,
    footer: (currentPage, pageCount) => ({
      margin: [42, 8, 42, 0],
      stack: [
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: 511, y2: 0, lineWidth: 0.5, lineColor: "#4B5563" }] },
        { text: `Wygenerowano: ${formatDateTime(generatedAt)}  |  Strona ${currentPage} z ${pageCount}`, fontSize: 7, margin: [0, 5, 0, 1] },
        { text: "Wygenerowano za pośrednictwem serwisu Baza Konkurencyjności Funduszu Sprawiedliwości", fontSize: 7 },
        { text: `Suma kontrolna: ${checksum}`, fontSize: 6.5, color: "#374151", margin: [0, 2, 0, 0] },
      ],
    }),
    info: {
      title: `${announcement.procedureNumber} - ${announcement.title}`,
      author: "Baza Konkurencyjności Funduszu Sprawiedliwości",
      subject: "Ogłoszenie o zamówieniu",
    },
  };

  return pdfMake.createPdf(definition).getBuffer();
}
