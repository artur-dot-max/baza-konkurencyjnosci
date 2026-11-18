# Projekt — Baza Konkurencyjności Funduszu Sprawiedliwości

## Zasada prowadzenia rejestru

Każda modyfikacja kodu, konfiguracji, schematu bazy danych, testów lub dokumentacji musi zostać dopisana w sekcji „Dziennik zmian”. Wpis powinien zawierać datę, zakres, listę zmienionych plików, uzasadnienie oraz wynik weryfikacji. Nie należy usuwać wcześniejszych wpisów.

## Stan projektu po audycie

- Data ostatniego audytu: 2026-11-18.
- Aplikacja: Next.js 15, React 19, TypeScript, Prisma i PostgreSQL.
- Zakres funkcjonalny: publiczne ogłoszenia, konta organizacji i wykonawców, oferty, pytania i odpowiedzi, rozstrzygnięcia, panel administratora, aktualności, audyt, powiadomienia, 2FA, pliki i kolejka e-mail.
- `npm run check`: zakończone powodzeniem; lint i typecheck bez błędów, 31/31 testów jednostkowych zaliczonych. Ostrzeżenie dotyczące użycia `<img>` usunięto 2026-11-16.
- `npm run build`: zakończone powodzeniem z celowo niedostępnym adresem PostgreSQL; build nie wykonuje zapytań do bazy, nie zawiera błędów Prisma/P1001 ani wcześniejszych ostrzeżeń `jose`/Auth.js w Edge Runtime.
- Testy E2E uruchomiono 2026-11-18 na świeżej, izolowanej bazie PostgreSQL 16 `bk_test`: zastosowano 7/7 migracji i zaliczono 11/11 scenariuszy.
- `npm audit --omit=dev --audit-level=high`: 0 podatności w zależnościach produkcyjnych. Pełny audyt narzędzi developerskich wykazuje 18 zgłoszeń `HIGH` pochodzących z jednego advisory `picomatch`; brak podatności `CRITICAL` i brak dostępnej bezpiecznej wersji w aktualnym drzewie Tailwind/ESLint.
- Gotowość produkcyjna: `NO GO` do czasu skonfigurowania produkcyjnego skanera antymalware oraz formalnego zatwierdzenia okresów retencji. Bramka migracji i pełnego E2E na PostgreSQL została zamknięta 2026-11-18.
- Repozytorium Git zainicjalizowano 2026-11-16 na gałęzi `main`; zdalny `origin` wskazuje `https://github.com/artur-dot-max/baza-konkurencyjnosci.git`.

## Mocne strony

- Czytelny podział na warstwę aplikacji, komponenty, biblioteki domenowe, Prisma, skrypty i testy.
- Kontrola dostępu jest realizowana nie tylko w interfejsie, ale również w endpointach API; role organizacji rozróżniają właściciela, edytora i obserwatora.
- Sesja JWT jest ponownie sprawdzana w bazie, co pozwala unieważnić dostęp po blokadzie konta lub zmianie hasła.
- Wdrożono 2FA TOTP, jednorazowe kody zapasowe, hashowanie haseł i tokenów resetu oraz limitowanie żądań.
- Uploady mają limity rozmiaru, listę dozwolonych typów, kontrolę sygnatury pliku, losowe nazwy, podpisane tokeny i sprawdzanie właściciela przy pobieraniu.
- Treści HTML są sanityzowane przed wyświetleniem; aplikacja ustawia podstawowe nagłówki bezpieczeństwa i CSP.
- Model danych ma sensowne relacje, indeksy, kaskady usuwania i osobne encje audytu, błędów, powiadomień oraz kolejki pocztowej.
- Są testy jednostkowe bezpieczeństwa i uprawnień oraz jeden rozbudowany scenariusz E2E całego procesu zakupowego.
- Projekt ma przygotowane migracje, seed, Docker, healthcheck, worker pocztowy oraz skrypty kopii i odtwarzania bazy.

## Słabe strony i zalecane zmiany

### P0 — bezpieczeństwo zależności — zrealizowane 2026-11-06

1. Next.js i `eslint-config-next` zaktualizowano z 15.5.25 do 15.5.29 bez migracji do nowej głównej wersji frameworka.
2. Zaktualizowano `sanitize-html`, `nodemailer` oraz podatne zależności przechodnie, w tym `sharp`, `source-map-js`, `postcss-selector-parser`, `minimatch` i `brace-expansion`.
3. Zod zmigrowano z 3.25.76 do 4.6.7, adapter formularzy do `@hookform/resolvers` 5.9.2, a wywołania niezgodne z API Zod 4 dostosowano bez zmiany reguł walidacji.
4. Zachowano `next-auth` 5.0.0-beta.32; podatność przechodnią usunięto aktualizacją `nodemailer`, bez niezgodnego downgrade'u sugerowanego przez `npm audit fix --force`.

