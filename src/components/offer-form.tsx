"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { buildOfferPayload, offerSchema } from "@/lib/offer-validation";

type UploadedFile = { id: string; originalName: string };

type FieldErrors = Partial<Record<"bidderName" | "bidderEmail" | "bidderNip" | "price" | "confirmation", string>>;

function ContractorSignupHint({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-lg border border-[#D7E8DF] bg-[#F0F7F4] text-[#123F36] ${compact ? "p-4" : "p-5"}`}>
      <p className="font-semibold text-[#145447]">Konto wykonawcy jest opcjonalne</p>
      <p className="mt-1 text-sm">
        Ofertę możesz złożyć bez rejestracji. Założenie konta pozwala m.in. przeglądać historię złożonych ofert
        i statusy postępowań w panelu wykonawcy.
      </p>
      <p className="mt-3">
        <Link
          href="/rejestracja-wykonawcy"
          className="text-sm font-medium text-[#145447] underline underline-offset-2 hover:text-[#0D4036]"
        >
          Załóż darmowe konto wykonawcy
        </Link>
        {" · "}
        <Link href="/logowanie" className="text-sm text-[#145447] underline underline-offset-2">
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}

export function OfferForm({ announcementId }: { announcementId: string }) {
  const { data: session, status } = useSession();
  const isContractor = session?.user?.role === "CONTRACTOR";
  const showSignupHint = status !== "loading" && !isContractor;

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [receipt, setReceipt] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  async function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
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
        const res = await fetch("/api/offers/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Nie udało się przesłać pliku");
        next.push({ id: data.file.id, originalName: data.file.originalName });
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
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const payload = buildOfferPayload(form, confirmed, attachments.map((a) => a.id));
    const parsed = offerSchema.safeParse(payload);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && (key === "bidderName" || key === "bidderEmail" || key === "bidderNip" || key === "price" || key === "confirmation") && !next[key]) {
          next[key] = issue.message;
        }
      }
      setFieldErrors(next);
      setSending(false);
      return;
    }
    try {
      const response = await fetch(`/api/announcements/${announcementId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nie udało się złożyć oferty");
      setReceipt(result.id);
      setConfirmed(false);
      setAttachments([]);
      event.currentTarget.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nie udało się złożyć oferty");
    } finally {
      setSending(false);
    }
  }

  if (receipt) {
    return (
      <div className="space-y-4">
        <div role="status" className="rounded-lg border border-green-300 bg-green-50 p-5 text-green-900">
          <p className="font-bold">Oferta została złożona.</p>
          <p className="mt-2">
            Numer potwierdzenia: <span className="font-mono font-semibold">{receipt}</span>
          </p>
          <p className="mt-1 text-sm">Zapisz numer potwierdzenia. Dane oferty są widoczne wyłącznie dla zamawiającego.</p>
        </div>
        {showSignupHint && (
          <ContractorSignupHint />
        )}
        {isContractor && (
          <p className="text-sm text-gray-700">
            Oferta jest widoczna w{" "}
            <Link href="/wykonawca" className="text-[#145447] underline">
              panelu wykonawcy
            </Link>
            .
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {showSignupHint && <ContractorSignupHint compact />}
      {error && <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="offer-name">Nazwa wykonawcy</Label>
          <Input
            id="offer-name"
            name="bidderName"
            required
            maxLength={300}
            autoComplete="organization"
            defaultValue={isContractor ? (session?.user?.name || "") : undefined}
            aria-invalid={fieldErrors.bidderName ? true : undefined}
            aria-describedby={fieldErrors.bidderName ? "offer-name-error" : undefined}
          />
          {fieldErrors.bidderName && <p id="offer-name-error" className="text-xs text-red-600">{fieldErrors.bidderName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-nip">NIP (opcjonalnie)</Label>
          <Input
            id="offer-nip"
            name="bidderNip"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            autoComplete="off"
            aria-invalid={fieldErrors.bidderNip ? true : undefined}
            aria-describedby={fieldErrors.bidderNip ? "offer-nip-error" : undefined}
          />
          {fieldErrors.bidderNip && <p id="offer-nip-error" className="text-xs text-red-600">{fieldErrors.bidderNip}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-email">Adres e-mail</Label>
          <Input
            id="offer-email"
            name="bidderEmail"
            type="email"
            required
            autoComplete="email"
            defaultValue={isContractor ? (session?.user?.email || "") : undefined}
            aria-invalid={fieldErrors.bidderEmail ? true : undefined}
            aria-describedby={fieldErrors.bidderEmail ? "offer-email-error" : undefined}
          />
          {fieldErrors.bidderEmail && <p id="offer-email-error" className="text-xs text-red-600">{fieldErrors.bidderEmail}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-price">Cena brutto (PLN)</Label>
          <Input
            id="offer-price"
            name="price"
            type="number"
            min="0.01"
            max="9999999999.99"
            step="0.01"
            required
            autoComplete="off"
            aria-invalid={fieldErrors.price ? true : undefined}
            aria-describedby={fieldErrors.price ? "offer-price-error" : undefined}
          />
          {fieldErrors.price && <p id="offer-price-error" className="text-xs text-red-600">{fieldErrors.price}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="offer-description">Opis oferty (opcjonalnie)</Label>
        <textarea
          id="offer-description"
          name="description"
          className="min-h-28 w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          maxLength={10000}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="offer-files">Załączniki (opcjonalnie, max 5 × 10 MB)</Label>
        <Input
          id="offer-files"
          type="file"
          accept=".pdf,.docx,.xlsx,.zip,application/pdf,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          multiple
          disabled={uploading || attachments.length >= 5}
          onChange={onFilesSelected}
        />
        <p className="text-xs text-gray-600">
          Dołącz wyłącznie dane potrzebne do oceny Oferty. Nie zamieszczaj danych szczególnych kategorii ani nadmiarowych
          danych osobowych, jeśli nie są wymagane w postępowaniu.
        </p>
        {attachments.length > 0 && (
          <ul className="text-sm text-gray-700 space-y-1">
            {attachments.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{file.originalName}</span>
                <button
                  type="button"
                  className="text-[#145447] underline text-xs"
                  onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== file.id))}
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        )}
        {uploading && <p className="text-xs text-gray-600">Przesyłanie pliku…</p>}
      </div>
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="offer-website">Strona internetowa</Label>
        <Input id="offer-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label htmlFor="offer-confirm" className="flex items-start gap-3 text-sm">
        <Checkbox
          id="offer-confirm"
          checked={confirmed}
          onCheckedChange={(value) => {
            setConfirmed(value === true);
            if (fieldErrors.confirmation) setFieldErrors((prev) => ({ ...prev, confirmation: undefined }));
          }}
          required
          aria-invalid={fieldErrors.confirmation ? true : undefined}
          aria-describedby={fieldErrors.confirmation ? "offer-confirm-error" : undefined}
          className="mt-0.5"
        />
        <span>Potwierdzam prawdziwość podanych danych i złożenie wiążącej oferty na warunkach określonych w ogłoszeniu.</span>
      </label>
      {fieldErrors.confirmation && <p id="offer-confirm-error" className="text-xs text-red-600">{fieldErrors.confirmation}</p>}
      <Button type="submit" disabled={sending || uploading}>
        {sending ? "Wysyłanie..." : "Złóż ofertę"}
      </Button>
      <p className="text-xs text-gray-600">Dane oferty nie są publikowane. Otrzyma je wyłącznie zamawiający i uprawniony administrator.</p>
    </form>
  );
}
