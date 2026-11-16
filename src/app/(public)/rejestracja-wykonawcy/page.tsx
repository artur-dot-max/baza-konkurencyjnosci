"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@/lib/password";

const schema = z
  .object({
    name: z.string().min(2, "Podaj imię i nazwisko lub nazwę firmy"),
    email: z.string().email("Nieprawidłowy e-mail"),
    password: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być takie same",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ContractorRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/contractors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Nie udało się utworzyć konta");
      setSuccess(body.message);
      setTimeout(() => router.push("/logowanie"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć konta");
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-[#F1F5F2]">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow border space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Konto wykonawcy / oferenta</h1>
          <p className="text-sm text-gray-600 mt-1">
            Konto jest opcjonalne — oferty możesz składać bez rejestracji. Po założeniu konta od razu się zalogujesz
            (bez weryfikacji administratora).{" "}
            <Link href="/rejestracja" className="text-[#145447] underline">Zmień typ konta</Link>
            {" · "}
            <Link href="/rejestracja/organizacja" className="text-[#145447] underline">Organizacja</Link>
          </p>
        </div>

        <div className="rounded-lg border border-[#D7E8DF] bg-[#F0F7F4] p-4 text-sm text-gray-800">
          <p className="font-medium text-[#145447] mb-2">Korzyści z rejestracji</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Przegląd złożonych ofert i statusów postępowań w jednym miejscu</li>
            <li>Powiązanie ofert gościnnych z tym samym e-mailem po założeniu konta</li>
            <li>Szybsze składanie kolejnych ofert po zalogowaniu</li>
          </ul>
        </div>

        {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded">{error}</p>}
        {success && <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 p-3 rounded">{success}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Imię i nazwisko / firma</label>
            <input id="name" autoComplete="name" aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "name-error" : undefined} className="w-full border rounded-md px-3 py-2" {...register("name")} />
            {errors.name && <p id="name-error" className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">E-mail</label>
            <input id="email" type="email" autoComplete="email" aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? "email-error" : undefined} className="w-full border rounded-md px-3 py-2" {...register("email")} />
            {errors.email && <p id="email-error" className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Hasło</label>
            <input id="password" type="password" autoComplete="new-password" aria-invalid={errors.password ? true : undefined} aria-describedby={errors.password ? "password-error" : undefined} className="w-full border rounded-md px-3 py-2" {...register("password")} />
            {errors.password && <p id="password-error" className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Powtórz hasło</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={errors.confirmPassword ? true : undefined} aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined} className="w-full border rounded-md px-3 py-2" {...register("confirmPassword")} />
            {errors.confirmPassword && <p id="confirmPassword-error" className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button disabled={isSubmitting} className="w-full bg-[#145447] text-white py-2.5 rounded-md disabled:opacity-70">
            {isSubmitting ? "Tworzenie konta…" : "Załóż konto wykonawcy"}
          </button>
          <p className="text-xs text-gray-600">
            Dane zostaną wykorzystane do utworzenia i obsługi konta. Informacje o administratorach i przysługujących
            prawach znajdują się w <Link href="/polityka-prywatnosci" className="text-[#145447] underline">Polityce prywatności</Link>.
          </p>
        </form>
        <p className="text-sm text-center text-gray-600">
          Masz już konto? <Link href="/logowanie" className="text-[#145447] font-medium underline">Zaloguj się</Link>
        </p>
      </div>
    </div>
  );
}
