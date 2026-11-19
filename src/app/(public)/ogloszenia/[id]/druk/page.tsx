import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isPublicAnnouncement } from "@/lib/access";
import { sanitizeRichText } from "@/lib/sanitize";
import { sha256Checksum } from "@/lib/checksum";
import { formatDate, formatDateTime, HISTORY_ACTION_LABELS, ORDER_TYPE_LABELS, STATUS_LABELS, SUBMISSION_METHOD_LABELS } from "@/lib/utils";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wydruk ogłoszenia",
  robots: { index: false, follow: false },
};

export default async function PrintAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      organization: { select: { name: true, address: true, postalCode: true, city: true } },
      criteria: { orderBy: { id: "asc" } },
      attachments: { orderBy: { id: "asc" } },
      questions: { where: { isPublic: true }, orderBy: { createdAt: "asc" }, include: { answers: { orderBy: { createdAt: "asc" } } } },
      history: { orderBy: { createdAt: "asc" } },
      result: true,
    },
  });
  if (!announcement || !isPublicAnnouncement(announcement)) notFound();

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

  const field = (label: string, value: React.ReactNode) => (
    <div><dt className="text-xs font-semibold uppercase text-gray-600">{label}</dt><dd className="mt-1 text-gray-950">{value || "—"}</dd></div>
  );

  return (
    <div className="print-document mx-auto max-w-4xl bg-white px-5 py-8 sm:px-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-gray-50 p-4">
        <Link href={`/ogloszenia/${announcement.id}`} className="font-semibold text-[#145447] hover:underline">← Wróć do ogłoszenia</Link>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/announcements/${announcement.id}/pdf`} download className="rounded-md border border-[#145447] px-4 py-2 text-sm font-semibold text-[#145447] hover:bg-[#F0F7F4]">Pobierz PDF</a>
          <PrintButton />
        </div>
      </div>

      <header className="print-content-header border-b-2 border-[#145447] pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#145447]">Baza Konkurencyjności Funduszu Sprawiedliwości</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-950">{announcement.title}</h1>
        <p className="mt-2 font-mono text-sm text-gray-700">{announcement.procedureNumber}</p>
      </header>

      <div className="mt-6 space-y-6">
        <section className="print-section">
          <h2 className="mb-3 border-b pb-2 text-lg font-bold text-[#145447]">Dane podstawowe</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            {field("Status", STATUS_LABELS[announcement.status] || announcement.status)}
            {field("Rodzaj zamówienia", ORDER_TYPE_LABELS[announcement.orderType] || announcement.orderType)}
            {field("Zamawiający", announcement.organization.name)}
            {field("Miejsce realizacji", [announcement.location, announcement.voivodeship].filter(Boolean).join(", "))}
            {field("Data i godzina otwarcia", announcement.publishedAt && formatDateTime(announcement.publishedAt))}
            {field("Data i godzina zamknięcia składania ofert", announcement.bidsDeadline && formatDateTime(announcement.bidsDeadline))}
            {field("Termin realizacji", announcement.executionTerm)}
          </dl>
        </section>

        <section>
          <h2 className="mb-3 border-b pb-2 text-lg font-bold text-[#145447]">Opis przedmiotu zamówienia</h2>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeRichText(announcement.description) }} />
        </section>

        {announcement.conditions && <section>
          <h2 className="mb-3 border-b pb-2 text-lg font-bold text-[#145447]">Warunki udziału</h2>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeRichText(announcement.conditions) }} />
        </section>}

        <section className="print-section">
          <h2 className="mb-3 border-b pb-2 text-lg font-bold text-[#145447]">Kryteria oceny ofert</h2>
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Kryteria oceny</caption>
            <thead><tr className="bg-gray-100"><th className="border p-2">Kryterium</th><th className="w-28 border p-2">Waga</th></tr></thead>
            <tbody>{announcement.criteria.map((criterion) => <tr key={criterion.id}><td className="border p-2">{criterion.name}{criterion.description && <div className="text-xs text-gray-600">{criterion.description}</div>}</td><td className="border p-2">{criterion.weight}%</td></tr>)}</tbody>
          </table>
        </section>

        <section className="print-section">
          <h2 className="mb-3 border-b pb-2 text-lg font-bold text-[#145447]">Składanie ofert i kontakt</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            {field("Sposoby składania ofert", announcement.submissionMethods.map((method) => SUBMISSION_METHOD_LABELS[method] || method).join(", "))}
            {announcement.submissionMethods.includes("E_DELIVERY") && field("Adres do e-Doręczeń", announcement.eDeliveryAddress)}
            {announcement.submissionMethods.includes("IN_PERSON") && field("Miejsce złożenia", `${announcement.organization.address}, ${announcement.organization.postalCode} ${announcement.organization.city}`)}
            {field("Osoba do kontaktu", announcement.contactPerson)}
            {field("E-mail", announcement.contactEmail)}
            {field("Telefon", announcement.contactPhone)}
          </dl>
        </section>

        <section className="print-section">
          <h2 className="mb-3 border-b pb-2 text-lg font-bold text-[#145447]">Załączniki</h2>
          {announcement.attachments.length ? <ul className="list-disc space-y-1 pl-5">{announcement.attachments.map((attachment) => <li key={attachment.id}>{attachment.originalName} ({Math.round(attachment.fileSize / 1024)} KB)</li>)}</ul> : <p>Brak załączników.</p>}
        </section>

        {announcement.result && <section className="print-section">
          <h2 className="mb-3 border-b pb-2 text-lg font-bold text-[#145447]">Wynik postępowania</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            {field("Wybrany wykonawca", announcement.result.contractorName)}
            {field("NIP", announcement.result.contractorNip)}
            {field("Cena", Number(announcement.result.price).toLocaleString("pl-PL", { style: "currency", currency: "PLN" }))}
            {field("Uzasadnienie", announcement.result.justification)}
          </dl>
        </section>}

        {announcement.status === "CANCELLED" && announcement.cancellationReason && <section className="print-section">
          <h2 className="mb-3 border-b pb-2 text-lg font-bold text-[#145447]">Informacja o unieważnieniu</h2>
          <p>{announcement.cancellationReason}</p>
        </section>}

        <section>
          <h2 className="mb-3 border-b pb-2 text-lg font-bold text-[#145447]">Pytania i odpowiedzi</h2>
          {announcement.questions.length ? <div className="space-y-4">{announcement.questions.map((question) => <div key={question.id} className="print-section border-l-2 border-gray-300 pl-3"><p className="font-semibold">Pytanie z {formatDate(question.createdAt)}</p><p>{question.content}</p>{question.answers.map((answer) => <div key={answer.id} className="mt-2 pl-3"><p className="text-xs font-semibold">Odpowiedź z {formatDate(answer.createdAt)}</p><p>{answer.content}</p></div>)}</div>)}</div> : <p>Brak pytań.</p>}
        </section>

        <section>
          <h2 className="mb-3 border-b pb-2 text-lg font-bold text-[#145447]">Historia zmian</h2>
          {announcement.history.length ? <ul className="space-y-2">{announcement.history.map((entry) => <li key={entry.id} className="print-section"><span className="font-semibold">{formatDateTime(entry.createdAt)} — {HISTORY_ACTION_LABELS[entry.action] || entry.action}</span>{entry.details && <span>: {entry.details}</span>}</li>)}</ul> : <p>Brak historii zmian.</p>}
        </section>
      </div>

      <footer className="print-footer mt-10 border-t-2 border-gray-800 pt-4 text-xs leading-relaxed text-gray-800">
        <p><strong>Wygenerowano:</strong> {formatDateTime(generatedAt)}</p>
        <p>Wygenerowano za pośrednictwem serwisu Baza Konkurencyjności Funduszu Sprawiedliwości</p>
        <p className="mt-2 break-all font-mono"><strong>Suma kontrolna:</strong> {checksum}</p>
      </footer>
    </div>
  );
}
