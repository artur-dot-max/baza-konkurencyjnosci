"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [pending, setPending] = useState<LoginForm | null>(null);
  const [totpCode, setTotpCode] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const completeSignIn = async (data: LoginForm, code?: string) => {
    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
      totpCode: code || "",
    });

    if (result?.error) {
      setError(
        code
          ? "Nieprawidłowy kod weryfikacyjny. Sprawdź aplikację Authenticator lub użyj kodu zapasowego."
          : "Nieprawidłowy email lub hasło. Upewnij się, że konto zostało aktywowane przez administratora."
      );
      return false;
    }

    const session = await getSession();
    const role = session?.user?.role;
    router.push(role === "ADMIN" ? "/admin" : role === "CONTRACTOR" ? "/wykonawca" : "/panel");
    router.refresh();
    return true;
  };

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      const prelogin = await fetch("/api/auth/prelogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await prelogin.json();

      if (!prelogin.ok) {
        setError(body.error || "Nieprawidłowy email lub hasło.");
        return;
      }

      if (body.requires2FA) {
        setPending(data);
        setStep("totp");
        setTotpCode("");
        return;
      }

      await completeSignIn(data);
    } catch {
      setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const onTotpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pending) return;
    setLoading(true);
    setError(null);
    try {
      await completeSignIn(pending, totpCode.trim());
    } catch {
      setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F1F5F2]">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-200">
        <div className="flex flex-col items-center">
          <Image
            src="/logo-fundusz-sprawiedliwosci.png"
            alt="Fundusz Sprawiedliwości"
            width={280}
            height={112}
            priority
            className="mb-5 h-auto w-56"
          />
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            {step === "credentials" ? "Logowanie" : "Weryfikacja 2FA"}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === "credentials"
              ? "Baza Konkurencyjności Funduszu Sprawiedliwości"
              : "Wpisz kod z Google Authenticator, Microsoft Authenticator lub kod zapasowy"}
          </p>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border-l-4 border-[#DC2626] p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] mt-0.5 shrink-0" aria-hidden="true" />
            <p id={step === "totp" ? "totp-error" : undefined} className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {step === "credentials" ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Adres e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#145447] focus:border-transparent outline-none ${errors.email ? "border-red-500" : "border-gray-300"}`}
                  {...register("email")}
                />
                {errors.email && <p id="email-error" className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Hasło
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#145447] focus:border-transparent outline-none ${errors.password ? "border-red-500" : "border-gray-300"}`}
                  {...register("password")}
                />
                {errors.password && <p id="password-error" className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#145447] hover:bg-[#0D4036] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#145447] disabled:opacity-70 transition-colors"
              >
                {loading ? "Logowanie..." : "Zaloguj się"}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={onTotpSubmit}>
            <div className="rounded-md bg-[#E5F2ED] p-4 flex items-start gap-3 text-sm text-[#123F36]">
              <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0" aria-hidden="true" />
              <p>Konto chronione jest logowaniem dwuetapowym. Otwórz aplikację Authenticator i podaj bieżący kod.</p>
            </div>
            <div>
              <label htmlFor="totpCode" className="block text-sm font-medium text-gray-700 mb-1">
                Kod weryfikacyjny
              </label>
              <input
                id="totpCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\s+/g, "").slice(0, 16))}
                aria-invalid={!!error}
                aria-describedby={error ? "totp-error" : undefined}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#145447] focus:border-transparent outline-none tracking-widest text-center text-lg ${error ? "border-red-500" : "border-gray-300"}`}
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={loading || totpCode.length < 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#145447] hover:bg-[#0D4036] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#145447] disabled:opacity-70 transition-colors"
            >
              {loading ? "Weryfikacja..." : "Potwierdź i zaloguj"}
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 text-sm text-[#145447] hover:underline"
              onClick={() => {
                setStep("credentials");
                setPending(null);
                setTotpCode("");
                setError(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Wróć do logowania
            </button>
          </form>
        )}

        {step === "credentials" && (
          <>
            <Link href="/odzyskaj-haslo" className="block text-center underline mt-6">Odzyskaj hasło</Link>
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Nie masz konta?{" "}
                <Link href="/rejestracja" className="font-medium text-[#145447] hover:underline">
                  Załóż konto
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
