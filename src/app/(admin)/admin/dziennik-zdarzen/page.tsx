"use client";

import { useState, useEffect } from "react";
import { auditActionLabel, auditEntityLabel, formatDateTime } from "@/lib/utils";

export default function AdminEventLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auditlogs`);
      const data = await res.json();
      if (data.data) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Dziennik zdarzeń</h1>
        <p className="text-gray-600 mt-1">Historia operacji użytkowników i systemu.</p>
      </div>

      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">Dziennik zdarzeń</caption>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Użytkownik</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Operacja</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Obiekt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID obiektu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Adres IP</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">Ładowanie...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Brak zapisanych zdarzeń.</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(log.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{log.user?.email || "System"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{auditActionLabel(log.action)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{auditEntityLabel(log.entity)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{log.entityId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