### P1 — weryfikacja wydania

1. Zrealizowane 2026-11-06: uruchomiono PostgreSQL 16.15 z bazą `bk_test`, zastosowano wszystkie migracje i potwierdzono 10/10 scenariuszy E2E.
2. Zrealizowane 2026-11-06: dodano GitHub Actions CI wykonujące `npm ci`, migracje na izolowanym PostgreSQL, audyt zależności, `npm run check`, build bez dostępu do bazy oraz E2E.
3. Zrealizowane 2026-11-06: strona główna korzystająca z danych Prisma jest renderowana dynamicznie podczas żądania. Build jest celowo wykonywany z niedostępnym adresem bazy i kończy się bez błędów połączenia, co zapobiega ponownemu wprowadzeniu zależności builda od PostgreSQL.
4. Zrealizowane 2026-11-16: middleware Edge nie importuje już Auth.js/`jose`; ochrona ról pozostaje wykonywana przez layouty serwerowe i endpointy. Produkcyjny build nie raportuje ostrzeżeń Edge Runtime.

### P2 — jakość i utrzymanie

1. Zrealizowane 2026-11-16: kod QR korzysta z `next/image` w wydzielonym komponencie i nie generuje ostrzeżenia lint.
2. Częściowo zrealizowane 2026-11-16: logikę kreatora nowego ogłoszenia, wskaźnik kroków, formularz zmiany hasła i panele 2FA rozdzielono na mniejsze komponenty i hook. Plik nowego ogłoszenia zmniejszono z 494 do 342 linii, a ustawienia bezpieczeństwa konta z 385 do 273 linii. Nadal warto podzielić widok szczegółów ogłoszenia i pozostałe moduły przekraczające około 250 linii.
3. Częściowo zrealizowane 2026-11-16: zestaw zwiększono z 15 do 22 testów. Dodano testy tras API, CSP/nonce, dodatkowych wariantów uprawnień, retencji, walidacji treści publicznych i anonimizacji danych autora pytania. Nadal należy rozwijać testy integracyjne endpointów korzystających z bazy.
4. Zrealizowane 2026-11-16: produkcyjna CSP używa osobnego nonce dla każdego żądania, `strict-dynamic`, `object-src 'none'` i nie zawiera `'unsafe-inline'`. Dokładne style atrybutowe generowane przez Next.js są dopuszczone wyłącznie przez trzy hashe i `unsafe-hashes`.
5. Zrealizowane 2026-11-16: usunięto wildcard `images.remotePatterns`; aplikacja nie korzysta z obrazów zewnętrznych, więc dozwolone są wyłącznie obrazy lokalne oraz źródła określone w CSP.
6. Zrealizowane 2026-11-18: dodano mechanizm sprzątania osieroconych plików tymczasowych po 24 godzinach i dodatkowej godzinie bezpieczeństwa; mechanizm pomija pliki przypisane do rekordów oraz dowiązania symboliczne.
7. Dodać repozytorium Git lub odzyskać katalog `.git`, aby zapewnić historię, przegląd zmian i możliwość bezpiecznego wycofania modyfikacji.

## Dziennik zmian

### 2026-11-17–18 — przedprodukcyjny audyt bezpieczeństwa, integralności i gotowości operacyjnej

