import type { QueuedMailAttachment } from "./mail";

type ReceiptOffer = {
  id: string;
  bidderName: string;
  bidderEmail: string | null;
  bidderNip: string | null;
  price: string | number | { toString(): string };
  description: string | null;
  submittedAt: Date;
  submissionMethod: string;
};

type ReceiptAnnouncement = {
  procedureNumber: string;
  title: string;
};

type ReceiptAttachment = {
  fileName: string;
  originalName: string;
  mimeType: string;
};

const METHOD_LABELS: Record<string, string> = {
  PLATFORM: "przez Bazę Konkurencyjności",
  EMAIL: "mailowo",
  IN_PERSON: "w formie papierowej/osobiście",
  E_DELIVERY: "przez e-Doręczenia",
};

export function offerReceiptText(
  announcement: ReceiptAnnouncement,
  offer: ReceiptOffer,
  attachments: ReceiptAttachment[],
  recipient: "BIDDER" | "ORGANIZATION",
  link: string,
): string {
  const heading = recipient === "BIDDER"
    ? "Potwierdzamy przyjęcie Twojej oferty."
    : "Do ogłoszenia złożono nową ofertę.";
  return [
    heading,
    "",
    `Ogłoszenie: ${announcement.title}`,
    `Numer postępowania: ${announcement.procedureNumber}`,
    `Numer potwierdzenia: ${offer.id}`,
    `Data i godzina złożenia: ${new Intl.DateTimeFormat("pl-PL", { dateStyle: "full", timeStyle: "medium", timeZone: "Europe/Warsaw" }).format(offer.submittedAt)}`,
    `Sposób złożenia: ${METHOD_LABELS[offer.submissionMethod] ?? offer.submissionMethod}`,
    "",
    "Pełna treść oferty:",
    `Wykonawca: ${offer.bidderName}`,
    `NIP: ${offer.bidderNip || "nie podano"}`,
    `Adres e-mail: ${offer.bidderEmail || "nie podano"}`,
    `Cena brutto: ${offer.price.toString()} PLN`,
    `Opis: ${offer.description || "nie podano"}`,
    `Załączniki: ${attachments.length ? attachments.map((file) => file.originalName).join(", ") : "brak"}`,
    "",
    recipient === "BIDDER" ? `Ogłoszenie: ${link}` : `Oferty w panelu: ${link}`,
    "",
    "Załączniki oferty, jeżeli zostały dodane, są dołączone do tej wiadomości.",
  ].join("\n");
}

export function queuedOfferAttachments(attachments: ReceiptAttachment[]): QueuedMailAttachment[] {
  return attachments.map(({ fileName, originalName, mimeType }) => ({ fileName, originalName, mimeType }));
}
