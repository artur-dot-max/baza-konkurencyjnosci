# Instrukcja kompilacji

## 1. Dane identyfikacyjne

| Pole | Wartość |
| --- | --- |
| Nazwa systemu | Baza Konkurencyjności Funduszu Sprawiedliwości |
| Nazwa produktu | Aplikacja webowa Bazy Konkurencyjności Funduszu Sprawiedliwości |
| Symbol | `BKFS` — symbol roboczy, do potwierdzenia w rejestrze systemów MS |
| Wersja systemu | `BKFS 1.0.0` |

## 2. Opis środowiska wytwórczego

### 2.1. System operacyjny i platforma

Kompilację można wykonać na Windows 11 z PowerShell 7, Linux x86-64 albo w obrazie Docker opartym na `node:22-alpine`.

Wymagane oprogramowanie:

- Node.js 22.12 lub nowszy z linii 22 LTS;
- npm 10 lub nowszy;
- OpenSSL, wymagany przez Prisma;
- Git 2.40 lub nowszy;
- PostgreSQL 16 wyłącznie do migracji i testów integracyjnych;
- opcjonalnie Docker Desktop z WSL2 albo Docker Engine i Compose v2.

Sam etap `npm run build` nie wymaga połączenia z bazą danych.

### 2.2. Narzędzia wykorzystywane do kompilacji

- Next.js 15, TypeScript 5, Prisma 5 i Tailwind CSS 3;
- ESLint 8 i Node Test Runner uruchamiany przez `tsx`;
- Playwright do testów E2E.

Dokładne wersje wszystkich zależności są utrwalone w `package-lock.json`. Zależności należy pobierać przez `npm ci`; nie należy kopiować katalogu `node_modules` pomiędzy środowiskami.

### 2.3. Komponenty zewnętrzne

Do zbudowania produktu wymagane są publiczne pakiety npm wyszczególnione w `package.json` i `package-lock.json`. Repozytorium nie wymaga prywatnych bibliotek binarnych. Czcionki generatora PDF są dostarczane przez pakiet `pdfmake`.

## 3. Przebieg kompilacji

### 3.1. Przygotowanie

1. Sklonować repozytorium i przejść do jego katalogu głównego.
2. Sprawdzić wersje narzędzi:

   ```powershell
   node --version
   npm --version
   git --version
   ```

3. Zainstalować zależności dokładnie według lockfile:

   ```powershell
   npm ci
   ```

   Skrypt `postinstall` automatycznie wykonuje `prisma generate` na podstawie `prisma/schema.prisma`.

4. Do standardowego builda nie jest potrzebny plik `.env`. Jeżeli wykonywane będą migracje lub testy E2E, utworzyć lokalny plik konfiguracyjny:

   ```powershell
   Copy-Item .env.example .env
   ```

   Uzupełnić wyłącznie wartości właściwe dla izolowanego środowiska. Pliku `.env` nie wolno commitować.

### 3.2. Kontrola źródeł

```powershell
npm run check
npm audit --omit=dev
```

Oczekiwany wynik: ESLint i TypeScript bez błędów, wszystkie testy jednostkowe zaliczone oraz brak podatności produkcyjnych w audycie.

### 3.3. Kompilacja aplikacji

```powershell
npm run build
```

Oczekiwany wynik:

- polecenie kończy się kodem `0`, a Next.js raportuje `Compiled successfully`;
- powstają `.next/standalone/` i `.next/static/`;
- build nie podejmuje połączenia z PostgreSQL.

Do kompletnego katalogu uruchomieniowego standalone należy dołączyć zasoby:

```powershell
Copy-Item -Recurse -Force .next/static .next/standalone/.next/static
Copy-Item -Recurse -Force public .next/standalone/public
```

Uruchomienie kontrolne:

```powershell
$env:PORT="3000"
$env:HOSTNAME="127.0.0.1"
node .next/standalone/server.js
```

### 3.4. Kompilacja obrazu Docker

```powershell
docker compose build --no-cache app mail-worker migrate
docker compose up -d
docker compose ps
```

Oczekiwany wynik: obraz powstaje na Node.js 22 Alpine, migrator kończy pracę kodem `0`, kontenery `db` i `app` są zdrowe, `/api/health` zwraca HTTP `200`, a worker pocztowy działa jako osobna usługa.

### 3.5. Testy E2E

Testy wymagają osobnej bazy PostgreSQL, której nazwa kończy się `_test`:

```powershell
$env:TEST_DATABASE_URL="postgresql://postgres:haslo@127.0.0.1:55432/bk_test"
npm run db:deploy
npm run test:e2e
```

Nie wolno kierować testów E2E do bazy developerskiej ani produkcyjnej, ponieważ zestaw testowy usuwa dane w bazie testowej.

## 4. Artefakty i elementy wydania

| Element | Ścieżka względem katalogu roboczego |
| --- | --- |
| Serwer standalone | `.next/standalone/` |
| Zasoby statyczne Next.js | `.next/static/` |
| Zasoby publiczne | `public/` |
| Migracje bazy danych | `prisma/migrations/` |
| Schemat bazy danych | `prisma/schema.prisma` |
| Lockfile zależności | `package-lock.json` |
| Obraz kontenerowy | wynik `docker compose build` |

Katalogi `.next`, `node_modules`, raporty testów, lokalne pliki `.env`, kopie zapasowe i dane załączników są artefaktami lokalnymi i nie podlegają ewidencjonowaniu w repozytorium źródłowym.

## 5. Potwierdzenie poprawności

Wydanie jest poprawnie zbudowane, gdy `npm ci`, `npm run check` i `npm run build` kończą się kodem `0`, aplikacja uruchamia się z katalogu standalone albo obrazu Docker, `/api/health` działa po podłączeniu bazy, a na izolowanej bazie przechodzą testy E2E. Numer wersji w `README.md`, `package.json`, tym dokumencie i `src/lib/product-info.ts` musi być zgodny.
