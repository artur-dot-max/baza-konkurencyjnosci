import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Deklaracja dostępności | Baza Konkurencyjności",
  description:
    "Deklaracja dostępności cyfrowej strony Baza Konkurencyjności zgodnie z ustawą z dnia 4 kwietnia 2019 r.",
}

export default function AccessibilityDeclarationPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#145447] mb-8">Deklaracja dostępności</h1>

      <div className="prose prose-green max-w-none text-gray-700 space-y-8">
        <p>
          Ministerstwo Sprawiedliwości zobowiązuje się zapewnić dostępność swojej strony internetowej zgodnie
          z ustawą z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i aplikacji mobilnych
          podmiotów publicznych.
        </p>
        <p>
          Deklaracja dostępności dotyczy stron internetowych:{" "}
          <a href="https://konkurencyjnosc.afs.gov.pl" className="text-[#145447] font-medium hover:underline" rel="noopener noreferrer" target="_blank">
            https://konkurencyjnosc.afs.gov.pl
          </a>{" "}
          oraz{" "}
          <a href="https://konkurencyjnosc.afs.ms.gov.pl" className="text-[#145447] font-medium hover:underline" rel="noopener noreferrer" target="_blank">
            https://konkurencyjnosc.afs.ms.gov.pl
          </a>
          .
        </p>

        <section>
          <h2 className="text-xl font-semibold text-[#145447] mb-3">Data publikacji i aktualizacji</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Data publikacji strony internetowej: 23 września 2026 r.</li>
            <li>Data ostatniej istotnej aktualizacji: 1 października 2026 r.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#145447] mb-3">Stan dostępności cyfrowej</h2>
          <p>
            Strona internetowa jest w pełni zgodna z ustawą z dnia 4 kwietnia 2019 r. o dostępności cyfrowej
            stron internetowych i aplikacji mobilnych podmiotów publicznych.
          </p>
          <p className="mt-3">
            Serwis spełnia wymagania WCAG 2.1 na poziomie AA, w tym m.in. etykiety formularzy i kontrolek,
            nazwy dostępne dla elementów graficznych i przycisków ikonicznych, wyróżnienie fokusa klawiatury,
            obsługę klawiatury, respektowanie preferencji ograniczenia ruchu oraz poprawną hierarchię nagłówków.
            W nagłówku dostępny jest pasek ustawień dostępności: zmiana rozmiaru czcionki (A / A+ / A++)
            oraz tryb wysokiego kontrastu.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#145447] mb-3">Przygotowanie deklaracji dostępności</h2>
          <p>Data sporządzenia deklaracji: 23 września 2026 r.</p>
          <p className="mt-2">Deklarację sporządzono na podstawie samooceny przeprowadzonej przez podmiot publiczny.</p>
          <p className="mt-2">Data ostatniego przeglądu deklaracji: 1 października 2026 r.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#145447] mb-3">Skróty klawiaturowe</h2>
          <p>Na stronie internetowej można korzystać ze standardowych skrótów klawiaturowych.</p>
        </section>

        <section id="informacje-zwrotne">
          <h2 className="text-xl font-semibold text-[#145447] mb-3">Informacje zwrotne i dane kontaktowe</h2>
          <p>
            W przypadku problemów z dostępnością strony internetowej prosimy o kontakt pod adresem mailowym
            poczty elektronicznej:{" "}
            <a href="mailto:dostepnosc_cyfrowa@ms.gov.pl" className="text-[#145447] font-medium hover:underline">
              dostepnosc_cyfrowa@ms.gov.pl
            </a>
            . Można także kontaktować się telefonicznie pod numerem:{" "}
            <a href="tel:+48222390243" className="text-[#145447] font-medium hover:underline">
              22 23 90 243
            </a>
            .
          </p>
          <p className="mt-3">
            Tą samą drogą można składać wnioski o udostępnienie informacji niedostępnej oraz skargi na brak
            zapewnienia dostępności.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#145447] mb-3">Informacje na temat procedury</h2>
          <p>
            Każdy ma prawo wystąpić z żądaniem zapewnienia dostępności cyfrowej strony internetowej, aplikacji
            mobilnej lub ich elementów. Można także zażądać udostępnienia informacji za pomocą alternatywnego
            sposobu dostępu, na przykład przez odczytanie niedostępnego cyfrowo dokumentu.
          </p>
          <p className="mt-3">Żądanie powinno zawierać:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>dane osoby zgłaszającej żądanie;</li>
            <li>wskazanie strony internetowej, aplikacji mobilnej lub ich elementu, których dotyczy żądanie;</li>
            <li>sposób kontaktu.</li>
          </ul>
          <p className="mt-3">
            Jeżeli osoba żądająca zgłasza potrzebę otrzymania informacji za pomocą alternatywnego sposobu dostępu,
            powinna również określić dogodny sposób przedstawienia tej informacji.
          </p>
          <p className="mt-3">
            Podmiot publiczny powinien zrealizować żądanie niezwłocznie, nie później niż w terminie 7 dni od dnia
            wystąpienia z żądaniem. Jeżeli dotrzymanie tego terminu nie jest możliwe, podmiot publiczny niezwłocznie
            informuje o tym wnoszącego żądanie oraz wskazuje termin realizacji żądania, nie dłuższy niż 2 miesiące
            od dnia wystąpienia z żądaniem.
          </p>
          <p className="mt-3">
            Jeżeli zapewnienie dostępności cyfrowej nie jest możliwe, podmiot publiczny może zaproponować
            alternatywny sposób dostępu do informacji. W przypadku odmowy realizacji żądania zapewnienia
            dostępności lub alternatywnego sposobu dostępu do informacji, wnoszący żądanie może złożyć skargę
            w sprawie zapewniania dostępności cyfrowej strony internetowej, aplikacji mobilnej lub ich elementów.
            Po wyczerpaniu wszystkich możliwości skargę można złożyć także do Rzecznika Praw Obywatelskich.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#145447] mb-3">Dostępność architektoniczna</h2>
          <p>Do wszystkich obiektów Ministerstwa Sprawiedliwości zapewniony jest dostęp osobom poruszającym się na wózkach, przy czym:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              do budynków przy Al. Róż 2 oraz ul. Czerniakowskiej 100 wjazd na wózkach możliwy jest bezpośrednio
              z chodnika;
            </li>
            <li>
              do budynków przy ul. Chopina 1 oraz ul. Zwycięzców 34 dostęp umożliwiają podjazdy usytuowane przy
              wejściach głównych;
            </li>
            <li>
              do budynków przy ul. Pięknej 1b oraz ul. Koszykowej 6 dostęp możliwy jest po wezwaniu asysty za pomocą
              dzwonka;
            </li>
            <li>
              do budynku głównego Ministerstwa prowadzą dwa wejścia od strony Al. Ujazdowskich. Ze względów
              konstrukcyjnych utrudniony jest dostęp do Biura Podawczego oraz Biura Przepustek dla osób
              z niepełnosprawnością ruchową. Istnieje możliwość skorzystania z dzwonka przywoławczego przy bramie
              głównej, w przypadku nieobecności funkcjonariusza ochrony. Wejście dla osób poruszających się na
              wózkach zlokalizowane jest od strony ul. Św. Teresy, gdzie zamontowano windę prowadzącą do Wydziału
              Skarg i Wniosków, toalety przystosowanej do potrzeb osób z niepełnosprawnościami oraz do pozostałych
              części budynku;
            </li>
            <li>
              wszystkie obiekty posiadają windy osobowe umożliwiające dostęp do każdej kondygnacji. Windy mają
              rozmiary zapewniające swobodny wjazd i przemieszczanie się osobom korzystającym z wózków. Wyposażone
              są w wizualizację kondygnacji, przyciski oznaczone alfabetem Braille’a oraz komunikaty głosowe;
            </li>
            <li>
              budynki przy Al. Ujazdowskich 11, Al. Róż 2, ul. Chopina 1, ul. Czerniakowskiej 100 oraz ul.
              Zwycięzców 34 posiadają toalety dostosowane do potrzeb osób z niepełnosprawnościami, oznakowane
              dotykowymi tabliczkami informacyjnymi;
            </li>
            <li>w budynku przy ul. Czerniakowskiej 100 stanowiska obsługi klienta wyposażone są w pętle indukcyjne;</li>
            <li>
              w pętle indukcyjne wyposażone są także Biuro Przepustek oraz okno podawcze w budynku przy Al.
              Ujazdowskich 11.
            </li>
          </ul>
          <p className="mt-4">W budynkach objętych ochroną konserwatora zabytków:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              w budynku przy Al. Róż 2 zakończono remont kapitalny, w ramach którego uwzględniono potrzeby osób
              z niepełnosprawnościami;
            </li>
            <li>
              w budynku przy Al. Ujazdowskich 19 (wejście przez budynek przy ul. Chopina 1) zaplanowano remont
              generalny. W projekcie uwzględniono przepisy dotyczące dostosowania ogólnodostępnych części budynku
              do potrzeb osób z niepełnosprawnościami.
            </li>
          </ul>
          <p className="mt-4">
            Poruszanie się po budynkach Ministerstwa Sprawiedliwości odbywa się zgodnie z obowiązującymi zasadami
            bezpieczeństwa. Goście i interesanci nie poruszają się po budynkach samodzielnie. Zawsze towarzyszą im
            osoby zapraszające albo prowadzące sprawę. Zapewniają one możliwość dotarcia do właściwych pomieszczeń
            oraz niezbędne wsparcie. Wyjątek stanowi Sala Obsługi Interesantów w budynku przy ul. Czerniakowskiej
            100, gdzie wstęp jest wolny, bez asysty pracownika Ministerstwa Sprawiedliwości.
          </p>
          <p className="mt-3">
            Osoby korzystające z psa asystującego mają zapewniony wstęp do budynków Ministerstwa Sprawiedliwości.
            Pies asystujący ma prawo poruszać się wszędzie tam, gdzie osoba, której asystuje.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#145447] mb-3">
            Informacja o utrudnionym dostępie do Biura Przepustek i Biura podawczego
          </h2>
          <p>
            Ministerstwo Sprawiedliwości informuje, że utrudniony jest dostęp do Biura Podawczego oraz Biura
            Przepustek w budynku przy Al. Ujazdowskich 11 dla osób z niepełnosprawnością ruchową. Istnieje
            możliwość skorzystania z dzwonka przywoławczego przy bramie głównej, w przypadku nieobecności
            funkcjonariusza ochrony. Wejście dla osób poruszających się na wózkach zlokalizowane jest od strony
            ul. Św. Teresy, gdzie znajduje się winda prowadząca do Wydziału Skarg i Wniosków oraz do pozostałych
            części budynku. W budynku znajduje się również toaleta dostosowana do potrzeb osób
            z niepełnosprawnościami, zlokalizowana na parterze, przy Wydziale Skarg i Wniosków. Brak możliwości
            skorzystania z tłumacza języka migowego.
          </p>
        </section>

        <p className="text-sm text-gray-600 pt-4 border-t">
          Powiązane:{" "}
          <Link href="/kontakt" className="text-[#145447] hover:underline">
            Kontakt
          </Link>
          {" · "}
          <Link href="/polityka-prywatnosci" className="text-[#145447] hover:underline">
            Polityka prywatności
          </Link>
        </p>
      </div>
    </div>
  )
}
