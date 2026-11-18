# Audyt przedprodukcyjny - Baza Konkurencyjności Funduszu Sprawiedliwości

## Podsumowanie wykonawcze

- Data zakończenia analizy kodu: 2026-11-18.
- Zakres: Next.js, TypeScript, Route Handlers, role i uprawnienia, postępowania, oferty, pytania i odpowiedzi, rozstrzygnięcia, pliki, 2FA, audyt, poczta, PostgreSQL, migracje, kopie zapasowe, testy i CI.
- Najwyższe wykryte ryzyko: `CRITICAL` - możliwość uzyskania dostępu do anonimowej oferty i jej załączników przez utworzenie konta z cudzym adresem e-mail.
- Stan błędu krytycznego: usunięty; dostęp do oferty wymaga identyfikatora konta zapisanego podczas składania oferty.
- Ocena bezpieczeństwa kodu po poprawkach: **8,3/10**.
- Gotowość produkcyjna: **NO GO** do zamknięcia bramek wdrożeniowych opisanych w sekcji „Blockery wydania”.

## Blockery wydania

1. `BLOCKER` - środowisko produkcyjne musi otrzymać działające `MALWARE_SCAN_URL` i `MALWARE_SCAN_TOKEN`. Aplikacja działa fail-closed i bez skanera odrzuca upload kodem `503`.
2. `BLOCKER` organizacyjny - należy zatwierdzić konkretne okresy retencji danych domenowych, logów, ofert, pytań, załączników i kopii zapasowych. Kod nie powinien samodzielnie przyjmować okresów niezatwierdzonych prawnie.

Zamknięta bramka techniczna: 2026-11-18 zastosowano wszystkie siedem migracji na świeżej, izolowanej bazie PostgreSQL 16 `bk_test`, a następnie zaliczono 11/11 scenariuszy E2E.

## Wykryte problemy i poprawki

### BK-SEC-001 - przejęcie cudzej anonimowej oferty przez e-mail

- Ryzyko: `CRITICAL`.
- Pliki i funkcje: `src/app/api/contractors/register/route.ts` (`POST`, usunięto automatyczne przypisanie ofert); `src/app/(contractor)/wykonawca/page.tsx:13`; `src/app/api/uploads/[fileName]/route.ts:64`; `src/lib/offer-security.ts:9`.
- Przyczyna: konto wykonawcy mogło otrzymać oferty i załączniki na podstawie zgodności adresu e-mail, mimo braku potwierdzenia własności skrzynki.
- Scenariusz: atakujący rejestruje konto z adresem znanego oferenta, po czym przegląda jego historyczną ofertę i pobiera poufne załączniki.
- Wpływ biznesowy: ujawnienie oferty, ceny, danych wykonawcy i dokumentów konkurentowi; naruszenie poufności postępowania i danych osobowych.
- Poprawka: usunięto wiązanie po e-mailu. Właścicielem jest wyłącznie `Offer.userId` zapisany podczas złożenia oferty po zalogowaniu.
- Test: `tests/unit/security.test.ts` - „offer ownership requires the account recorded at submission time”.

### BK-BIZ-002 - wyścig oferty z zamknięciem lub rozstrzygnięciem postępowania

- Ryzyko: `HIGH`.
- Pliki i funkcje: `src/app/api/announcements/[id]/offers/route.ts:62`, `src/app/api/announcements/[id]/resolve/route.ts:50`, `src/app/api/announcements/[id]/questions/route.ts:49`, `src/app/api/announcements/[id]/questions/[questionId]/answers/route.ts:25`.
- Przyczyna: status i termin były odczytywane przed transakcją; równoległe żądanie mogło zmienić postępowanie przed zapisem.
- Scenariusz: oferta albo pytanie przechodzi walidację, równolegle organizacja zamyka postępowanie, a zapis dochodzi już po zamknięciu.
- Wpływ biznesowy: spór o termin złożenia, niekompletna lista oferentów i błędne powiadomienia o rozstrzygnięciu.
- Poprawka: blokada wiersza `SELECT ... FOR UPDATE`, ponowny odczyt i walidacja wewnątrz transakcji.

### BK-BIZ-003 - wielokrotne i równoległe oferty

- Ryzyko: `HIGH`.
- Pliki i funkcje: `prisma/schema.prisma:170-171`, `prisma/migrations/202611170001_offer_integrity/migration.sql`.
- Przyczyna: brak ograniczenia unikalnego dla konta lub adresu oferenta w ramach postępowania.
- Scenariusz: dwa równoległe żądania albo zmiana wielkości liter w adresie e-mail tworzą wiele ofert.
- Wpływ biznesowy: niejednoznaczna oferta obowiązująca, zaburzenie oceny i możliwość manipulacji postępowaniem.
- Poprawka: normalizacja e-maila oraz unikalność `(announcementId, bidderEmail)` i `(announcementId, userId)`. Migracja przerywa się zamiast samodzielnie usuwać istniejące duplikaty.
- Test: scenariusz E2E odrzucający drugą ofertę kodem `409`.