- Raport: dodano `AUDYT_PRZEDPRODUKCYJNY_2026-11-18.md` z podsumowaniem wykonawczym, oceną ryzyka, opisem znalezisk, planem migracji i regresji oraz decyzją wydaniową `NO GO`.
- Krytyczna izolacja ofert: usunięto automatyczne przypisywanie anonimowych ofert na podstawie samej zgodności adresu e-mail. Panel wykonawcy, pobieranie załączników i składanie ofert wymagają teraz rzeczywistego `userId` albo zgodnego, podpisanego tokenu właściciela uploadu. Usuwa to możliwość przejęcia cudzej oferty przez rejestrację konta z adresem ofiary.
- Integralność i współbieżność: dodano unikalność ofert dla par `announcementId/bidderEmail` i `announcementId/userId`, unikalność nazw załączników oraz blokady wiersza ogłoszenia i ponowną walidację stanu wewnątrz transakcji dla ofert, pytań, odpowiedzi i rozstrzygnięć. Migracja celowo przerywa się przy istniejących duplikatach zamiast arbitralnie usuwać dane.
- Uprawnienia: poprawiono rozdzielenie odczytu i zapisu Organizacji; rola `VIEWER` może odczytać dane, ale nie może wykonać `PUT`. Rozszerzono scenariusz E2E o próbę niedozwolonej modyfikacji.
- Pliki: dodano wykrywanie rzeczywistego typu PDF/DOCX/XLSX, odrzucanie pustych, zbyt dużych i niezgodnych plików, produkcyjny tryb fail-closed dla zewnętrznego skanera antymalware, ograniczony bypass wyłącznie dla E2E na bazie `_test`, wspólną kontrolę właściciela tokenu oraz bezpieczne sprzątanie osieroconych uploadów. Konfigurację opisano w `.env.example`, `docker-compose.yml`, `README.md` i `INSTRUKCJA_KOMPILACJI.md`.
- 2FA: włączenie TOTP wymaga ponownego podania aktualnego hasła. Zużycie kodu zapasowego używa atomowego warunku optymistycznego, dzięki czemu dwa równoległe logowania nie mogą wykorzystać tego samego kodu.
- Audyt: usunięto pomocnik połykający błędy zapisu. Krytyczne operacje zapisują log audytowy w tej samej transakcji co zmiana biznesowa, a nowy trigger PostgreSQL uniemożliwia modyfikację i usuwanie logów poza jawnym trybem konserwacyjnym.
- Poczta i przypomnienia: kolejka ma limit prób, wykładniczy backoff, stan trwałej porażki, skrócony bezpieczny opis błędu i raportowanie w healthchecku. Retencja usuwa tylko wiadomości już wysłane. Przypomnienia terminowe są rezerwowane atomowo przez unikalny rekord kolejki.
- Konta i zaproszenia: adresy e-mail są normalizowane do małych liter; migracja wymusza unikalność bez względu na wielkość liter. Reset hasła unieważnia wcześniejsze tokeny i zapisuje token, wiadomość oraz audyt atomowo. Endpoint zaproszeń nie ujawnia hasha tokenu i nie tworzy niewykonalnego zaproszenia dla istniejącego konta.
- Eksport i kopie: komórki CSV są neutralizowane przed interpretacją jako formuły. Skrypt backupu odrzuca retencję mniejszą niż jeden dzień i sprawdza rzeczywistą granicę katalogu docelowego zamiast podatnego porównania prefiksu ścieżki.
- Zależności i CI: dodano `file-type`, przeniesiono `tailwindcss-animate` do zależności developerskich oraz rozdzielono bramkę audytu na blokujący audyt produkcyjny `HIGH` i pełny audyt blokujący `CRITICAL`. Nie zastosowano pozornego override dla `picomatch`, ponieważ najnowsza dostępna wersja nadal podlega advisory.
- Testy: dodano testy walidacji plików, skanera, właściciela tokenów, neutralizacji CSV, polityki kolejki pocztowej i sprzątania uploadów; zestaw jednostkowy zwiększono z 22 do 31 testów. E2E rozszerzono o odrzucenie duplikatu oferty i blokadę zapisu dla `VIEWER`.
- Schemat i migracja: zmieniono `prisma/schema.prisma`; dodano `prisma/migrations/202611170001_offer_integrity/migration.sql` z kontrolami danych, indeksami unikalnymi, polami kolejki pocztowej oraz ochroną append-only logów audytowych.
- Najważniejsze zmienione moduły aplikacji: trasy ofert, uploadów, pytań, odpowiedzi, rozstrzygnięć, Organizacji, zaproszeń, resetu hasła, 2FA, wiadomości administratora, aktualności i użytkowników; `src/auth.ts`, `src/lib/deadline-reminders.ts`, `src/lib/mail.ts`, `src/lib/moderation.ts`, skrypty administratora, workera pocztowego i backupu.
- Nowe moduły: `src/lib/file-validation.ts`, `src/lib/mail-policy.ts`, `src/lib/offer-security.ts`, `src/lib/upload-cleanup.ts`, `tests/unit/file-security.test.ts`, `tests/unit/mail-policy.test.ts`, `tests/unit/upload-cleanup.test.ts`.
- Usunięty moduł: `src/lib/audit.ts`, ponieważ ukrywał błędy zapisu i pozwalał zatwierdzić zmianę biznesową bez wymaganego śladu audytowego.
- Weryfikacja wykonana podczas audytu: `npm run check` — 31/31 testów, lint i typecheck bez błędów; `npm run build` z celowo niedostępną bazą — sukces i 65 tras; `npx prisma validate` — sukces; produkcyjny audyt zależności — 0 podatności; negatywne próby skryptu backupu — sukces; 7/7 migracji na świeżej bazie PostgreSQL 16 — sukces; `npm run test:e2e` — 11/11 scenariuszy.
- Ograniczenia i decyzja: lokalna bramka migracji i E2E została zamknięta. Do czasu uruchomienia i operacyjnego przetestowania produkcyjnego skanera antymalware oraz zatwierdzenia okresów retencji decyzja wydaniowa pozostaje `NO GO`.

