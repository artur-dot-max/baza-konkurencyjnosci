"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateTime, USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type UserRow = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  status: string;
};

type AdminMessage = {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  sender?: { email?: string | null } | null;
  recipients: Array<{ id: string; email: string; user?: { name?: string | null } | null }>;
};

export default function AdminMessagesPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const usersRes = await fetch("/api/users?limit=100");
      const usersData = await usersRes.json();
      if (!usersRes.ok) throw new Error(usersData.error || "Nie udało się pobrać użytkowników");
      setUsers(usersData.data || []);

      const messagesRes = await fetch("/api/admin/messages?limit=20");
      const messagesData = await messagesRes.json();
      if (!messagesRes.ok) {
        setMessages([]);
        setError(messagesData.error || "Nie udało się pobrać historii wiadomości");
      } else {
        setMessages(messagesData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać danych");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      user.email.toLowerCase().includes(query) ||
      (user.name || "").toLowerCase().includes(query),
    );
  }, [users, search]);

  const toggleUser = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const user of filteredUsers) next.add(user.id);
      return [...next];
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, userIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nie udało się wysłać wiadomości");
      setSubject("");
      setBody("");
      setSelectedIds([]);
      setSuccess(`Wiadomość została zakolejkowana do ${data.recipients?.length || selectedIds.length} odbiorców.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać wiadomości");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Wiadomości</h1>
        <p className="text-gray-600 mt-1">
          Wysyłaj wiadomości e-mail do wybranych zarejestrowanych użytkowników.
        </p>
      </div>

      {error && <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>}
      {success && <p role="status" className="rounded-md border border-green-300 bg-green-50 p-3 text-green-900">{success}</p>}

      <form onSubmit={sendMessage} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#145447]">Nowa wiadomość</h2>
          <div className="space-y-2">
            <Label htmlFor="message-subject">Temat</Label>
            <Input
              id="message-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
              placeholder="Temat wiadomości"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message-body">Treść</Label>
            <Textarea
              id="message-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={8}
              maxLength={10000}
              placeholder="Treść wiadomości..."
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600">Wybrano: {selectedIds.length}</p>
            <Button
              type="submit"
              disabled={sending || selectedIds.length === 0 || !subject.trim() || !body.trim()}
              className="bg-[#145447] hover:bg-[#0D4036] text-white"
            >
              {sending ? "Wysyłanie..." : "Wyślij wiadomość"}
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#145447]">Odbiorcy</h2>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllFiltered}>Zaznacz widocznych</Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>Wyczyść</Button>
            </div>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po e-mailu lub nazwie..."
            aria-label="Szukaj odbiorców po e-mailu lub nazwie"
          />
          <div className="max-h-[420px] overflow-y-auto rounded-md border divide-y">
            {loading ? (
              <p className="p-4 text-sm text-gray-500">Ładowanie użytkowników...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">Brak użytkowników spełniających kryteria.</p>
            ) : (
              filteredUsers.map((user) => {
                const checked = selectedIds.includes(user.id);
                return (
                  <label key={user.id} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-gray-50">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleUser(user.id)}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-gray-900">{user.email}</span>
                      <span className="block text-sm text-gray-600">
                        {[
                          user.name,
                          USER_ROLE_LABELS[user.role] || user.role,
                          USER_STATUS_LABELS[user.status] || user.status,
                        ].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </form>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-navy-900">Wysłane wiadomości</h2>
        <div className="bg-white rounded-md shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">Wiadomości</caption>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Temat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Odbiorcy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nadawca</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center">Ładowanie...</td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Brak wysłanych wiadomości.</td></tr>
              ) : (
                messages.map((message) => (
                  <tr key={message.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(message.createdAt)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{message.subject}</div>
                      <div className="mt-1 text-gray-600 line-clamp-2">{message.body}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {message.recipients.length}: {message.recipients.map((recipient) => recipient.email).join(", ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{message.sender?.email || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
