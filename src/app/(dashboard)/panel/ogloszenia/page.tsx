import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDateTime, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { announcementTimeState } from "@/lib/announcement-lifecycle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function MyAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/logowanie");
  }

  const resolvedSearchParams = await searchParams;
  const statusFilter = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : undefined;
  const searchFilter = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const unansweredOnly = resolvedSearchParams.unanswered === "1";

  const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page, 10) : 1;
  const pageSize = 10;

  const whereClause: Record<string, unknown> = {
    organizationId: session.user.organizationId,
  };

  if (statusFilter && statusFilter !== "ALL") {
    whereClause.status = statusFilter;
  }

  if (searchFilter) {
    whereClause.OR = [
      { procedureNumber: { contains: searchFilter, mode: "insensitive" } },
      { title: { contains: searchFilter, mode: "insensitive" } },
    ];
  }

  if (unansweredOnly) {
    whereClause.status = { in: ["PUBLISHED", "IN_PROGRESS"] };
    whereClause.questions = { some: { answers: { none: {} } } };
  }

  const totalCount = await prisma.announcement.count({ where: whereClause });
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const announcements = await prisma.announcement.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    include: {
      _count: {
        select: {
          offers: true,
          questions: true,
        },
      },
      questions: {
        where: { answers: { none: {} } },
        select: { id: true },
      },
    },
  });

  const querySuffix = `${searchFilter ? `&q=${encodeURIComponent(searchFilter)}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}${unansweredOnly ? "&unanswered=1" : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Moje ogłoszenia</h1>
          {unansweredOnly && (
            <p className="text-sm text-amber-800 mt-1">
              Filtr: ogłoszenia z pytaniami bez odpowiedzi.{" "}
              <Link href="/panel/ogloszenia" className="underline font-medium">Pokaż wszystkie</Link>
            </p>
          )}
        </div>
        <Button asChild className="bg-navy-800 hover:bg-navy-900">
          <Link href="/panel/nowe-ogloszenie" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Dodaj ogłoszenie</span>
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <form className="flex flex-col md:flex-row gap-4 mb-6" method="GET" action="/panel/ogloszenia">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
              <label htmlFor="ogloszenia-search" className="sr-only">Szukaj po numerze lub tytule</label>
              <Input id="ogloszenia-search" name="q" defaultValue={searchFilter || ""} placeholder="Szukaj po numerze lub tytule..." className="pl-9" />
            </div>
            <div className="w-full md:w-64">
              <label htmlFor="ogloszenia-status" className="sr-only">Status</label>
              <select
                id="ogloszenia-status"
                name="status"
                defaultValue={statusFilter || "ALL"}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ALL">Wszystkie statusy</option>
                <option value="PUBLISHED">Opublikowane</option>
                <option value="IN_PROGRESS">W toku</option>
                <option value="RESOLVED">Rozstrzygnięte</option>
                <option value="CANCELLED">Unieważnione</option>
              </select>
            </div>
            {unansweredOnly && <input type="hidden" name="unanswered" value="1" />}
            <Button type="submit">Szukaj</Button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <caption className="sr-only">Lista ogłoszeń</caption>
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">Numer</th>
                  <th className="px-4 py-3">Tytuł</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Otwarcie</th>
                  <th className="px-4 py-3">Zamknięcie ofert</th>
                  <th className="px-4 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((ann) => {
                  const open = ["PUBLISHED", "IN_PROGRESS"].includes(ann.status);
                  const timeState = announcementTimeState(ann);
                  const displayLabel = timeState === "SCHEDULED" ? "Zaplanowane" : timeState === "OPEN" ? "Otwarte" : timeState === "CLOSED" ? "Zamknięte" : STATUS_LABELS[ann.status as keyof typeof STATUS_LABELS] || ann.status;
                  const displayColor = timeState === "SCHEDULED" ? "bg-amber-100 text-amber-900" : timeState === "OPEN" ? "bg-green-100 text-green-800" : timeState === "CLOSED" ? "bg-gray-100 text-gray-800" : STATUS_COLORS[ann.status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-800";
                  const unanswered = ann.questions.length;
                  return (
                    <tr key={ann.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{ann.procedureNumber}</td>
                      <td className="px-4 py-3 max-w-md truncate" title={ann.title}>
                        {ann.title}
                        {unanswered > 0 && (
                          <Badge className="ml-2 bg-amber-100 text-amber-900 hover:bg-amber-100">
                            {unanswered} bez odp.
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={displayColor}>
                          {displayLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{ann.publishedAt ? formatDateTime(ann.publishedAt) : "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{ann.bidsDeadline ? formatDateTime(ann.bidsDeadline) : "-"}</td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/ogloszenia/${ann.id}`}>Podgląd</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/panel/ogloszenia/${ann.id}/edycja`}>Edytuj</Link>
                        </Button>
                        {open && (
                          <>
                            <Button asChild variant={unanswered > 0 ? "default" : "outline"} size="sm" className={unanswered > 0 ? "bg-amber-700 hover:bg-amber-800" : undefined}>
                              <Link href={`/panel/ogloszenia/${ann.id}/pytania`}>
                                Pytania ({ann._count.questions})
                                {unanswered > 0 ? ` · ${unanswered} bez odp.` : ""}
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/panel/ogloszenia/${ann.id}/oferty`}>
                                Oferty ({ann._count.offers})
                              </Link>
                            </Button>
                            <Button asChild variant="secondary" size="sm">
                              <Link href={`/panel/ogloszenia/${ann.id}/rozstrzygniecie`}>Rozstrzygnij</Link>
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {announcements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      Brak ogłoszeń spełniających kryteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              Strona {currentPage} z {totalPages} (łącznie {totalCount})
            </span>
            <div className="flex space-x-2">
              <Button asChild variant="outline" size="sm" disabled={currentPage <= 1}>
                <Link href={`/panel/ogloszenia?page=${currentPage - 1}${querySuffix}`}>
                  <ChevronLeft className="w-4 h-4" /> Poprzednia
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" disabled={currentPage >= totalPages}>
                <Link href={`/panel/ogloszenia?page=${currentPage + 1}${querySuffix}`}>
                  Następna <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