### 2026-11-16 — przygotowanie pierwszego wydania i repozytorium GitHub

- Zmienione pliki: `README.md`, `.gitignore`, `.env.example`, `package.json`, `package-lock.json`, `src/components/layout/Footer.tsx`, `projekt.md`.
- Nowe pliki: `INSTRUKCJA_KOMPILACJI.md`, `.gitattributes`, `src/lib/product-info.ts` oraz lokalne metadane `.git`.
- Repozytorium: zainicjalizowano Git na gałęzi `main` i dodano zdalny `origin` wskazujący `https://github.com/artur-dot-max/baza-konkurencyjnosci.git`. To pierwszy punkt historii całego dotychczasowego projektu; wcześniejszych zmian nie można rozdzielić na osobne historyczne commity, ponieważ katalog wcześniej nie zawierał `.git`.
- Wersja produktu: przyjęto roboczy symbol `BKFS` i wersję `1.0.0`. Symbol został jawnie oznaczony jako wymagający potwierdzenia w rejestrze systemów MS. Informacja `BKFS 1.0.0` znajduje się w README, instrukcji kompilacji, kodzie `src/lib/product-info.ts`, `package.json` oraz stopce aplikacji.
- README: dostosowano strukturę do wzoru MS — dodano symbol, wersję, nazwę, przyczynę zmiany, wersję bazową, historię zmian, odnośniki do dokumentacji, wymagania środowiskowe, konfigurację, kontrolę jakości, uruchamianie, kopie zapasowe, strukturę repozytorium i model formalnego przekazania przez Bitbucket MS. Usunięto niepotwierdzoną deklarację licencji MIT.
- Instrukcja kompilacji: opisano środowisko Windows/Linux/Docker, Node.js 22.12+, npm, PostgreSQL, OpenSSL, narzędzia i zależności, przygotowanie przez `npm ci`, kontrolę jakości, build standalone, build Docker, E2E, lokalizację artefaktów i kryteria potwierdzenia poprawności.
- `.gitignore`: usunięto duplikaty, dodano standardowe wzorce artefaktów MS/Bitbucket oraz wykluczenia zależności, buildów, raportów, lokalnych konfiguracji, sekretów, uploadów, kopii zapasowych, plików tymczasowych, katalogów `tmp` i `output` oraz jednorazowego generatora prototypu `generate_components.js`.
- `.gitattributes`: ujednolicono zakończenia linii LF dla kodu i dokumentacji, CRLF dla skryptów PowerShell oraz oznaczono pliki graficzne i PDF jako binarne.
- Konfiguracja przykładowa: wszystkie pola sekretów i hasła w `.env.example` zastąpiono jednoznacznymi wartościami typu `change-me`; plik zachowuje komplet kluczy potrzebnych aplikacji i Docker Compose.
- Wymagania Node.js: `package.json` i lockfile deklarują Node.js `>=22.12` oraz npm `>=10`, zgodnie z Dockerfile i CI. Zależności są przypięte przez `package-lock.json`.
- Skan przekazywanych plików: `.env`, `node_modules`, `.next`, `.next-dev`, `.local`, `tmp`, `output`, raporty testów i jednorazowy generator są ignorowane. Nie wykryto kluczy prywatnych, tokenów GitHub ani kluczy chmurowych. Pozostałe dopasowania sekretów dotyczą wyłącznie jawnych wartości przykładowych lub testowych.
- Weryfikacja: czyste `npm ci` — sukces; `prisma generate` — sukces; `npm audit --omit=dev` — 0 podatności; `npm run check` — sukces, lint i typecheck bez błędów, 22/22 testy zaliczone; `npm run build` z celowo niedostępną bazą — sukces, bez ostrzeżeń `jose`/Edge Runtime i bez błędów Prisma/P1001.
- Ograniczenie: pełnego E2E nie powtórzono, ponieważ lokalny silnik Docker Desktop pozostaje niedostępny. Ostatni pełny wynik E2E wynosi 10/10. Przed formalnym tagiem i pull requestem do Bitbucket MS należy potwierdzić symbol produktu, odnośnik Confluence i numer zgłoszenia JIRA.