### BK-ACC-004 - rola VIEWER mogła modyfikować organizację

- Ryzyko: `HIGH`.
- Plik i funkcja: `src/app/api/organizations/[id]/route.ts:32`, `PUT`.
- Przyczyna: użycie kontroli samej przynależności `ownsOrganization` zamiast uprawnienia do zapisu.
- Scenariusz: obserwator wysyła własne body do endpointu i zmienia nazwę, adres lub dane kontaktowe organizacji.
- Wpływ biznesowy: nieautoryzowana zmiana danych podmiotu i utrata integralności informacji publikowanych w postępowaniach.
- Poprawka: `PUT` wymaga `canWriteOrganization`; `GET` pozostaje dostępny dla członka organizacji.
- Test: E2E „viewer can inspect the organization but cannot modify it”.

### BK-UPL-005 - token załącznika oferty nie był związany z przesyłającym

- Ryzyko: `HIGH`.
- Pliki i funkcje: `src/app/api/announcements/[id]/offers/route.ts`, `POST`; `src/lib/upload-token.ts`; `src/lib/offer-security.ts`.
- Przyczyna: specjalny weryfikator sprawdzał podpis i cel tokenu, ale ignorował `userId`/identyfikator gościa.
- Scenariusz: przechwycony token pliku zostaje dołączony do oferty innego użytkownika.
- Wpływ biznesowy: nieautoryzowane użycie dokumentu i możliwe ujawnienie treści organizacji.
- Poprawka: jedna weryfikacja HMAC wymagająca zgodności właściciela oraz celu `offer`.
- Test: `tests/unit/security.test.ts` - token odrzucony dla innego aktora i celu.

### BK-UPL-006 - MIME spoofing, archiwa ZIP i brak obowiązkowego skanowania

- Ryzyko: `HIGH`.
- Pliki i funkcje: `src/lib/file-validation.ts:69`, oba endpointy uploadu.
- Przyczyna: wcześniejsza kontrola sygnatury `PK` uznawała dowolny ZIP za DOCX/XLSX i dopuszczała zwykłe archiwa.
- Scenariusz: atakujący zmienia rozszerzenie archiwum lub przesyła złośliwy dokument do pobrania przez zamawiającego.
- Wpływ biznesowy: dystrybucja malware, ryzyko infekcji stanowisk i utraty danych.
- Poprawka: identyfikacja rzeczywistego typu przez `file-type`, blokada ZIP/SVG/plików wykonywalnych, limit żądania i produkcyjny skaner fail-closed (`204` czysty, `422` zagrożenie).
- Testy: `tests/unit/file-security.test.ts`.
- Warunek operacyjny: skaner i limit body na reverse proxy muszą zostać skonfigurowane przed wdrożeniem.

### BK-AUD-007 - zmiana biznesowa mogła zostać zapisana bez śladu audytowego

- Ryzyko: `HIGH`.
- Pliki i funkcje: trasy modyfikujące ogłoszenia, użytkowników, organizacje, aktualności, wiadomości, zaproszenia, pytania i 2FA; `prisma/migrations/202611170001_offer_integrity/migration.sql:84`.
- Przyczyna: wpis audytowy często powstawał po operacji, a wspólny helper ignorował błąd zapisu.
- Scenariusz: awaria zapisu audytu po zatwierdzeniu zmiany pozostawia operację bez śladu; użytkownik uprzywilejowany próbuje zmienić lub usunąć log.
- Wpływ biznesowy: brak rozliczalności i niewiarygodna historia zmian.
- Poprawka: audyt przeniesiono do transakcji biznesowych, usunięto helper ignorujący błędy i dodano bazodanowy trigger append-only. Kontrolowana konserwacja wymaga jawnego `SET LOCAL app.audit_maintenance = 'on'`.

### BK-MAIL-008 - niewysłane wiadomości były usuwane przez retencję

