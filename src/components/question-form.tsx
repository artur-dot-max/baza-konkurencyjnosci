"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type FieldErrors = Partial<Record<"name" | "email" | "content", string>>;

export function QuestionForm({ announcementId }: { announcementId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const content = String(data.get("content") || "").trim();
    const next: FieldErrors = {};
    if (!email) next.email = "Adres e-mail jest wymagany";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Nieprawidłowy adres e-mail";
    if (content.length < 10) next.content = "Treść pytania musi mieć co najmniej 10 znaków";
    if (Object.keys(next).length) {
      setFieldErrors(next);
      setError("");
      return;
    }
    setBusy(true);
    setError("");
    setFieldErrors({});
    setSuccess(false);
    try {
      const response = await fetch(`/api/announcements/${announcementId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: name,
          authorEmail: email,
          content,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      form.reset();
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać pytania");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-xl" noValidate>
      <p className="text-sm">
        Treść pytania zostanie opublikowana. Dane kontaktowe są widoczne tylko dla zamawiającego i administratora.
      </p>
      <div>
        <label htmlFor="question-name" className="block text-sm font-medium mb-1">
          Imię i nazwisko / Nazwa firmy
        </label>
        <input
          id="question-name"
          name="name"
          maxLength={200}
          autoComplete="name"
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "question-name-error" : undefined}
          className="w-full p-2 border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145447] focus-visible:ring-offset-2"
        />
        {fieldErrors.name && <p id="question-name-error" className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
      </div>
      <div>
        <label htmlFor="question-email" className="block text-sm font-medium mb-1">
          E-mail
        </label>
        <input
          id="question-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? "question-email-error" : undefined}
          className="w-full p-2 border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145447] focus-visible:ring-offset-2"
        />
        {fieldErrors.email && <p id="question-email-error" className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
      </div>
      <div>
        <label htmlFor="question-content" className="block text-sm font-medium mb-1">
          Treść pytania
        </label>
        <textarea
          id="question-content"
          name="content"
          required
          minLength={10}
          maxLength={10000}
          rows={4}
          aria-invalid={fieldErrors.content ? true : undefined}
          aria-describedby={fieldErrors.content ? "question-content-error" : undefined}
          className="w-full p-2 border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145447] focus-visible:ring-offset-2"
        />
        {fieldErrors.content && <p id="question-content-error" className="text-xs text-red-600 mt-1">{fieldErrors.content}</p>}
      </div>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {success && <p role="status">Pytanie zostało zapisane.</p>}
      <button
        disabled={busy}
        className="bg-[#145447] text-white px-4 py-2 rounded disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F] focus-visible:ring-offset-2"
      >
        {busy ? "Wysyłanie…" : "Wyślij pytanie"}
      </button>
    </form>
  );
}