### 2026-11-16 — poprawki techniczne: CSP, Edge Runtime, obrazy, testy i podział komponentów

- Zmienione pliki: `next.config.ts`, `src/middleware.ts`, `src/components/account-security-settings.tsx`, `src/components/ui/file-dropzone.tsx`, `src/components/ui/progress.tsx`, `src/app/(dashboard)/panel/nowe-ogloszenie/page.tsx`, `src/app/api/announcements/[id]/questions/route.ts`, `tests/unit/access.test.ts`, `projekt.md`.
- Nowe pliki: `src/components/announcements/announcement-wizard-progress.tsx`, `src/components/announcements/use-announcement-form.ts`, `src/components/account/password-change-card.tsx`, `src/components/account/totp-setup-panels.tsx`, `src/lib/retention.ts`, `src/lib/moderation.ts`, `tests/unit/endpoints.test.ts`, `tests/unit/retention-moderation.test.ts`.
- Kod QR: natywny element `<img>` zastąpiono komponentem `next/image` z `unoptimized`, odpowiednim dla lokalnego adresu `data:` generowanego przez endpoint konfiguracji TOTP. Usunięto ostatnie ostrzeżenie lint dotyczące `<img>`.
- Auth.js i Edge Runtime: middleware przestał importować `NextAuth` i konfigurację Auth.js. Dzięki temu pakiet `jose` nie jest dołączany do middleware Edge i produkcyjny build nie zgłasza ostrzeżeń o niedozwolonej ewaluacji dynamicznej. Autoryzacja stron pozostaje wymuszana w layoutach serwerowych, a autoryzacja operacji w endpointach API.
- CSP: statyczny nagłówek z `next.config.ts` zastąpiono polityką generowaną w middleware. Każde żądanie otrzymuje losowy nonce przekazywany do renderera Next.js. Polityka obejmuje `strict-dynamic`, `object-src 'none'`, `frame-ancestors 'none'`, ograniczenia `base-uri` i `form-action` oraz `upgrade-insecure-requests` na produkcji. Usunięto `'unsafe-inline'`. Trzy stałe style atrybutowe emitowane przez `next/image` i komunikator tras Next.js dopuszczono precyzyjnymi hashami przez `style-src-attr 'unsafe-hashes'`.
- Style dynamiczne: własne style inline pasków postępu zastąpiono natywnymi elementami `<progress>` i segmentowym wskaźnikiem kroków opartym na klasach. Skan źródeł nie wykrywa już `style={{...}}`.
- Obrazy zdalne: usunięto `images.remotePatterns` zezwalające na każdy host HTTPS. W kodzie nie znaleziono wykorzystania zdalnych obrazów wymagających allowlisty.
- Retencja: dodano testowalne funkcje walidacji reguł retencji, obliczania daty granicznej i kwalifikowania rekordów po przekroczeniu okresu. Nie wpisano arbitralnych okresów — konkretne wartości nadal wymagają zatwierdzenia prawnego i organizacyjnego.
- Moderacja i prywatność pytań: schemat pytań publicznych odrzuca niedozwolone znaki sterujące i waliduje limity oraz adres e-mail. Redakcję imienia i adresu autora z publicznej odpowiedzi API przeniesiono do osobnej, testowanej funkcji.
- Testy: dodano kontrole odmowy dostępu do wewnętrznego endpointu pocztowego, odpowiedzi `405` endpointu użytkowników, unikalności nonce i braku `'unsafe-inline'`, granic retencji, nieprawidłowych reguł retencji, walidacji treści publicznych, anonimizacji autora oraz dodatkowych przypadków ról `ADMIN`, `OWNER`, `EDITOR`, `VIEWER`, `CONTRACTOR` i obcej Organizacji.
- Podział modułów: logikę i stan kreatora ogłoszenia przeniesiono do `use-announcement-form.ts`, pasek kroków do osobnego komponentu, a formularz zmiany hasła oraz panele konfiguracji TOTP i kodów zapasowych wydzielono z głównego widoku ustawień konta.
- Weryfikacja: `npm run check` — sukces, lint i typecheck bez błędów, 22/22 testy zaliczone. `npm run build` z celowo niedostępną bazą — sukces; brak ostrzeżeń `jose`, Edge Runtime, `<img>` oraz błędów Prisma/P1001. Produkcyjny serwer zwrócił HTTP 200, CSP zawierał jeden zgodny nonce w nagłówku i HTML. Test Playwright stron logowania, kontaktu i rejestracji Organizacji, w tym otwarcia komponentu wyboru, nie wykazał błędów konsoli ani naruszeń CSP.
- Ograniczenie weryfikacji: pełnego zestawu E2E korzystającego z PostgreSQL nie uruchomiono, ponieważ lokalny silnik Docker Desktop nie był dostępny. Ostatni pełny wynik E2E projektu pozostaje 10/10 z 2026-11-06; po uruchomieniu Dockera należy powtórzyć `npm run test:e2e` na izolowanej bazie `bk_test`.