- Ryzyko: `HIGH`.
- Pliki i funkcje: `src/lib/mail.ts:14-48`, `src/lib/mail-policy.ts`, `src/app/api/health/route.ts:7`.
- Przyczyna: sprzątanie usuwało wszystkie wpisy starsze niż 30 dni, także nigdy niewysłane.
- Scenariusz: długotrwała awaria SMTP powoduje wyczerpanie prób, a wiadomość później znika bez potwierdzenia dostarczenia.
- Wpływ biznesowy: utrata resetów haseł, zaproszeń, potwierdzeń ofert i informacji o rozstrzygnięciu.
- Poprawka: usuwane są wyłącznie wysłane wiadomości; po 10 próbach wpis otrzymuje `failedAt`/`lastError`, powstaje błąd administracyjny, a healthcheck raportuje stan `degraded`.
- Testy: `tests/unit/mail-policy.test.ts`.
- Ograniczenie: SMTP zapewnia semantykę co najmniej raz; deterministyczny `Message-ID` ogranicza, ale nie eliminuje duplikatu po awarii między wysyłką a zapisem `sentAt`.

### BK-2FA-009 - włączenie 2FA bez ponownego podania hasła

- Ryzyko: `HIGH`.
- Pliki i funkcje: `src/app/api/account/totp/enable/route.ts:15-48`, `src/components/account/totp-setup-panels.tsx`.
- Przyczyna: aktywna sesja wystarczała do wygenerowania i aktywowania nowego sekretu TOTP.
- Scenariusz: osoba z przejętą sesją włącza własny Authenticator na koncie ofiary i powoduje blokadę dostępu.
- Wpływ biznesowy: przejęcie ustawień bezpieczeństwa lub odmowa dostępu do konta.
- Poprawka: aktywacja wymaga aktualnego hasła oraz poprawnego kodu TOTP; operacja jest audytowana.

### BK-2FA-010 - równoległe użycie jednego kodu zapasowego

- Ryzyko: `HIGH`.
- Plik i funkcja: `src/auth.ts:54-62`, `authorize`.
- Przyczyna: dwa logowania mogły odczytać tę samą tablicę hashy przed jej aktualizacją.
- Scenariusz: ten sam kod zapasowy zostaje zaakceptowany w dwóch równoległych żądaniach.
- Wpływ biznesowy: naruszenie jednorazowości kodu i dodatkowa sesja atakującego.
- Poprawka: optymistyczna aktualizacja tylko przy niezmienionej tablicy hashy; przegrane żądanie jest odrzucane.

### BK-CSV-011 - formuły w eksporcie ofert

- Ryzyko: `HIGH`.
- Pliki i funkcje: `src/lib/offer-security.ts:14`, `src/app/api/announcements/[id]/offers/export/route.ts:40`.
- Przyczyna: poprawne cytowanie CSV nie neutralizowało komórek zaczynających się od `=`, `+`, `-` lub `@`.
- Scenariusz: wykonawca wpisuje formułę w nazwie/opisie; pracownik otwiera eksport w arkuszu kalkulacyjnym.
- Wpływ biznesowy: wykonanie formuły, wyłudzenie danych lub zewnętrzne odwołanie z komputera pracownika.
- Poprawka: neutralizacja potencjalnej formuły apostrofem przed cytowaniem CSV.

### BK-ID-012 - adresy e-mail rozróżniane wielkością liter

- Ryzyko: `MEDIUM`.
- Pliki i funkcje: rejestracja, logowanie, reset hasła, zaproszenia i `scripts/create-admin.ts`; migracja indeksu `users_email_lower_key`.
- Przyczyna: część zapisów i odczytów używała oryginalnej wielkości liter.
- Scenariusz: powstają logicznie zduplikowane konta lub użytkownik nie może się zalogować inną wielkością liter.
- Wpływ biznesowy: duplikaty tożsamości i błędne przypisania.
- Poprawka: normalizacja do lowercase i bazodanowy indeks funkcjonalny.

### BK-PASS-013 - wiele jednocześnie ważnych tokenów resetu hasła

- Ryzyko: `MEDIUM`.
- Plik i funkcja: `src/app/api/password/forgot/route.ts:18-23`.
- Przyczyna: nowe żądanie nie unieważniało starszych tokenów.
- Scenariusz: wcześniej przechwycony link pozostaje ważny mimo wygenerowania nowszego.
- Wpływ biznesowy: niepotrzebnie długie okno ataku.
- Poprawka: w tej samej transakcji usuwane są poprzednie tokeny użytkownika, tworzony jest nowy token, e-mail i wpis audytu.

### BK-REM-014 - wyścig generatora przypomnień

- Ryzyko: `MEDIUM`.
- Plik i funkcja: `src/lib/deadline-reminders.ts`, `processDeadlineReminders`.
- Przyczyna: wzorzec „sprawdź, potem utwórz” powodował błąd unikalności przy dwóch workerach.
- Scenariusz: dwie instancje równocześnie generują to samo przypomnienie; jedna przerywa cały cykl workera.
- Wpływ biznesowy: opóźnienie pozostałych wiadomości.
- Poprawka: atomowe `createMany(..., skipDuplicates: true)` i wysyłka tylko przez instancję, która uzyskała znacznik.

