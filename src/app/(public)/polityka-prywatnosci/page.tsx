import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polityka prywatności | Baza Konkurencyjności",
  description: "Polityka prywatności i informacje o przetwarzaniu danych osobowych w Bazie Konkurencyjności Funduszu Sprawiedliwości.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#145447] mb-3">Polityka prywatności i klauzula informacyjna</h1>
      <p className="text-sm text-gray-600 mb-8">Stan na 7 listopada 2026 r.</p>

      <div className="prose prose-green max-w-none text-gray-700">
        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">1. Administratorzy danych osobowych</h2>
        <p>
          Minister Sprawiedliwości, z siedzibą przy Al. Ujazdowskich 11, 00-950 Warszawa, jest administratorem danych
          przetwarzanych w związku z prowadzeniem, utrzymaniem i zabezpieczeniem Systemu, zakładaniem i obsługą kont,
          weryfikacją Organizacji, obsługą zgłoszeń oraz rejestrowaniem zdarzeń związanych z bezpieczeństwem.
        </p>
        <p>
          Organizacja będąca beneficjentem Funduszu Sprawiedliwości jest odrębnym administratorem danych przetwarzanych
          w ramach prowadzonych przez nią postępowań, w szczególności danych zamieszczanych w Ogłoszeniach i załącznikach,
          danych osób kontaktowych, pytań, Ofert i rozstrzygnięć. Dane kontaktowe Organizacji są podawane w jej Ogłoszeniu
          lub przekazywane osobie, której dane dotyczą.
        </p>
        <p>Każdy administrator odpowiada za realizację obowiązków wynikających z RODO w swoim zakresie.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">2. Kontakt z administratorem i Inspektorem Ochrony Danych</h2>
        <p>
          Z Ministrem Sprawiedliwości można skontaktować się listownie pod adresem: Ministerstwo Sprawiedliwości,
          Al. Ujazdowskie 11, 00-950 Warszawa.
        </p>
        <p>
          Z Inspektorem Ochrony Danych Ministerstwa Sprawiedliwości można skontaktować się pod adresem e-mail{" "}
          <a href="mailto:iod@ms.gov.pl">iod@ms.gov.pl</a> lub listownie: Inspektor Ochrony Danych, Ministerstwo
          Sprawiedliwości, Al. Ujazdowskie 11, 00-950 Warszawa. IOD Ministerstwa jest właściwy wyłącznie w sprawach danych,
          za które odpowiada Minister Sprawiedliwości.
        </p>
        <p>
          W sprawach danych przetwarzanych przez Organizację należy kontaktować się bezpośrednio z tą Organizacją lub z jej
          inspektorem ochrony danych, jeżeli został wyznaczony.
        </p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">3. Cele przetwarzania</h2>
        <p>Minister Sprawiedliwości przetwarza dane w celu:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>rejestracji, weryfikacji i obsługi kont oraz nadawania uprawnień,</li>
          <li>zapewnienia działania, bezpieczeństwa i rozliczalności Systemu,</li>
          <li>obsługi zgłoszeń, korespondencji, audytów, kontroli i obowiązków archiwizacyjnych,</li>
          <li>zapewnienia Organizacjom narzędzia do publikacji i obsługi postępowań.</li>
        </ul>
        <p>Organizacja przetwarza dane w celu przygotowania i prowadzenia postępowania, komunikacji z Wykonawcami, przyjmowania i oceny Ofert, publikacji rozstrzygnięcia oraz realizacji obowiązków kontrolnych, rozliczeniowych i archiwizacyjnych.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">4. Podstawy prawne przetwarzania</h2>
        <p>
          Minister Sprawiedliwości przetwarza dane w zakresie niezbędnym do wypełnienia obowiązków prawnych oraz wykonania
          zadań realizowanych w interesie publicznym lub w ramach sprawowania władzy publicznej - na podstawie art. 6 ust. 1
          lit. c i e RODO. Zadania Funduszu Sprawiedliwości określa w szczególności art. 43 ustawy z dnia 6 czerwca 1997 r.
          - Kodeks karny wykonawczy oraz rozporządzenie Ministra Sprawiedliwości z dnia 13 września 2017 r. w sprawie
          Funduszu Pomocy Pokrzywdzonym oraz Pomocy Postpenitencjarnej - Funduszu Sprawiedliwości.
        </p>
        <p>
          Organizacja określa podstawę prawną przetwarzania w prowadzonym postępowaniu odpowiednio do swojego statusu,
          obowiązujących ją przepisów, dokumentacji konkursowej lub naborowej oraz zawartej umowy. Informację o tej podstawie
          Organizacja przekazuje osobom, których dane przetwarza.
        </p>
        <p>Zgoda nie stanowi podstawy przetwarzania danych niezbędnych do prowadzenia konta, zapewnienia bezpieczeństwa Systemu ani obsługi postępowania.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">5. Kategorie i źródła danych</h2>
        <p>
          Przetwarzane mogą być: imię i nazwisko, służbowe dane kontaktowe, stanowisko lub rola, dane konta i uwierzytelniania,
          dane Organizacji, treść korespondencji, dane zawarte w Ogłoszeniach, pytaniach, Ofertach i załącznikach oraz dane
          techniczne, takie jak adres IP, identyfikatory sesji i historia operacji.
        </p>
        <p>
          Dane pochodzą bezpośrednio od osoby, której dotyczą, od Organizacji lub Wykonawcy, od uprawnionego użytkownika
          działającego w ich imieniu albo z rejestrów publicznych wykorzystywanych do weryfikacji Organizacji.
        </p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">6. Odbiorcy danych</h2>
        <p>
          Odbiorcami danych mogą być upoważnieni pracownicy i współpracownicy administratora, podmioty zapewniające hosting,
          utrzymanie, rozwój, bezpieczeństwo i obsługę poczty elektronicznej na podstawie odpowiednich umów, a także organy
          publiczne uprawnione na podstawie prawa. Dane umieszczone przez Organizację w publicznej części Ogłoszenia są
          dostępne dla użytkowników Internetu.
        </p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">7. Publiczne udostępnianie i minimalizacja danych</h2>
        <p>
          Organizacja odpowiada za sprawdzenie treści Ogłoszenia i załączników przed publikacją. W publicznej części Systemu
          należy zamieszczać wyłącznie dane niezbędne do przeprowadzenia postępowania i wymagane przez właściwe przepisy lub
          dokumentację postępowania. Nie należy publikować nadmiarowych danych ani danych szczególnych kategorii, o których
          mowa w art. 9 RODO. Jeżeli dokument zawiera dane zbędne, Organizacja powinna je usunąć lub zanonimizować.
        </p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">8. Okres przechowywania</h2>
        <p>
          Dane konta są przechowywane przez okres jego aktywności, a następnie przez okres niezbędny do realizacji obowiązków
          prawnych, audytowych, kontrolnych, rozliczeniowych i archiwizacyjnych oraz ustalenia, dochodzenia lub obrony roszczeń.
          Dokumentacja postępowań jest przechowywana przez okres wynikający z przepisów, dokumentacji finansowania i umowy z
          beneficjentem. Logi bezpieczeństwa są przechowywane przez okres niezbędny do wykrywania nadużyć, wyjaśniania
          incydentów i zapewnienia rozliczalności. Po upływie właściwego okresu dane są usuwane lub anonimizowane.
        </p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">9. Prawa osób</h2>
        <p>
          W granicach określonych w RODO osobie przysługuje prawo dostępu do danych, ich sprostowania, ograniczenia
          przetwarzania oraz - zależnie od podstawy prawnej i okoliczności - usunięcia danych, przenoszenia danych i wniesienia
          sprzeciwu. Prawo usunięcia, przenoszenia i sprzeciwu nie ma zastosowania w każdym przypadku, w szczególności gdy
          przetwarzanie jest konieczne do wypełnienia obowiązku prawnego lub wykonania zadania publicznego.
        </p>
        <p>Żądanie należy skierować do administratora odpowiedzialnego za dane, których dotyczy żądanie.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">10. Skarga do organu nadzorczego</h2>
        <p>
          Osobie przysługuje prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych, jeżeli uważa, że jej dane są
          przetwarzane niezgodnie z RODO. Informacje o sposobie wniesienia skargi są dostępne na stronie{" "}
          <a href="https://uodo.gov.pl" target="_blank" rel="noopener noreferrer">uodo.gov.pl</a>.
        </p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">11. Zautomatyzowane decyzje i profilowanie</h2>
        <p>Dane nie są wykorzystywane do podejmowania wobec osób decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, w tym profilowaniu, które wywoływałyby skutki prawne lub w podobny sposób istotnie na nie wpływały.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">12. Pliki cookies i bezpieczeństwo</h2>
        <p>System wykorzystuje niezbędne pliki cookies służące do utrzymania sesji, uwierzytelniania, bezpieczeństwa oraz zapamiętania ustawień związanych z cookies. System stosuje kontrolę dostępu, rejestrowanie zdarzeń i uwierzytelnianie dwuetapowe dostępne dla kont użytkowników.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">13. Zmiany polityki</h2>
        <p>Polityka może być aktualizowana w związku ze zmianą przepisów, zakresu Systemu albo sposobu przetwarzania danych. O istotnych zmianach użytkownicy posiadający konto zostaną poinformowani w Systemie lub pocztą elektroniczną.</p>
      </div>
    </div>
  );
}
