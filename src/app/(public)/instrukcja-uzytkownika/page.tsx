import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Instrukcja użytkownika | Baza Konkurencyjności",
  description:
    "Instrukcja korzystania z systemu Baza Konkurencyjności Funduszu Sprawiedliwości — przeglądanie ogłoszeń, rejestracja, panel organizacji i bezpieczeństwo konta.",
}

const sections = [
  { id: "wstep", label: "1. Wstęp" },
  { id: "przegladanie", label: "2. Przeglądanie ogłoszeń" },
  { id: "rejestracja", label: "3. Rejestracja i logowanie" },
  { id: "konto", label: "4. Ustawienia konta i bezpieczeństwo" },
  { id: "panel", label: "5. Panel organizacji" },
  { id: "ogloszenia", label: "6. Tworzenie i zarządzanie ogłoszeniami" },
  { id: "pytania", label: "7. Pytania i odpowiedzi" },
  { id: "oferty", label: "8. Oferty i rozstrzygnięcie" },
  { id: "wydruk", label: "9. Wydruk i PDF" },
  { id: "pomoc", label: "10. Pomoc i kontakt" },
]

export default function UserManualPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#145447] mb-4">Instrukcja użytkownika</h1>
      <p className="text-gray-700 mb-8 text-lg">
        Praktyczny przewodnik po systemie Baza Konkurencyjności Funduszu Sprawiedliwości.
        Opisuje kroki dla osób przeglądających ogłoszenia oraz dla organizacji publikujących postępowania.
      </p>

      <nav aria-label="Spis treści" className="mb-10 rounded-lg border bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#145447] mb-3">Spis treści</h2>
        <ol className="grid gap-2 sm:grid-cols-2 text-sm text-gray-700">
          {sections.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-[#145447] hover:underline">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="prose prose-green max-w-none text-gray-700 space-y-10">
        <section id="wstep">
          <h2 className="text-xl font-semibold text-[#145447] mb-3">1. Wstęp</h2>
          <p>
            Baza Konkurencyjności to portal ogłoszeń o zamówieniach prowadzonych przez beneficjentów Funduszu Sprawiedliwości.
            Przeglądanie ogłoszeń jest publiczne i nie wymaga konta. Publikacja ogłoszeń, odpowiadanie na pytania oraz rozstrzyganie
            postępowań wymaga zarejestrowanego i aktywowanego konta organizacji.
          </p>
          <p>
            Więcej o celach systemu znajdziesz na stronie{" "}
            <Link href="/o-systemie" className="text-[#145447] font-medium hover:underline">O systemie</Link>.
            Odpowiedzi na najczęstsze pytania — w{" "}
            <Link href="/faq" className="text-[#145447] font-medium hover:underline">FAQ</Link>.
          </p>
        </section>

        <section id="przegladanie">
          <h2 className="text-xl font-semibold text-[#145447] mb-3">2. Przeglądanie ogłoszeń</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Wejdź w{" "}
              <Link href="/ogloszenia" className="text-[#145447] font-medium hover:underline">Ogłoszenia</Link>{" "}
              w menu górnym albo skorzystaj z wyszukiwarki na stronie głównej.
            </li>
            <li>Filtruj listę po statusie, terminie lub frazie w tytule / numerze postępowania.</li>
            <li>Otwórz wybrane ogłoszenie, aby zobaczyć opis, warunki, załączniki, pytania i odpowiedzi oraz wynik (jeśli został opublikowany).</li>
          </ol>
        </section>

        <section id="rejestracja">
          <h2 className="text-xl font-semibold text-[#145447] mb-3">3. Rejestracja i logowanie</h2>
          <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Wybór typu konta</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Kliknij{" "}
              <Link href="/rejestracja" className="text-[#145447] font-medium hover:underline">Załóż konto</Link>
              {" "}i wybierz: <strong>organizacja (zamawiający)</strong> albo <strong>wykonawca / oferent</strong>.
            </li>
          </ol>
          <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Rejestracja organizacji</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Wypełnij formularz na stronie{" "}
              <Link href="/rejestracja/organizacja" className="text-[#145447] font-medium hover:underline">
                rejestracja organizacji
              </Link>
              {" "}(m.in. nazwa, NIP, REGON, adres, dane kontaktowe).
            </li>
            <li>Konto oczekuje na weryfikację administratora (zwykle do 2 dni roboczych) — sprawdzane są dane rejestrowe.</li>
            <li>
              Po aktywacji zaloguj się na stronie{" "}
              <Link href="/logowanie" className="text-[#145447] font-medium hover:underline">Logowanie</Link>.
            </li>
          </ol>
          <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Rejestracja wykonawcy / oferenta</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Załóż konto na stronie{" "}
              <Link href="/rejestracja-wykonawcy" className="text-[#145447] font-medium hover:underline">
                rejestracja wykonawcy
              </Link>
              {" "}(e-mail + hasło). Konto działa od razu — bez weryfikacji administratora.
            </li>
            <li>
              Oferty możesz składać także <strong>bez konta</strong>. Rejestracja daje przegląd historii ofert w panelu wykonawcy.
            </li>
          </ol>
          <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Odzyskiwanie hasła</h3>
          <p>
            Na stronie logowania wybierz{" "}
            <Link href="/odzyskaj-haslo" className="text-[#145447] font-medium hover:underline">Odzyskaj hasło</Link>.
            Na adres e-mail konta wyślemy link do ustawienia nowego hasła (ważny przez ograniczony czas).
          </p>
        </section>

        <section id="konto">
          <h2 className="text-xl font-semibold text-[#145447] mb-3">4. Ustawienia konta i bezpieczeństwo</h2>
          <p>
            Po zalogowaniu przejdź do <strong>Moje konto → Ustawienia</strong> albo do pozycji{" "}
            <strong>Ustawienia konta</strong> w menu panelu (<code className="text-sm">/panel/konto</code>).
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Zmiana hasła</strong> — podaj aktualne hasło oraz nowe (8–72 znaki, wielka litera i cyfra).
              Po zmianie zostaniesz wylogowany ze wszystkich sesji.
            </li>
            <li>
              <strong>Logowanie dwuetapowe (2FA)</strong> — włącz ochronę z aplikacją Google Authenticator lub Microsoft Authenticator:
              zeskanuj kod QR (albo wpisz klucz ręcznie), potwierdź 6-cyfrowym kodem i zapisz kody zapasowe.
              Przy kolejnych logowaniach system poprosi o kod z aplikacji.
            </li>
          </ul>
        </section>

        <section id="panel">
          <h2 className="text-xl font-semibold text-[#145447] mb-3">5. Panel organizacji</h2>
          <p>
            Panel zamawiającego (<code className="text-sm">/panel</code>) jest dostępny po zalogowaniu na aktywne konto organizacji.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Dashboard (Pulpit)</strong> — podsumowanie aktywnych postępowań, ofert i pytań.</li>
            <li><strong>Moje ogłoszenia</strong> — lista wszystkich ogłoszeń z filtrami i akcjami.</li>
            <li><strong>Dodaj ogłoszenie</strong> — formularz nowego postępowania.</li>
            <li><strong>Szkice</strong> / <strong>Archiwum</strong> — niedokończone oraz zakończone / unieważnione postępowania.</li>
            <li><strong>Profil organizacji</strong> — dane rejestrowe i kontaktowe widoczne przy ogłoszeniach.</li>
            <li><strong>Ustawienia konta</strong> — hasło i 2FA (opisane wyżej).</li>
          </ul>
        </section>

        <section id="ogloszenia">
          <h2 className="text-xl font-semibold text-[#145447] mb-3">6. Tworzenie i zarządzanie ogłoszeniami</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>W panelu wybierz <strong>Dodaj ogłoszenie</strong>.</li>
            <li>Uzupełnij tytuł, opis, warunki, kryteria oceny, termin składania ofert, lokalizację oraz załączniki.</li>
            <li>Zapisz jako szkic albo opublikuj — po publikacji ogłoszenie jest widoczne publicznie.</li>
            <li>
              W <strong>Moje ogłoszenia</strong> możesz podejrzeć, edytować oraz — dla aktywnych postępowań — przejść do pytań, ofert i rozstrzygnięcia.
            </li>
          </ol>
          <p className="mt-3">
            Istotna zmiana opublikowanego ogłoszenia może wymagać przedłużenia terminu składania ofert, aby zachować równe traktowanie wykonawców.
          </p>
        </section>

        <section id="pytania">
          <h2 className="text-xl font-semibold text-[#145447] mb-3">7. Pytania i odpowiedzi</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Wykonawca / zainteresowany</strong> — na stronie ogłoszenia może zadać pytanie (zgodnie z zasadami danego postępowania).
            </li>
            <li>
              <strong>Organizacja</strong> — w panelu, przy aktywnym ogłoszeniu, otwiera <strong>Pytania</strong>, czyta treść i publikuje odpowiedź.
              Odpowiedzi są widoczne publicznie przy ogłoszeniu.
            </li>
          </ul>
        </section>

        <section id="oferty">
          <h2 className="text-xl font-semibold text-[#145447] mb-3">8. Oferty i rozstrzygnięcie</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Jeśli ogłoszenie dopuszcza składanie ofert przez platformę, wykonawca wypełnia formularz oferty na stronie ogłoszenia.</li>
            <li>Organizacja przegląda złożone oferty w panelu (<strong>Oferty</strong>) przy danym ogłoszeniu.</li>
            <li>
              Po zakończeniu zbierania ofert wybierz <strong>Rozstrzygnij</strong>: wskaż wykonawcę i uzasadnienie albo unieważnij postępowanie z podaniem przyczyny.
            </li>
            <li>Wynik jest publikowany przy ogłoszeniu i widoczny dla wszystkich użytkowników.</li>
          </ol>
        </section>

        <section id="wydruk">
          <h2 className="text-xl font-semibold text-[#145447] mb-3">9. Wydruk i PDF</h2>
          <p>
            Na stronie ogłoszenia dostępne są opcje wydruku oraz pobrania PDF. Dokument zawiera treść postępowania
            oraz <strong>sumę kontrolną</strong> — hash treści ogłoszenia w momencie wygenerowania dokumentu
            (nie jest unikalny dla każdego wydruku tej samej wersji).
          </p>
        </section>

        <section id="pomoc">
          <h2 className="text-xl font-semibold text-[#145447] mb-3">10. Pomoc i kontakt</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <Link href="/faq" className="text-[#145447] font-medium hover:underline">FAQ</Link> — krótkie odpowiedzi na typowe pytania.
            </li>
            <li>
              <Link href="/kontakt" className="text-[#145447] font-medium hover:underline">Kontakt</Link> — formularz i dane kontaktowe.
            </li>
            <li>
              <Link href="/regulamin" className="text-[#145447] font-medium hover:underline">Regulamin</Link>{" "}
              oraz{" "}
              <Link href="/polityka-prywatnosci" className="text-[#145447] font-medium hover:underline">Polityka prywatności</Link>{" "}
              — zasady korzystania z systemu i ochrony danych.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
