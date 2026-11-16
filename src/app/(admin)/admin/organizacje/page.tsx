"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate, ORG_STATUS_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Org = {
  id: string;
  name: string;
  nip: string;
  regon: string;
  krs?: string | null;
  address: string;
  city: string;
  postalCode: string;
  voivodeship: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
};

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Org | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/organizations${query}`);
      const data = await res.json();
      if (data.data) setOrgs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const updateStatus = async (id: string, newStatus: string, reason?: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...(reason?.trim() ? { statusReason: reason.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nie udało się zaktualizować");
      setSelected(null);
      setBlockReason("");
      fetchOrgs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy-900">Zarządzanie organizacjami</h1>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <div className="flex gap-4">
        <label htmlFor="org-status-filter" className="sr-only">Filtr statusu organizacji</label>
        <select
          id="org-status-filter"
          className="border p-2 rounded"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtr statusu organizacji"
        >
          <option value="">Wszystkie statusy</option>
          <option value="ACTIVE">Aktywne</option>
          <option value="PENDING">Oczekujące</option>
          <option value="BLOCKED">Zablokowane</option>
        </select>
      </div>

      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">Lista organizacji</caption>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nazwa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">NIP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Województwo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rejestracja</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">Ładowanie...</td></tr>
            ) : orgs.map((org) => (
              <tr key={org.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{org.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{org.nip}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{org.voivodeship}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    org.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                    org.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {ORG_STATUS_LABELS[org.status] || org.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(org.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelected(org); setBlockReason(""); }}>
                    Podgląd
                  </Button>
                  {org.status === "PENDING" && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(org.id, "ACTIVE")}>
                      Akceptuj
                    </Button>
                  )}
                  {org.status === "ACTIVE" && (
                    <Button variant="outline" size="sm" onClick={() => setSelected(org)}>
                      Zablokuj
                    </Button>
                  )}
                  {org.status === "BLOCKED" && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(org.id, "ACTIVE")}>
                      Odblokuj
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setBlockReason(""); } }}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  Podgląd danych organizacji i działania administracyjne.
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-gray-600">NIP</dt><dd className="font-medium">{selected.nip}</dd></div>
                <div><dt className="text-gray-600">REGON</dt><dd className="font-medium">{selected.regon}</dd></div>
                <div><dt className="text-gray-600">KRS</dt><dd className="font-medium">{selected.krs || "—"}</dd></div>
                <div><dt className="text-gray-600">Status</dt><dd className="font-medium">{ORG_STATUS_LABELS[selected.status] || selected.status}</dd></div>
                <div className="col-span-2"><dt className="text-gray-600">Adres</dt><dd className="font-medium">{selected.address}, {selected.postalCode} {selected.city}, {selected.voivodeship}</dd></div>
                <div><dt className="text-gray-600">E-mail</dt><dd className="font-medium">{selected.email}</dd></div>
                <div><dt className="text-gray-600">Telefon</dt><dd className="font-medium">{selected.phone}</dd></div>
                <div className="col-span-2"><dt className="text-gray-600">Rejestracja</dt><dd className="font-medium">{formatDate(selected.createdAt)}</dd></div>
              </dl>

              {selected.status === "PENDING" && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button className="bg-[#145447] hover:bg-[#0D4036]" onClick={() => updateStatus(selected.id, "ACTIVE")}>
                    Akceptuj organizację
                  </Button>
                  <Button variant="destructive" onClick={() => updateStatus(selected.id, "BLOCKED")}>
                    Odrzuć / zablokuj
                  </Button>
                </div>
              )}

              {selected.status === "ACTIVE" && (
                <div className="space-y-2 pt-2">
                  <label htmlFor="block-reason" className="text-sm font-medium">Uzasadnienie blokady (opcjonalnie, do audytu lokalnego)</label>
                  <textarea
                    id="block-reason"
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-20"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Np. nieprawidłowe dane rejestrowe"
                  />
                  <Button variant="destructive" onClick={() => updateStatus(selected.id, "BLOCKED", blockReason)}>
                    Zablokuj organizację
                  </Button>
                </div>
              )}

              {selected.status === "BLOCKED" && (
                <Button className="bg-[#145447] hover:bg-[#0D4036]" onClick={() => updateStatus(selected.id, "ACTIVE")}>
                  Odblokuj organizację
                </Button>
              )}

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelected(null)}>Zamknij</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
