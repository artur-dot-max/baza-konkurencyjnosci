# Baza Konkurencyjności Funduszu Sprawiedliwości

| Pole | Wartość |
| --- | --- |
| Symbol | `BKFS` — symbol roboczy, do potwierdzenia w rejestrze systemów MS |
| Wersja | `BKFS 1.0.0` |
| Nazwa | Baza Konkurencyjności Funduszu Sprawiedliwości |
| Przyczyna zmiany | Pierwsze uporządkowane wydanie przeznaczone do przekazania kodów źródłowych |
| Wersja bazowa | Brak — pierwsze wydanie produktu |
| Dokumentacja | [`projekt.md`](projekt.md); docelowy odnośnik Confluence należy uzupełnić po utworzeniu strony systemu |

> Przed formalnym przekazaniem do Bitbucket MS symbol `BKFS` musi zostać potwierdzony z rejestrem systemów MS. Po potwierdzeniu należy zaktualizować ten plik, `package.json`, `INSTRUKCJA_KOMPILACJI.md` i `src/lib/product-info.ts`.

## Opis produktu

Portal do publikowania i prowadzenia postępowań zakupowych Funduszu Sprawiedliwości. Obejmuje publiczną wyszukiwarkę ogłoszeń, konta Organizacji i Wykonawców, składanie ofert, pytania i odpowiedzi, rozstrzygnięcia, panel administratora, audyt, powiadomienia, uwierzytelnianie dwuetapowe, obsługę załączników i kolejkę pocztową.

## Historia zmian

### BKFS 1.0.0

- przygotowano pierwszą kompletną wersję aplikacji i migracji bazy;
- dodano Docker Compose, healthcheck, migrator i worker pocztowy;
- wdrożono kontrolę uprawnień, 2FA, ochronę plików, audyt i nagłówki bezpieczeństwa;
- uwzględniono zmiany wynikające z uwag IOD w treściach prawnych i formularzach;
- dodano CI, testy jednostkowe i E2E oraz build niezależny od dostępności bazy;
- zaostrzono CSP i usunięto ostrzeżenia `jose`/Edge Runtime;
- dostosowano dokumentację repozytorium do procedury przekazywania kodów źródłowych MS.

Szczegółowy dziennik znajduje się w [`projekt.md`](projekt.md).

## Wymagania

- Node.js 22.12 lub nowszy z linii 22 LTS;
- npm 10 lub nowszy;
- PostgreSQL 16;
- OpenSSL dostępny dla Prisma;
- opcjonalnie Docker Desktop z WSL2 albo Docker Engine z Compose v2.

Pełny i powtarzalny proces budowania opisuje [`INSTRUKCJA_KOMPILACJI.md`](INSTRUKCJA_KOMPILACJI.md).

## Uruchomienie lokalne

```powershell
Copy-Item .env.example .env
npm ci
npm run db:deploy
npm run db:seed
npm run dev
```

`db:seed` służy wyłącznie do lokalnego developmentu i testów. Nie wolno uruchamiać go na bazie produkcyjnej.

## Konfiguracja

Konfigurację tworzy się przez skopiowanie `.env.example` do lokalnego, nieewidencjonowanego pliku `.env`. W środowisku produkcyjnym trzeba ustawić co najmniej:

- `DATABASE_URL` — połączenie z PostgreSQL;
- `AUTH_SECRET` i `CRON_SECRET` — dwa niezależne, losowe sekrety;
- `AUTH_URL` i `NEXT_PUBLIC_APP_URL` — publiczny adres HTTPS;
- `SMTP_*`, `MAIL_FROM` i `CONTACT_EMAIL` — wysyłka poczty;
- `UPLOAD_DIR` — trwały katalog załączników;
- `MALWARE_SCAN_URL` i `MALWARE_SCAN_TOKEN` — wewnętrzny skaner plików; żądanie `POST` zwraca `204` dla pliku czystego i `422` dla zagrożenia;
- `TRUST_PROXY=true` wyłącznie za zaufanym reverse proxy nadpisującym nagłówki klienta.

Plików `.env`, kluczy, tokenów, certyfikatów prywatnych i danych produkcyjnych nie wolno dodawać do repozytorium.

## Uruchomienie przez Docker Compose

Po ustawieniu bezpiecznych wartości w `.env`:

```powershell
docker compose up -d --build
docker compose ps
```

Kontener `migrate` stosuje migracje przed uruchomieniem aplikacji. PostgreSQL nie publikuje portu na hoście. Dane bazy i załączniki są przechowywane w osobnych wolumenach. Stan aplikacji jest dostępny pod `/api/health`.

W środowisku produkcyjnym upload działa w trybie fail-closed: brak odpowiedzi poprawnie skonfigurowanego skanera antymalware powoduje odrzucenie pliku kodem `503`. Archiwa ZIP oraz typy wykonywalne nie są przyjmowane.
Reverse proxy musi dodatkowo odrzucać całe żądania większe niż limit uploadu powiększony o narzut `multipart/form-data`; zabezpiecza to pamięć procesu również przy transmisji bez nagłówka `Content-Length`.

## Kontrole jakości

```powershell
npm run check
npm run build
npm run test:e2e
npm audit --omit=dev
```

Testy E2E wymagają izolowanej bazy, której nazwa kończy się `_test`. Domyślny adres to `postgresql://postgres@127.0.0.1:55432/bk_test`; alternatywny adres przekazuje się w `TEST_DATABASE_URL`. Testy czyszczą wskazaną bazę.

## Wdrożenie bez Dockera

1. Wykonać `npm ci`.
2. Ustawić produkcyjne zmienne środowiskowe.
3. Zastosować migracje przez `npm run db:deploy`.
4. Zbudować aplikację przez `npm run build`.
5. Uruchomić `.next/standalone/server.js` oraz `npm run mail:worker` jako oddzielne usługi.
6. Skierować reverse proxy do aplikacji, włączyć HTTPS i monitoring.
7. Objąć kopiami zapasowymi PostgreSQL oraz katalog `UPLOAD_DIR` i okresowo testować odtwarzanie.

## Kopie zapasowe

```powershell
./scripts/backup-postgres.ps1
./scripts/restore-postgres.ps1 -BackupFile ./backups/baza-konkurencyjnosci-YYYYMMDD-HHMMSS.dump
```

Okres retencji kopii musi zostać zatwierdzony organizacyjnie. Załączniki wymagają osobnej kopii infrastrukturalnej.

## Struktura repozytorium

- `src/` — kod aplikacji Next.js i endpointów API;
- `prisma/` — schemat i migracje PostgreSQL;
- `tests/` — testy jednostkowe i E2E;
- `scripts/` — narzędzia administracyjne i worker pocztowy;
- `public/` — statyczne zasoby publiczne;
- `.github/workflows/` — automatyczna kontrola jakości repozytorium roboczego.

Zależności binarne i paczki zewnętrzne nie są przechowywane w repozytorium. Ich dokładne wersje określa `package-lock.json`.

## Model pracy z kodem

Repozytorium GitHub służy obecnie jako repozytorium robocze. Formalne przekazanie do MS powinno nastąpić zgodnie z obowiązującą procedurą przez Bitbucket MS, oznaczony tag wersji i pull request. Komunikaty commitów oraz pull request powinny zawierać numer właściwego zgłoszenia JIRA, kiedy zostanie nadany.

## Prawa do oprogramowania

Zakres praw, licencji i możliwości dalszego rozpowszechniania wynika z umowy oraz ustaleń z Ministerstwem Sprawiedliwości. Samo udostępnienie repozytorium nie nadaje dodatkowej licencji.
