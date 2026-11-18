import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDateTime, STATUS_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function ContractorOffersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/logowanie");

  const offers = await prisma.offer.findMany({
    where: { userId: session.user.id },
    orderBy: { submittedAt: "desc" },
    include: {
      announcement: { select: { id: true, title: true, procedureNumber: true, status: true } },
      attachments: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#145447]">Panel wykonawcy</h1>
        <p className="text-sm text-gray-600 mt-1">Historia ofert złożonych po zalogowaniu na Twoje konto.</p>
      </div>

      <div className="space-y-4">
        {offers.map((offer) => (
          <article key={offer.id} className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/ogloszenia/${offer.announcement.id}`}
                  className="font-semibold text-[#145447] hover:underline"
                >
                  {offer.announcement.title}
                </Link>
                <p className="text-xs text-gray-600 mt-0.5">{offer.announcement.procedureNumber}</p>
              </div>
              <Badge variant="secondary">
                {STATUS_LABELS[offer.announcement.status] || offer.announcement.status}
              </Badge>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-gray-500">Numer potwierdzenia</dt>
                <dd className="font-mono font-medium break-all">{offer.id}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Data złożenia</dt>
                <dd className="font-medium">{formatDateTime(offer.submittedAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Cena brutto</dt>
                <dd className="font-semibold">
                  {Number(offer.price).toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Wykonawca</dt>
                <dd className="font-medium">{offer.bidderName}</dd>
              </div>
            </dl>
            {offer.description && (
              <div className="mt-3 text-sm">
                <p className="text-gray-500 mb-1">Opis oferty</p>
                <p className="whitespace-pre-wrap text-gray-800">{offer.description}</p>
              </div>
            )}
            <div className="mt-3 text-sm">
              <p className="text-gray-500 mb-1">Załączniki</p>
              {offer.attachments.length ? (
                <ul className="space-y-1">
                  {offer.attachments.map((file) => (
                    <li key={file.id}>
                      <a
                        href={file.filePath}
                        className="text-[#145447] underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {file.originalName}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">—</p>
              )}
            </div>
          </article>
        ))}
        {offers.length === 0 && (
          <div className="rounded-lg border bg-white px-4 py-10 text-center text-gray-500 shadow-sm">
            Brak złożonych ofert.{" "}
            <Link href="/ogloszenia" className="text-[#145447] underline">
              Przeglądaj ogłoszenia
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
