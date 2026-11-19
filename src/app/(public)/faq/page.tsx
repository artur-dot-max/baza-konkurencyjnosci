import { Metadata } from "next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "FAQ | Baza Konkurencyjności",
  description: "Najczęściej zadawane pytania dotyczące systemu Baza Konkurencyjności.",
}

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#145447] mb-8">Często zadawane pytania (FAQ)</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-[#145447] mb-4">Ogólne</h2>
          <Accordion type="single" collapsible className="w-full bg-white rounded-lg border px-4">
            <AccordionItem value="general-1">
              <AccordionTrigger>Kto może korzystać z systemu?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                System przeznaczony jest dla beneficjentów Funduszu Sprawiedliwości (do publikacji ogłoszeń),
                wykonawców (do składania ofert) oraz wszystkich obywateli, którzy chcą przeglądać opublikowane ogłoszenia.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="general-2">
              <AccordionTrigger>Czy korzystanie z Bazy jest płatne?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Nie, korzystanie z Bazy Konkurencyjności jest całkowicie bezpłatne zarówno dla zamawiających, jak i wykonawców.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="general-3">
              <AccordionTrigger>Czym jest zasada konkurencyjności?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Zasada konkurencyjności to wymóg prowadzenia postępowań o udzielenie zamówienia w sposób zapewniający
                przejrzystość oraz równe traktowanie potencjalnych wykonawców.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#145447] mb-4">Rejestracja</h2>
          <Accordion type="single" collapsible className="w-full bg-white rounded-lg border px-4">
            <AccordionItem value="reg-1">
              <AccordionTrigger>Jak się zarejestrować?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Kliknij „Załóż konto” i wybierz typ konta: <strong>organizacja (zamawiający)</strong> albo{" "}
                <strong>wykonawca / oferent</strong>. Organizacje wypełniają dane rejestrowe i czekają na aktywację
                administratora. Wykonawcy rejestrują się od razu (e-mail + hasło) — konto jest opcjonalne, oferty można
                składać także bez rejestracji.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="reg-2">
              <AccordionTrigger>Jak weryfikowane są konta?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <strong>Organizacja</strong> — administrator sprawdza dane (NIP, REGON, dane kontaktowe) i aktywuje konto,
                zwykle w ciągu 2 dni roboczych. <strong>Wykonawca / oferent</strong> — konto działa od razu po rejestracji;
                wiarygodność oferty potwierdzasz oświadczeniem przy jej złożeniu, a nie osobną weryfikacją konta.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="reg-2b">
              <AccordionTrigger>Czy muszę mieć konto, żeby złożyć ofertę?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Nie. Ofertę przez serwis możesz złożyć jako gość. Konto wykonawcy ułatwia przegląd historii złożonych ofert
                i statusów postępowań w panelu wykonawcy.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="reg-3">
              <AccordionTrigger>Zapomniałem hasła. Co zrobić?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Skorzystaj z opcji "Odzyskaj hasło" dostępnej na stronie logowania. Na podany adres e-mail otrzymasz link do resetowania hasła.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#145447] mb-4">Ogłoszenia</h2>
          <Accordion type="single" collapsible className="w-full bg-white rounded-lg border px-4">
            <AccordionItem value="ann-1">
              <AccordionTrigger>Jak opublikować ogłoszenie?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Po zalogowaniu się na aktywne konto organizacji, przejdź do Panelu Zamawiającego i kliknij "Dodaj ogłoszenie".
                Wypełnij wszystkie wymagane pola formularza i opublikuj.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ann-2">
              <AccordionTrigger>Czy mogę edytować opublikowane ogłoszenie?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Tak, ogłoszenie można edytować do momentu upływu terminu składania ofert. Należy jednak pamiętać,
                że istotne zmiany mogą wymagać wydłużenia terminu składania ofert.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ann-3">
              <AccordionTrigger>Jak opublikować rozstrzygnięcie postępowania?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Po upływie terminu składania ofert, w Panelu Zamawiającego przejdź do szczegółów danego ogłoszenia i wybierz
                opcję "Dodaj rozstrzygnięcie". Podaj dane wybranego wykonawcy i uzasadnienie.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#145447] mb-4">Oferty i konto wykonawcy</h2>
          <Accordion type="single" collapsible className="w-full bg-white rounded-lg border px-4">
            <AccordionItem value="offer-1">
              <AccordionTrigger>Czy dostanę potwierdzenie złożenia oferty?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Tak. Po złożeniu oferty przez serwis zobaczysz numer potwierdzenia na stronie oraz otrzymasz e-mail
                zawierający numer potwierdzenia, datę i godzinę, pełną treść Oferty oraz dodane załączniki. Takie samo
                potwierdzenie otrzymuje Organizacja prowadząca postępowanie. Zapisz numer potwierdzenia.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="offer-2">
              <AccordionTrigger>Gdzie zobaczę historię swoich ofert?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Po założeniu konta wykonawcy i zalogowaniu przejdź do panelu wykonawcy. Zobaczysz złożone oferty,
                statusy postępowań, opisy i załączniki. Ze względów bezpieczeństwa historia obejmuje wyłącznie Oferty
                złożone po zalogowaniu na to konto; sam adres e-mail nie służy do przejmowania wcześniejszych Ofert.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="offer-3">
              <AccordionTrigger>Czy zamawiający publikuje wynik postępowania?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Po rozstrzygnięciu na publicznej stronie ogłoszenia pojawia się wybrany wykonawca i uzasadnienie.
                Oferenci, którzy złożyli oferty, dostają też powiadomienie e-mail (a zalogowani wykonawcy — powiadomienie
                w serwisie).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#145447] mb-4">Zespół organizacji</h2>
          <Accordion type="single" collapsible className="w-full bg-white rounded-lg border px-4">
            <AccordionItem value="team-1">
              <AccordionTrigger>Jakie są role w organizacji?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <strong>Właściciel</strong> zarządza zespołem i ma pełne uprawnienia.
                <strong> Edycja</strong> może tworzyć i zmieniać ogłoszenia, odpowiadać na pytania i rozstrzygać postępowania.
                <strong> Podgląd</strong> tylko przegląda dane — bez zapisu.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="team-2">
              <AccordionTrigger>Jak zaprosić współpracownika?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                W panelu organizacji wybierz „Zespół”. Właściciel wysyła zaproszenie e-mail z rolą Edycja lub Podgląd.
                Zaproszona osoba zakłada hasło przez link z wiadomości.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#145447] mb-4">Techniczne</h2>
          <Accordion type="single" collapsible className="w-full bg-white rounded-lg border px-4">
            <AccordionItem value="tech-1">
              <AccordionTrigger>Jakie formaty plików są akceptowane?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                System akceptuje załączniki w formatach: PDF, DOCX, XLSX oraz ZIP. Maksymalny rozmiar pojedynczego pliku to 10 MB.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tech-2fa">
              <AccordionTrigger>Jak włączyć logowanie dwuetapowe (2FA)?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Po zalogowaniu przejdź do Ustawień konta i włącz 2FA z aplikacją authenticator (np. Google Authenticator).
                Zachowaj kody zapasowe w bezpiecznym miejscu.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tech-2">
              <AccordionTrigger>Jak usunąć konto?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Aby usunąć konto, skontaktuj się z administratorem systemu poprzez formularz na stronie Kontakt lub bezpośrednio
                na adres e-mail wsparcia technicznego.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </div>
  )
}
