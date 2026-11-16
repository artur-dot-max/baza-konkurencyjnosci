"use client";

import { Fragment, useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ErrorLog = {
  id: string;
  message: string;
  stack?: string | null;
  path?: string | null;
  method?: string | null;
  statusCode: number;
  details?: string | null;
  ipAddress?: string | null;
  user?: { email?: string | null } | null;
  createdAt: string;
};

export default function AdminErrorLogPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/errorlogs?limit=50");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nie udało się pobrać dziennika błędów");
      setLogs(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać dziennika błędów");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Dziennik błędów</h1>
          <p className="text-gray-600 mt-1">Zapisane błędy aplikacji i nieudane operacje API.</p>
        </div>
        <Button variant="outline" onClick={fetchLogs}>Odśwież</Button>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>
      )}

      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">Dziennik błędów</caption>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ścieżka</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Komunikat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Użytkownik</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Szczegóły</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">Ładowanie...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Brak zapisanych błędów.</td></tr>
            ) : (
              logs.map((log) => (
                <Fragment key={log.id}>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(log.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-700">{log.statusCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {[log.method, log.path].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-md truncate" title={log.message}>{log.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{log.user?.email || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId((current) => (current === log.id ? null : log.id))}
                      >
                        {expandedId === log.id ? "Ukryj" : "Pokaż"}
                      </Button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 px-6 py-4 text-sm text-gray-700">
                        <div className="space-y-2">
                          <p><span className="font-semibold">IP:</span> {log.ipAddress || "—"}</p>
                          {log.details && <p><span className="font-semibold">Typ:</span> {log.details}</p>}
                          {log.stack && (
                            <pre className="overflow-x-auto rounded-md border bg-white p-3 text-xs text-gray-800 whitespace-pre-wrap">
                              {log.stack}
                            </pre>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