### 2026-11-07 — wdrożenie uwag IOD i przygotowanie pytań do radców prawnych

- Materiały źródłowe: przeanalizowano pismo IOD z 6 listopada 2026 r. oraz komentarze do projektów Polityki prywatności, Regulaminu Systemu i informacji „O Systemie”. Plików źródłowych nie modyfikowano.
- Zmienione pliki aplikacji: `src/app/(public)/polityka-prywatnosci/page.tsx`, `src/app/(public)/regulamin/page.tsx`, `src/app/(public)/o-systemie/page.tsx`, `src/app/(public)/kontakt/page.tsx`, `src/app/(public)/rejestracja/organizacja/page.tsx`, `src/app/(public)/rejestracja-wykonawcy/page.tsx`, `src/app/(dashboard)/panel/nowe-ogloszenie/page.tsx`, `src/app/(dashboard)/panel/ogloszenia/[id]/edycja/page.tsx`, `src/components/offer-form.tsx` oraz `projekt.md`.
- Nowy dokument: `output/documents/Pismo_do_radcow_prawnych_pytania_IOD.docx`.
- Polityka prywatności: rozdzielono rolę Ministra Sprawiedliwości jako administratora danych związanych z utrzymaniem i technicznym administrowaniem Systemem od roli Organizacji jako administratorów danych w prowadzonych postępowaniach. Dodano dane kontaktowe administratora i IOD, cele i podstawy przetwarzania, kategorie i źródła danych, odbiorców, kryteria retencji, warunkowy zakres praw osób, prawo skargi do Prezesa UODO, informację o braku zautomatyzowanych decyzji i profilowania oraz zasady minimalizacji danych. Usunięto zgodę jako podstawę niezbędnego przetwarzania związanego z kontem, bezpieczeństwem i postępowaniem.
- Regulamin: jednoznacznie wskazano Ministra Sprawiedliwości jako Administratora Systemu; opisano role użytkowników, rejestrację i weryfikację Organizacji, podział odpowiedzialności za techniczne działanie Systemu i treści publikowane przez Organizacje, obowiązek minimalizacji danych oraz sposób zgłaszania treści bezprawnych. Uwierzytelnianie dwuetapowe pozostaje dostępne, ale nie opisano go jako obowiązkowego bez decyzji organizacyjnej.
- Informacja „O Systemie”: dodano informację, kto prowadzi System, kto zakłada i weryfikuje konta, jak Organizacje zapraszają użytkowników oraz kto odpowiada za Ogłoszenia, załączniki i dane osobowe. Wskazano ogólne ramy prawne Funduszu Sprawiedliwości, pozostawiając radcom wskazanie dokładnej podstawy obowiązku używania Systemu i zasady konkurencyjności.
- Formularze i publikacja danych: przy rejestracji Organizacji i Wykonawcy oraz przy formularzu kontaktowym dodano skrócone informacje o przetwarzaniu danych i odnośnik do Polityki prywatności. W formularzach tworzenia i edycji Ogłoszeń oraz składania Ofert dodano ostrzeżenia o publicznym charakterze danych, minimalizacji, weryfikacji załączników oraz niepublikowaniu danych szczególnych kategorii i danych nadmiarowych.
- Pismo do radców prawnych: wyraźnie zaznaczono, że przedstawione pytania pochodzą od IOD. Ujęto dziewięć zagadnień: dokładną podstawę z art. 6 ust. 1 lit. c lub e RODO, obowiązek korzystania z Systemu, status administratorów lub współadministrowanie, zastosowanie aktu o usługach cyfrowych, moderowanie treści, zakres danych publicznych, okresy retencji, zapisy dokumentacji konkursowej i umów oraz prawne warunki uruchomienia produkcyjnego.
- Elementy nadal wymagające rozstrzygnięcia lub realizacji poza kodem: formalna opinia prawna i ewentualna zmiana podstaw prawnych; ocena zastosowania aktu o usługach cyfrowych; ustalenie konkretnych okresów retencji; analiza ryzyka; wpisy do rejestru czynności przetwarzania; upoważnienia; umowy powierzenia z dostawcami; decyzja o obowiązkowym MFA; przeglądy dostępów i testy bezpieczeństwa. Tych punktów nie oznaczono jako zakończonych.
- Weryfikacja aplikacji: `npm run check` — sukces; lint i typecheck bez błędów, 15/15 testów jednostkowych zaliczonych. Pozostało wcześniejsze ostrzeżenie dotyczące użycia `<img>` w `src/components/account-security-settings.tsx`. `npm run build` z celowo niedostępną bazą — sukces, bez błędów Prisma/P1001.
- Weryfikacja dokumentu: sprawdzono obecność wszystkich dziewięciu pytań, brak znaczników roboczych oraz jednoznaczne wskazanie, że są to pytania IOD. Dokument wyrenderowano do PDF i skontrolowano wizualnie na wszystkich 3 stronach; nie stwierdzono przepełnień, uciętego tekstu ani osieroconych nagłówków.

