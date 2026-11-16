"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@/lib/password";

const schema = z.object({
  name: z.string().min(2),
  password: passwordSchema,
});

type FormValues = z.infer<typeof schema>;

export default function AcceptInvitePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    setToken(params.get("token") || "");
  }, []);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    if (!token) {
      setError("Brak tokenu zaproszenia");
      return;
    }
    try {
      const res = await fetch("/api/organization/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: data.name, password: data.password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Nie udało się zaakceptować");
      setSuccess(body.message);
      setTimeout(() => router.push("/logowanie"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd");
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-[#145447] mb-2">Akceptacja zaproszenia</h1>
      <p className="text-sm text-gray-600 mb-6">Utwórz hasło, aby dołączyć do organizacji.</p>
      {!token && <p className="text-red-700 text-sm mb-4">Nieprawidłowy link zaproszenia.</p>}
      {error && <p role="alert" className="text-sm text-red-700 mb-4">{error}</p>}
      {success && <p role="status" className="text-sm text-green-800 mb-4">{success}</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Imię i nazwisko</label>
          <input id="name" className="w-full border rounded-md px-3 py-2" autoComplete="name" {...register("name")} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Hasło</label>
          <input id="password" type="password" className="w-full border rounded-md px-3 py-2" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </div>
        <button disabled={isSubmitting || !token} className="w-full bg-[#145447] text-white py-2 rounded-md disabled:opacity-60">
          Dołącz do organizacji
        </button>
      </form>
      <p className="text-sm mt-4 text-center">
        <Link href="/logowanie" className="text-[#145447] underline">Przejdź do logowania</Link>
      </p>
    </div>
  );
}