### BK-FILE-015 - osierocone pliki po wygaśnięciu tokenu

- Ryzyko: `MEDIUM`.
- Pliki i funkcje: `src/lib/upload-cleanup.ts:14`, worker i endpoint wewnętrzny.
- Przyczyna: zapis pliku następował przed utworzeniem rekordu domenowego i nie istniał proces sprzątania.
- Scenariusz: użytkownik wielokrotnie przesyła pliki, ale nie kończy formularza.
- Wpływ biznesowy: niekontrolowany wzrost wolumenu i retencja danych bez podstawy.
- Poprawka: godzinny cleanup usuwa nieprzypisane pliki po 24 godzinach i godzinie bufora, pomijając pliki powiązane w bazie.

### BK-OPS-016 - niebezpieczne parametry retencji kopii

- Ryzyko: `MEDIUM`.
- Plik: `scripts/backup-postgres.ps1:7-14`.
- Przyczyna: ujemna retencja mogła objąć wszystkie kopie; kontrola prefiksu ścieżki akceptowała katalog o podobnej nazwie.
- Scenariusz: błędny parametr usuwa wszystkie kopie albo zapisuje je poza przeznaczonym katalogiem.
- Wpływ biznesowy: utrata możliwości odtworzenia bazy.
- Poprawka: dodatnia retencja i kontrola pełnej granicy katalogu. Testy negatywne parametrów zakończone powodzeniem.

### BK-INV-017 - nadmiarowe dane zaproszeń i zaproszenie istniejącego konta

- Ryzyko: `LOW`.
- Plik i funkcje: `src/app/api/organization/invitations/route.ts`, `GET` i `POST`.
- Przyczyna: odpowiedź zwracała `tokenHash`, a formularz pozwalał wysłać nieskuteczne zaproszenie do konta należącego do innej organizacji.
- Scenariusz: obserwator zespołu pobiera niepotrzebne metadane; właściciel generuje mylące zaproszenie, którego nie można zaakceptować.
- Wpływ biznesowy: nadmiarowa ekspozycja metadanych i błędna komunikacja.
- Poprawka: jawny `select` bez hasha i odrzucenie każdego istniejącego konta.

### BK-DEP-018 - podatność ReDoS w narzędziach developerskich

- Ryzyko raportowane przez advisory: `HIGH`; ekspozycja aplikacji produkcyjnej: niska.
- Pakiet: `picomatch`, advisory `GHSA-fc5q-39xc-vjpf`, łańcuchy Tailwind/ESLint.
- Stan: brak poprawionej wersji `picomatch` w używanym drzewie zależności w dniu audytu. Wymuszenie `npm audit fix --force` wymaga niezgodnej migracji Tailwind 4 i nie usuwa wszystkich ścieżek narzędziowych.
- Ograniczenie ryzyka: `tailwindcss-animate` przeniesiono do `devDependencies`; `npm audit --omit=dev --audit-level=high` zwraca 0 podatności. CI blokuje wysokie podatności produkcyjne oraz krytyczne podatności wszystkich zależności.
- Dalsze działanie: monitorować wydanie poprawionej wersji, zaktualizować lockfile i ponowić pełny audyt.

## Obszary sprawdzone bez potwierdzonego błędu krytycznego

- Wszystkie Route Handlers mają kontrolę sesji, sekret wewnętrzny albo limitowanie dla tras publicznych.
- Poufne oferty są dostępne organizacji prowadzącej, administratorowi oraz kontu zapisanym w `Offer.userId`; brak endpointu usuwania lub edycji złożonej oferty.
- Załączniki ogłoszeń respektują widoczność szkicu, a nazwy plików na dysku są losowe i sprawdzane przed odczytem.
- Reset hasła jest jednorazowy, wygasa, unieważnia sesje i nie wyłącza 2FA.
- Wyłączenie 2FA wymaga hasła oraz kodu TOTP lub zapasowego i unieważnia sesje.
- Rozstrzygnięcie i unieważnienie są transakcyjne, mają kontrolę organizacji i wpis audytu.
- Zapytania aplikacyjne używają Prisma; jedyne surowe zapytania produkcyjne są parametryzowane i służą do blokady wiersza lub healthchecku.
- Administrator aplikacji nie ma endpointu zmiany ani usuwania dziennika audytowego.
- Operacje masowe mają limity, paginację lub ograniczony rozmiar listy odbiorców.

