"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUBMISSION_METHOD_LABELS } from "@/lib/utils";

type UploadedFile = { id: string; originalName: string };

function currentLocalDateTime() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function ManualOfferForm({ announcementId, methods }: { announcementId: string; methods: string[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      const next = [...attachments];
      for (const file of Array.from(files)) {
        if (next.length >= 5) break;
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/offers/upload", { method: "POST", body });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Nie udało się przesłać pliku");
        next.push({ id: result.file.id, originalName: result.file.originalName });
      }
      setAttachments(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nie udało się przesłać pliku");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const submittedAt = new Date(String(form.get("submittedAt")));
    try {
      const response = await fetch(`/api/announcements/${announcementId}/offers/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bidderName: form.get("bidderName"),
          bidderEmail: form.get("bidderEmail"),
          bidderNip: form.get("bidderNip"),
          price: form.get("price"),
          description: form.get("description"),
          submissionMethod: form.get("submissionMethod"),
          submittedAt: submittedAt.toISOString(),
          entryNote: form.get("entryNote"),
          attachmentIds: attachments.map((file) => file.id),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nie udało się dodać oferty");
      setAttachments([]);
      setExpanded(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nie udało się dodać oferty");
    } finally {
      setSending(false);
    }
  }

  if (!expanded) {
    return <Button type="button" onClick={() => setExpanded(true)}>Dodaj ofertę złożoną poza systemem</Button>;
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Wprowadź ofertę złożoną poza systemem</h2>
          <p className="text-sm text-gray-600">Przepisz dane z oferty papierowej, e-mailowej lub e‑Doręczenia.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setExpanded(false)}>Anuluj</Button>
      </div>
      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="manual-bidder-name">Nazwa wykonawcy</Label><Input id="manual-bidder-name" name="bidderName" required maxLength={300} /></div>
        <div className="space-y-2"><Label htmlFor="manual-bidder-nip">NIP (opcjonalnie)</Label><Input id="manual-bidder-nip" name="bidderNip" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} /></div>
        <div className="space-y-2"><Label htmlFor="manual-bidder-email">E-mail (opcjonalnie)</Label><Input id="manual-bidder-email" name="bidderEmail" type="email" maxLength={254} /></div>
        <div className="space-y-2"><Label htmlFor="manual-price">Cena brutto (PLN)</Label><Input id="manual-price" name="price" type="number" min="0.01" max="9999999999.99" step="0.01" required /></div>
        <div className="space-y-2">
          <Label htmlFor="manual-method">Sposób złożenia</Label>
          <select id="manual-method" name="submissionMethod" required className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {methods.map((method) => <option key={method} value={method}>{SUBMISSION_METHOD_LABELS[method] || method}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label htmlFor="manual-submitted-at">Data i godzina złożenia</Label><Input id="manual-submitted-at" name="submittedAt" type="datetime-local" max={currentLocalDateTime()} defaultValue={currentLocalDateTime()} required /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="manual-description">Treść/opis oferty (opcjonalnie)</Label><textarea id="manual-description" name="description" maxLength={10000} className="min-h-28 w-full rounded-md border border-input px-3 py-2 text-sm" /></div>
      <div className="space-y-2"><Label htmlFor="manual-note">Informacja dodatkowa (opcjonalnie)</Label><textarea id="manual-note" name="entryNote" maxLength={2000} className="min-h-20 w-full rounded-md border border-input px-3 py-2 text-sm" /></div>
      <div className="space-y-2">
        <Label htmlFor="manual-files">Załączniki (opcjonalnie, maks. 5 × 10 MB)</Label>
        <Input id="manual-files" type="file" multiple disabled={uploading || attachments.length >= 5} onChange={uploadFiles} />
        {attachments.length > 0 && <ul className="space-y-1 text-sm">{attachments.map((file) => <li key={file.id} className="flex justify-between gap-3"><span>{file.originalName}</span><button type="button" className="text-[#145447] underline" onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))}>Usuń</button></li>)}</ul>}
      </div>
      <Button type="submit" disabled={sending || uploading}>{sending ? "Zapisywanie..." : "Zapisz ofertę"}</Button>
    </form>
  );
}
