"use client";

import { useCallback, useEffect, useState } from "react";
import { auditActionLabel, auditEntityLabel, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AuditLog = {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  user: { id: string; email: string; name: string | null; role: string } | null;
};

function readableDetails(value: string | null) {
  if (!value) return "—";
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

export default function AdminEventLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/auditlogs?page=${page}&limit=100`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nie udało się pobrać logów");
      setLogs(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotal(result.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Dziennik zdarzeń</h1>
        <p className="mt-1 text-gray-600">Pełna historia operacji, logowań, odczytów ofert i wyświetleń stron. Łącznie: {total}.</p>
      </div>

      <div className="overflow-x-auto rounded-md bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">Dziennik zdarzeń</caption>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">Data i czas</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">Użytkownik</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">Operacja</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">Obiekt</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">IP</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">Szczegóły techniczne</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center">Ładowanie...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-500">Brak zapisanych zdarzeń.</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-4 text-sm">{formatDateTime(log.createdAt)}<span className="block font-mono text-xs text-gray-500">{log.id}</span></td>
                <td className="px-4 py-4 text-sm">
                  <span className="font-medium">{log.user?.email || "Użytkownik anonimowy/system"}</span>
                  {log.user && <><span className="block text-xs text-gray-500">{log.user.name || "bez nazwy"} · {log.user.role}</span><span className="block font-mono text-xs text-gray-500">{log.user.id}</span></>}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">{auditActionLabel(log.action)}<span className="block font-mono text-xs text-gray-500">{log.action}</span></td>
                <td className="px-4 py-4 text-sm">{auditEntityLabel(log.entity)}<span className="block font-mono text-xs text-gray-500">{log.entity}</span>{log.entityId && <span className="block break-all font-mono text-xs text-gray-500">{log.entityId}</span>}</td>
                <td className="whitespace-nowrap px-4 py-4 font-mono text-sm">{log.ipAddress || "—"}</td>
                <td className="min-w-80 px-4 py-4 text-sm">
                  <details>
                    <summary className="cursor-pointer font-medium text-[#145447]">Pokaż pełne dane</summary>
                    <dl className="mt-2 space-y-2 text-xs">
                      <div><dt className="font-semibold">User-Agent</dt><dd className="break-all font-mono">{log.userAgent || "—"}</dd></div>
                      <div><dt className="font-semibold">Szczegóły</dt><dd><pre className="max-w-xl whitespace-pre-wrap break-all rounded bg-gray-50 p-2">{readableDetails(log.details)}</pre></dd></div>
                    </dl>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Poprzednia strona</Button>
        <span className="text-sm text-gray-600">Strona {page} z {totalPages}</span>
        <Button variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Następna strona</Button>
      </div>
    </div>
  );
}
