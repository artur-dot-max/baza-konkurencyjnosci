import Link from "next/link";
import { Metadata } from "next";
import { Building2, Briefcase, CheckCircle2, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Załóż konto",
  description: "Wybierz typ konta: organizacja (zamawiający) lub wykonawca / oferent.",
};

export default function RegisterChoicePage() {
  return (
    <div className="min-h-[calc(100vh-200px)] bg-[#F1F5F2] py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Załóż konto</h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Wybierz rodzaj konta. Oferty możesz składać także bez rejestracji — konto wykonawcy jest opcjonalne
            i służy do wygodnego przeglądu historii.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/rejestracja/organizacja"
            className="group rounded-xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-[#145447] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145447]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#145447] text-white">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#145447]">
              Organizacja (zamawiający)
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Publikujesz ogłoszenia, odbierasz oferty i pytania, rozstrzygasz postępowania.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#145447]" aria-hidden="true" />
                Weryfikacja przez administratora (NIP, REGON, dane rejestrowe)
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#145447]" aria-hidden="true" />
                Logowanie możliwe po aktywacji konta
              </li>
            </ul>
            <span className="mt-6 inline-flex text-sm font-semibold text-[#145447]">
              Przejdź do formularza →
            </span>
          </Link>

          <Link
            href="/rejestracja-wykonawcy"
            className="group rounded-xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-[#145447] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145447]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#145447] text-white">
              <Briefcase className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#145447]">
              Wykonawca / oferent
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Składasz oferty do ogłoszeń. Konto nie jest wymagane przy składaniu oferty — pomaga śledzić historię.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#145447]" aria-hidden="true" />
                Aktywacja od razu po rejestracji (e-mail + hasło)
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#145447]" aria-hidden="true" />
                Przegląd złożonych ofert w panelu wykonawcy
              </li>
            </ul>
            <span className="mt-6 inline-flex text-sm font-semibold text-[#145447]">
              Przejdź do formularza →
            </span>
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          Masz już konto?{" "}
          <Link href="/logowanie" className="font-medium text-[#145447] underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
