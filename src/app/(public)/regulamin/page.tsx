import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulamin | Baza Konkurencyjności",
  description: "Regulamin korzystania z systemu Baza Konkurencyjności Funduszu Sprawiedliwości.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#145447] mb-3">Regulamin Systemu</h1>
      <p className="text-sm text-gray-600 mb-8">Stan na 7 listopada 2026 r.</p>

      <div className="prose prose-green max-w-none text-gray-700">
        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">1. Postanowienia ogólne</h2>
        <p>1.1. Regulamin określa zasady korzystania z systemu Baza Konkurencyjności Funduszu Sprawiedliwości.</p>
        <p>1.2. System prowadzi Minister Sprawiedliwości jako Administrator Systemu.</p>
        <p>1.3. System służy publikacji i obsłudze postępowań prowadzonych przez beneficjentów Funduszu Sprawiedliwości oraz zapewnieniu przejrzystości wydatkowania środków publicznych.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">2. Definicje</h2>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Administrator Systemu</strong> - Minister Sprawiedliwości, odpowiedzialny za prowadzenie, utrzymanie, bezpieczeństwo i administrowanie techniczne Systemem.</li>
          <li><strong>System</strong> - aplikacja internetowa Baza Konkurencyjności Funduszu Sprawiedliwości.</li>
          <li><strong>Organizacja</strong> - beneficjent Funduszu Sprawiedliwości prowadzący postępowania i publikujący Ogłoszenia.</li>
          <li><strong>Właściciel konta Organizacji</strong> - użytkownik uprawniony do zarządzania członkami i ich rolami w Organizacji.</li>
          <li><strong>Użytkownik</strong> - osoba fizyczna korzystająca z Systemu, w tym członek Organizacji albo Wykonawca.</li>
          <li><strong>Wykonawca</strong> - podmiot lub osoba składająca Ofertę albo zainteresowana postępowaniem.</li>
          <li><strong>Ogłoszenie</strong> - informacja o postępowaniu opublikowana przez Organizację wraz z załącznikami, pytaniami, odpowiedziami i rozstrzygnięciem.</li>
          <li><strong>Oferta</strong> - dokumenty i informacje przekazane Organizacji przez Wykonawcę w ramach postępowania.</li>
        </ul>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">3. Dostęp i role użytkowników</h2>
        <p>3.1. Przeglądanie publicznych Ogłoszeń nie wymaga konta.</p>
        <p>3.2. Osoba uprawniona do działania w imieniu Organizacji składa wniosek o rejestrację, podając prawdziwe i aktualne dane. Administrator Systemu weryfikuje Organizację i aktywuje jej konto.</p>
        <p>3.3. Pierwszy użytkownik Organizacji otrzymuje rolę właściciela. Właściciel może zapraszać dalszych użytkowników i nadawać im role edytora albo obserwatora. Organizacja odpowiada za aktualność uprawnień i ich niezwłoczne odebranie osobom, które nie powinny mieć dostępu.</p>
        <p>3.4. Użytkownik może wykonywać wyłącznie czynności objęte nadaną rolą i upoważnieniem Organizacji.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">4. Obowiązki użytkownika i bezpieczeństwo konta</h2>
        <p>4.1. Użytkownik chroni hasło i kody uwierzytelniające, nie udostępnia konta innym osobom oraz zgłasza podejrzenie przejęcia konta.</p>
        <p>4.2. Użytkownik powinien korzystać z uwierzytelniania dwuetapowego. Jest ono szczególnie zalecane właścicielom kont Organizacji i użytkownikom z uprawnieniami administracyjnymi.</p>
        <p>4.3. Administrator Systemu może czasowo zablokować konto, jeżeli wymaga tego bezpieczeństwo Systemu, ochrona danych lub wyjaśnienie naruszenia Regulaminu.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">5. Publikacja i odpowiedzialność Organizacji</h2>
        <p>5.1. Organizacja samodzielnie przygotowuje, publikuje i aktualizuje Ogłoszenie, prowadzi postępowanie, odpowiada na pytania, przyjmuje Oferty oraz publikuje rozstrzygnięcie.</p>
        <p>5.2. Organizacja odpowiada za zgodność postępowania i opublikowanych treści z prawem, dokumentacją finansowania, zawartą umową oraz zasadami uczciwej konkurencji.</p>
        <p>5.3. Organizacja odpowiada za prawidłowość, kompletność i aktualność treści oraz za posiadanie podstawy prawnej do publikacji danych osobowych.</p>
        <p>5.4. Przed publikacją Organizacja sprawdza Ogłoszenie i załączniki oraz usuwa albo anonimizuje dane nadmiarowe. Zabronione jest publikowanie danych szczególnych kategorii lub innych danych niewymaganych do przeprowadzenia postępowania.</p>
        <p>5.5. W danych kontaktowych należy w pierwszej kolejności używać służbowych lub funkcyjnych adresów e-mail i numerów telefonu.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">6. Odpowiedzialność Administratora Systemu</h2>
        <p>6.1. Administrator Systemu odpowiada za techniczne działanie, utrzymanie i zabezpieczenie Systemu oraz za przetwarzanie danych pozostające w jego zakresie.</p>
        <p>6.2. Administrator Systemu nie prowadzi postępowań Organizacji, nie wybiera Wykonawców i nie zastępuje Organizacji w ocenie legalności danych zamieszczanych przez nią w Ogłoszeniach.</p>
        <p>6.3. Administrator Systemu może wykonywać niezbędne prace serwisowe, czasowo ograniczyć dostęp oraz podejmować działania służące usunięciu awarii lub zagrożenia.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">7. Treści niedozwolone i zgłoszenia</h2>
        <p>7.1. Nie wolno zamieszczać treści bezprawnych, naruszających prawa osób trzecich, zawierających złośliwe oprogramowanie, dane pozyskane bez podstawy prawnej ani treści niezwiązanych z przeznaczeniem Systemu.</p>
        <p>7.2. Administrator Systemu może ograniczyć dostęp do treści naruszającej prawo, bezpieczeństwo lub Regulamin, zabezpieczyć ją na potrzeby postępowania wyjaśniającego oraz powiadomić Organizację o przyczynie działania.</p>
        <p>7.3. Podejrzenie występowania treści bezprawnej można zgłosić za pomocą <Link href="/kontakt">formularza kontaktowego</Link>, wskazując adres Ogłoszenia, opis treści i uzasadnienie zgłoszenia oraz dane kontaktowe zgłaszającego.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">8. Ochrona danych osobowych</h2>
        <p>8.1. Minister Sprawiedliwości jest administratorem danych związanych z prowadzeniem i bezpieczeństwem Systemu. Organizacja jest odrębnym administratorem danych przetwarzanych w prowadzonych przez nią postępowaniach.</p>
        <p>8.2. Każdy administrator realizuje obowiązki informacyjne oraz prawa osób w zakresie danych, za które odpowiada.</p>
        <p>8.3. Użytkownik może przetwarzać dane wyłącznie w zakresie nadanych uprawnień, zgodnie z poleceniami właściwego administratora i przy zachowaniu poufności.</p>
        <p>8.4. Szczegółowe informacje znajdują się w <Link href="/polityka-prywatnosci">Polityce prywatności i klauzuli informacyjnej</Link>.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">9. Zmiany Regulaminu</h2>
        <p>Administrator Systemu może zmienić Regulamin w związku ze zmianą prawa, zakresu Systemu, wymagań bezpieczeństwa lub sposobu świadczenia usługi. O istotnych zmianach użytkownicy posiadający konto zostaną poinformowani w Systemie lub pocztą elektroniczną.</p>

        <h2 className="text-xl font-semibold text-[#145447] mt-8 mb-4">10. Postanowienia końcowe</h2>
        <p>W sprawach nieuregulowanych w Regulaminie zastosowanie mają przepisy prawa polskiego i prawa Unii Europejskiej właściwe dla danego działania oraz warunki dokumentacji finansowania i umowy zawartej z Organizacją.</p>
      </div>
    </div>
  );
}
