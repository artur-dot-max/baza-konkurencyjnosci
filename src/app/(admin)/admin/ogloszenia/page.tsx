"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "100");
      const res = await fetch(`/api/announcements?${params.toString()}`);
      const data = await res.json();
      if (data.data) setAnnouncements(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAnnouncements();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAnnouncements]);

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć to ogłoszenie?")) return;
    try {
      await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      fetchAnnouncements();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy-900">Zarządzanie ogłoszeniami</h1>

      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Szukaj po tytule lub numerze..."
          aria-label="Szukaj ogłoszeń po tytule lub numerze"
          className="border p-2 rounded w-full max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          aria-label="Filtruj po statusie"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Wszystkie statusy</option>
          <option value="DRAFT">Szkic</option>
          <option value="PUBLISHED">Opublikowane</option>
          <option value="IN_PROGRESS">W trakcie</option>
          <option value="RESOLVED">Rozstrzygnięte</option>
          <option value="COMPLETED">Zakończone</option>
          <option value="CANCELLED">Unieważnione</option>
        </select>
      </div>

      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">Lista ogłoszeń (admin)</caption>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Numer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tytuł</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Organizacja</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Data publ.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">Ładowanie...</td></tr>
            ) : announcements.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Brak ogłoszeń</td></tr>
            ) : announcements.map((a) => (
              <tr key={a.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{a.procedureNumber}</td>
                <td className="px-6 py-4 text-sm truncate max-w-xs">{a.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{a.organization?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-800"}`}>
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{a.publishedAt ? formatDate(a.publishedAt) : "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={a.status === "DRAFT" ? `/panel/ogloszenia` : `/ogloszenia/${a.id}`}>Podgląd</Link>
                  </Button>
                  {a.status === "DRAFT" && (
                    <Button variant="destructive" size="sm" onClick={() => deleteAnnouncement(a.id)}>
                      Usuń
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