### 2026-11-06–07 — naprawa budowania i uruchamiania obrazu Docker

- Zmienione pliki: `Dockerfile`, `docker-compose.yml`, `projekt.md`.
- Przyczyna: etap zależności używał Node.js 20 mimo wymagania `sanitize-html` dotyczącego Node.js 22.12+, a `npm ci` uruchamiał skrypt `postinstall` z `prisma generate` przed skopiowaniem `prisma/schema.prisma` do obrazu.
- Zmiana: wszystkie etapy obrazu przełączono na Node.js 22 Alpine, schemat i migracje Prisma są kopiowane przed `npm ci`, a OpenSSL jest instalowany w etapach zależności, kompilacji i uruchomieniowym, aby Prisma mogła prawidłowo wykryć bibliotekę kryptograficzną.
- Healthcheck: adres `localhost` zastąpiono `127.0.0.1` w obrazie i Compose. Alpine rozwiązywał `localhost` jako IPv6 `::1`, podczas gdy aplikacja odpowiadała po IPv4, przez co działający kontener był błędnie oznaczany jako niezdrowy.
- Nasłuch: w obrazie uruchomieniowym ustawiono `HOSTNAME=0.0.0.0`; serwer standalone Next.js wcześniej wiązał się wyłącznie z adresem przypisanym do nazwy kontenera, więc wewnętrzny healthcheck na interfejsie loopback nie mógł się połączyć.
- Weryfikacja: pełny `docker compose up -d --build` — sukces; 6/6 migracji zastosowanych, kontenery bazy i aplikacji mają status `healthy`, migrator zakończył się kodem 0, worker pocztowy działa, `/api/health` zwraca HTTP 200 i `{"status":"ok"}`, a strona główna zwraca HTTP 200 oraz prawidłowy tytuł. Worker zwraca lokalnie HTTP 503 przy próbie wysyłki, dopóki w `.env` nie zostanie skonfigurowany serwer SMTP; nie blokuje to podglądu strony.

### 2026-11-06 — CI i build niezależny od bazy danych

- Zmienione pliki: `.github/workflows/ci.yml` (nowy plik), `src/app/(public)/page.tsx`, `projekt.md`.
- CI: dodano workflow GitHub Actions uruchamiany dla `push`, `pull_request` oraz ręcznie. Pipeline używa Node.js 22 i PostgreSQL 16, wykonuje `npm ci`, migracje Prisma, `npm audit --audit-level=high`, `npm run check`, build oraz pełne testy Playwright; raporty Playwright są zachowywane przez 7 dni po niepowodzeniu.
- Izolacja: usługa CI tworzy wyłącznie bazę `bk_test`. Zarówno `DATABASE_URL`, jak i `TEST_DATABASE_URL` wskazują tę bazę dla migracji i E2E.
- Build: stronę główną oznaczono `dynamic = "force-dynamic"`, ponieważ jej statystyki, ogłoszenia i aktualności pochodzą z Prisma i powinny być pobierane w czasie żądania, a nie podczas kompilacji.
- Kontrola regresji: krok builda w CI dostaje celowo niedostępny adres PostgreSQL na porcie `1`, zachowuje log przez `tee` i jawnie przerywa pipeline po wykryciu `prisma:error`, `P1001` lub komunikatu „Can't reach database server”. Obejmuje to również błędy połączenia przechwycone przez kod aplikacji, które same nie zmieniłyby kodu zakończenia builda.
- Weryfikacja lokalna: `npm run build` z niedostępnym PostgreSQL — sukces, 0 dopasowań `prisma:error`, `P1001` i „Can't reach database server”; `npm run check` — sukces, 15/15 testów (pozostało wcześniejsze ostrzeżenie `<img>`); `npm audit --audit-level=high` — 0 podatności; migracje Prisma — brak oczekujących; `npm run test:e2e` — sukces, 10/10 scenariuszy na izolowanym PostgreSQL 16.15. Testową bazę zatrzymano po weryfikacji.
- Ograniczenie środowiska: katalog nadal nie zawiera `.git`, dlatego workflow zacznie działać dopiero po umieszczeniu projektu w repozytorium GitHub.

