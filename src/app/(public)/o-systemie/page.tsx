import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "O Systemie | Baza Konkurencyjności",
  description: "Informacje o systemie Baza Konkurencyjności Funduszu Sprawiedliwości, jego celach, odpowiedzialności i zasadach działania.",
};

export default function AboutSystemPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#145447] mb-8">O Systemie</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-[#145447] mb-4">Czym jest Baza Konkurencyjności?</h2>
        <p className="text-gray-700 mb-4">
          Baza Konkurencyjności Funduszu Sprawiedliwości jest systemem teleinformatycznym służącym beneficjentom do
          publikacji i obsługi postępowań dotyczących zakupu towarów, usług lub robót. Publiczna część Systemu zapewnia
          przejrzysty dostęp do Ogłoszeń, pytań, odpowiedzi i wyników postępowań.
        </p>
        <p className="text-gray-700">
          System prowadzi Minister Sprawiedliwości, który odpowiada za jego utrzymanie, bezpieczeństwo i administrowanie
          techniczne. Za przebieg postępowania, treść Ogłoszenia i załączników oraz zgodność publikowanych danych odpowiada
          Organizacja będąca beneficjentem.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-[#145447] mb-4">Dla kogo jest System?</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li><strong>Organizacje</strong> - beneficjenci Funduszu Sprawiedliwości prowadzący postępowania i poszukujący Wykonawców.</li>
          <li><strong>Wykonawcy</strong> - podmioty i osoby zainteresowane zamówieniem, zadające pytania lub składające Oferty.</li>
          <li><strong>Odbiorcy części publicznej</strong> - osoby zainteresowane sposobem wydatkowania środków publicznych i przebiegiem postępowań.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-[#145447] mb-4">Jak działa rejestracja i obsługa kont?</h2>
        <ol className="list-decimal pl-6 text-gray-700 space-y-3">
          <li><strong>Zgłoszenie Organizacji</strong> - osoba uprawniona do działania w jej imieniu podaje dane rejestrowe i tworzy pierwsze konto.</li>
          <li><strong>Weryfikacja</strong> - Administrator Systemu sprawdza dane Organizacji i aktywuje konto.</li>
          <li><strong>Zespół Organizacji</strong> - właściciel konta zaprasza pracowników lub współpracowników i nadaje im role edytora albo obserwatora.</li>
          <li><strong>Konto Wykonawcy</strong> - Wykonawca może utworzyć konto samodzielnie; złożenie Oferty może być również dostępne bez rejestracji.</li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-[#145447] mb-4">Jak przebiega postępowanie?</h2>
        <ol className="list-decimal pl-6 text-gray-700 space-y-3">
          <li><strong>Publikacja</strong> - Organizacja przygotowuje Ogłoszenie, ustala termin i sposób składania Ofert oraz publikuje wymagane dokumenty.</li>
          <li><strong>Pytania</strong> - zainteresowani mogą kierować pytania, a Organizacja publikuje odpowiedzi w Systemie.</li>
          <li><strong>Oferty</strong> - Wykonawcy przekazują Oferty wybranym sposobem. Oferty przesłane przez System nie są publiczne.</li>
          <li><strong>Rozstrzygnięcie</strong> - Organizacja ocenia Oferty, wybiera Wykonawcę i publikuje wynik postępowania.</li>
        </ol>
        <p className="text-gray-700 mt-4">
          Organizacja powinna publikować tylko dane niezbędne, sprawdzać załączniki przed ich udostępnieniem oraz usuwać lub
          anonimizować dane nadmiarowe, w szczególności dane szczególnych kategorii.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-[#145447] mb-4">Podstawa działania Funduszu</h2>
        <p className="text-gray-700 mb-4">
          Zadania Funduszu Sprawiedliwości określa art. 43 ustawy z dnia 6 czerwca 1997 r. - Kodeks karny wykonawczy oraz
          rozporządzenie Ministra Sprawiedliwości z dnia 13 września 2017 r. w sprawie Funduszu Pomocy Pokrzywdzonym oraz
          Pomocy Postpenitencjarnej - Funduszu Sprawiedliwości. Szczegółowe obowiązki Organizacji dotyczące wyboru
          Wykonawców wynikają z właściwych przepisów, dokumentacji konkursowej lub naborowej oraz zawartej umowy.
        </p>
        <p className="text-gray-700">
          Zasady odpowiedzialności i przetwarzania danych opisują <Link href="/regulamin" className="text-[#145447] font-medium underline">Regulamin</Link> oraz{" "}
          <Link href="/polityka-prywatnosci" className="text-[#145447] font-medium underline">Polityka prywatności</Link>.
        </p>
      </section>
    </div>
  );
}