## Plan migracji

1. Wykonać i zweryfikować kopię PostgreSQL oraz osobną kopię `UPLOAD_DIR`.
2. Na kopii bazy uruchomić zapytania kontrolne duplikatów ofert, załączników i e-maili. Migracja celowo przerwie pracę po wykryciu konfliktu.
3. Ręcznie rozstrzygnąć ewentualne duplikaty; nie usuwać ofert automatycznie.
4. Wdrożyć i przetestować wewnętrzny skaner antymalware oraz limity body na reverse proxy.
5. Wykonać `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm run check` i `npm run build`.
6. Wykonać `npm run db:deploy` na kopii bazy, następnie pełne `npm run test:e2e`.
7. Zweryfikować trigger append-only, unikalność ofert, stan kolejki pocztowej i upload czystego oraz zablokowanego pliku.
8. W oknie wdrożeniowym zastosować migrację produkcyjną, uruchomić smoke test i monitoring.
9. Rollback: zatrzymać zapis aplikacji, przywrócić poprzedni obraz, bazę z kopii i odpowiadającą jej kopię załączników. Nie wykonywać ręcznego cofania części migracji na aktywnej bazie.

## Plan regresji

### Automatyczny

- `npm run check` - lint, typecheck i 31 testów jednostkowych.
- `npm run build` z niedostępnym PostgreSQL - potwierdzenie niezależności builda od bazy.
- `npm audit --omit=dev --audit-level=high` - bramka zależności produkcyjnych.
- `npm audit --audit-level=critical` - bramka krytycznych podatności całego drzewa.
- `npm run db:deploy` na PostgreSQL 16 z pustej bazy i z kopii danych przed migracją.
- `npm run test:e2e` - pełny przebieg rejestracji, ról, publikacji, ofert, pytań, rozstrzygnięć, audytu, resetu hasła i CMS.

### Obowiązkowe przypadki dodatkowe

1. `VIEWER`: GET organizacji `200`, PUT organizacji `403`.
2. Druga oferta tego samego e-maila lub konta: `409`, także przy równoległych żądaniach.
3. Oferta kontra rozstrzygnięcie/unieważnienie: wynik zgodny z kolejnością blokady, nigdy zapis po zamknięciu.
4. Token uploadu innego konta/gościa: `400`.
5. ZIP, plik wykonywalny i podszycie MIME: odrzucone; sygnatura testowa malware: `422`.
6. Brak/awaria skanera na produkcji: `503`, brak pliku na dysku.
7. Jeden kod zapasowy w dwóch równoległych logowaniach: dokładnie jedno powodzenie.
8. Błąd zapisu audytu: wycofanie całej operacji biznesowej.
9. Próba `UPDATE`/`DELETE audit_logs`: błąd bez ustawienia trybu konserwacji.
10. Awaria SMTP do 10 prób: backoff; po limicie `failedAt`, zachowanie wiadomości i health `degraded`.
11. Odtworzenie backupu na izolowanej bazie i porównanie liczby rekordów oraz plików.

## Wyniki wykonanych kontroli

- `npm run check`: sukces, 31/31 testów.
- `npm run build` z bazą na niedostępnym porcie: sukces, 65 tras, brak błędu połączenia Prisma.
- `npx prisma validate`: sukces.
- `npm audit --omit=dev --audit-level=high`: 0 podatności.
- Pełny audit narzędzi developerskich: 18 zgłoszeń `HIGH` wynikających z jednego advisory `picomatch`; brak `CRITICAL`.
- Negatywne testy skryptu kopii: odrzucenie retencji `0` i katalogu podobnego do `backups` - sukces.
- Migracje na świeżej, izolowanej bazie PostgreSQL 16 `bk_test`: sukces, zastosowano 7/7 migracji, w tym `202611170001_offer_integrity`.
- `npm run test:e2e`: sukces, 11/11 scenariuszy Playwright, w tym odmowa zapisu dla `VIEWER` i odrzucenie zduplikowanej oferty.

## Decyzja

**NO GO** na 2026-11-18.

Kod po poprawkach nie zawiera znanego otwartego `CRITICAL`, a migracje i E2E na świeżej bazie PostgreSQL zostały zaliczone. Wydanie nie może jednak zostać zaakceptowane produkcyjnie bez podłączenia skanera antymalware oraz zatwierdzenia zasad retencji. Po spełnieniu tych warunków rekomendacja może zostać zmieniona na `GO WITH RISKS`, z jawną akceptacją przejściowego ryzyka narzędziowego `picomatch` i ograniczeń SMTP.