### 2026-11-06 — uruchomienie i naprawa pełnego E2E

- Zmienione pliki: `tests/e2e/workflow.spec.ts`, `src/app/(public)/deklaracja-dostepnosci/page.tsx`, `projekt.md`.
- Środowisko: uruchomiono tymczasową, izolowaną instancję PostgreSQL 16.15 na `127.0.0.1:55432`, utworzono bazę `bk_test` i zastosowano wszystkie 6 migracji. Nie użyto ani nie zmieniono bazy developerskiej.
- Testy: selektor odpowiedzi zawężono do karty konkretnego pytania, selektor linku wydruku dostosowano do dostępnej nazwy „Drukuj ogłoszenie”, a niejednoznaczne selektory nagłówków i linków ustawiono na dokładne dopasowanie.
- Dostępność: na stronie deklaracji dostępności zmieniono kolor drobnego tekstu „Powiązane” z `text-gray-500` na `text-gray-600`, usuwając naruszenie kontrastu WCAG wykryte przez axe.
- Weryfikacja: `npm run test:e2e` — sukces, 10/10 scenariuszy; `npm run check` — sukces, 15/15 testów jednostkowych i brak błędów typów/lintu (pozostało wcześniejsze ostrzeżenie dotyczące `<img>`); `npm run build` — sukces.
- Artefakty: Playwright wygenerował raport i wynikowy zrzut mobilnego profilu w ignorowanych katalogach testowych.

### 2026-11-06 — aktualizacja bezpieczeństwa zależności

- Zmienione pliki: `package.json`, `package-lock.json`, `src/app/api/account/password/route.ts`, `src/app/api/account/totp/disable/route.ts`, `src/app/api/account/totp/enable/route.ts`, `src/lib/offer-validation.ts`, `src/lib/validators.ts`, `projekt.md`.
- Zakres zależności: Next.js i `eslint-config-next` 15.5.29, `nodemailer` 10.3.1, `sanitize-html` 2.18.1, Zod 4.6.7 oraz `@hookform/resolvers` 5.9.2. Zaktualizowano również bezpieczne wersje zależności przechodnich.
- Zakres kodu: migracja obsługi błędów i parametrów walidacji do API Zod 4 (`errors` na `issues`, `errorMap` i `invalid_type_error` na parametr `error`). Reguły biznesowe i komunikaty walidacyjne pozostały bez zmian.
- Konfiguracja: dodano precyzyjne nadpisania `postcss-selector-parser` 6.1.5 dla `@tailwindcss/typography` oraz `minimatch` 11.0.1 dla `@typescript-eslint/typescript-estree`.
- Bezpieczeństwo: liczba podatności zgłaszanych przez pełne `npm audit` spadła z 10 do 0; nie użyto `npm audit fix --force`.
- Weryfikacja: `npm run check` — sukces (15/15 testów, jedno wcześniejsze ostrzeżenie `<img>`); `npm run build` — sukces na Next.js 15.5.29; `npm audit` — 0 podatności. Build nadal raportuje wcześniejsze ostrzeżenia `jose` w Edge Runtime i obsłużony brak lokalnej bazy PostgreSQL. Testów E2E nie uruchomiono bez wymaganej bazy `_test`.

### 2026-11-06 — utworzenie rejestru projektu

- Zmienione pliki: `projekt.md` (nowy plik).
- Zakres: dodano zasady prowadzenia dziennika, wyniki audytu, mocne i słabe strony oraz uporządkowaną listę rekomendacji.
- Modyfikacje kodu aplikacji: brak.
- Weryfikacja: `npm run check` — sukces (15/15 testów); `npm run build` — sukces z opisanymi ostrzeżeniami; `npm audit --omit=dev` — wykryto 10 podatności produkcyjnych; E2E — nieuruchomione z powodu braku testowej bazy PostgreSQL.
