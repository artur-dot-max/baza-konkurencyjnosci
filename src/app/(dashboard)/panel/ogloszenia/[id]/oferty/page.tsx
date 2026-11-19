import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, SUBMISSION_METHOD_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { canWriteOrganization } from "@/lib/access";
import { headers } from "next/headers";
import { markOffersOpened } from "@/lib/offer-open";
import { auditHeadersContext } from "@/lib/audit-context";
import { ManualOfferForm } from "@/components/offers/manual-offer-form";

export default async function OffersPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/logowanie");
  const { id } = await params;
  const access = await prisma.announcement.findFirst({
    where: { id, ...(session.user.role !== "ADMIN" && { organizationId: session.user.organizationId || "__none__" }) },
    select: { id: true, organizationId: true },
  });
  if (!access) notFound();
  if (session.user.role === "ORGANIZATION") {
    await markOffersOpened(id, session.user.id, auditHeadersContext(await headers(), `/panel/ogloszenia/${id}/oferty`));
  }
  const announcement = await prisma.announcement.findUniqueOrThrow({
    where: { id },
    include: { offers: { orderBy: { submittedAt: "asc" }, include: { attachments: true, enteredBy: { select: { email: true } }, openedBy: { select: { email: true } } } } },
  });

  const canWrite = canWriteOrganization(session, announcement.organizationId);
  const canResolve = canWrite && ["PUBLISHED", "IN_PROGRESS"].includes(announcement.status);
  const externalMethods = announcement.submissionMethods.filter((method) => method !== "PLATFORM");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600">{announcement.procedureNumber}</p>
          <h1 className="text-2xl font-bold text-navy-900">Oferty: {announcement.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href={`/api/announcements/${id}/offers/export?format=csv`}>Eksport CSV</a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/api/announcements/${id}/offers/export?format=txt`}>Eksport TXT</a>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/panel/ogloszenia">Wróć do ogłoszeń</Link>
          </Button>
          {canResolve && (
            <Button asChild className="bg-[#145447] hover:bg-[#0D4036] text-white">
              <Link href={`/panel/ogloszenia/${id}/rozstrzygniecie`}>Rozstrzygnij postępowanie</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <p className="font-semibold">Liczba złożonych ofert: {announcement.offers.length}</p>
        <p className="mt-1 text-sm text-gray-600">
          Dane są poufne i dostępne wyłącznie dla zamawiającego oraz administratora.
          {canResolve
            ? " Po upływie terminu składania ofert możesz wybrać wykonawcę przyciskiem „Wybierz”."
            : ""}
        </p>
      </div>

      {canWrite && canResolve && externalMethods.length > 0 && (
        <ManualOfferForm announcementId={id} methods={externalMethods} />
      )}

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <caption className="sr-only">Oferty</caption>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Data złożenia</th>
              <th className="px-4 py-3 text-left">Sposób złożenia</th>
              <th className="px-4 py-3 text-left">Wykonawca</th>
              <th className="px-4 py-3 text-left">NIP</th>
              <th className="px-4 py-3 text-left">E-mail</th>
              <th className="px-4 py-3 text-right">Cena brutto</th>
              <th className="px-4 py-3 text-left">Opis</th>
              <th className="px-4 py-3 text-left">Załączniki</th>
              <th className="px-4 py-3 text-left">Odczyt oferty</th>
              {canResolve && <th className="px-4 py-3 text-right">Akcja</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {announcement.offers.length ? (
              announcement.offers.map((offer) => {
                const selectHref = `/panel/ogloszenia/${id}/rozstrzygniecie?contractorName=${encodeURIComponent(offer.bidderName)}&contractorNip=${encodeURIComponent(offer.bidderNip || "")}&price=${encodeURIComponent(String(offer.price))}`;
                return (
                  <tr key={offer.id}>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(offer.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <span>{SUBMISSION_METHOD_LABELS[offer.submissionMethod] || offer.submissionMethod}</span>
                      {offer.enteredBy && <span className="mt-1 block text-xs text-gray-500">Wprowadzona przez: {offer.enteredBy.email}</span>}
                      {offer.entryNote && <span className="mt-1 block max-w-xs whitespace-pre-wrap text-xs text-gray-600">{offer.entryNote}</span>}
                    </td>
                    <td className="px-4 py-3 font-medium">{offer.bidderName}</td>
                    <td className="whitespace-nowrap px-4 py-3">{offer.bidderNip || "—"}</td>
                    <td className="px-4 py-3">
                      <a className="text-[#145447] underline" href={`mailto:${offer.bidderEmail}`}>
                        {offer.bidderEmail}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                      {Number(offer.price).toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
                    </td>
                    <td className="max-w-sm whitespace-pre-wrap px-4 py-3">{offer.description || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      {offer.attachments.length
                        ? offer.attachments.map((file) => (
                            <a key={file.id} href={file.filePath} className="block text-[#145447] underline" target="_blank" rel="noopener noreferrer">
                              {file.originalName}
                            </a>
                          ))
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {offer.submissionMethod === "PLATFORM"
                        ? offer.openedAt
                          ? <><span>{formatDateTime(offer.openedAt)}</span>{offer.openedBy && <span className="block text-xs text-gray-500">{offer.openedBy.email}</span>}</>
                          : "Nie odczytano"
                        : "Nie dotyczy — wpisana ręcznie"}
                    </td>
                    {canResolve && (
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Button asChild size="sm" variant="secondary">
                          <Link href={selectHref}>Wybierz</Link>
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={canResolve ? 10 : 9} className="px-4 py-10 text-center text-gray-600">
                  Nie złożono jeszcze żadnej oferty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
