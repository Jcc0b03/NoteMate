# NoteMate

**NoteMate** to aplikacja webowa wspierająca naukę z własnych materiałów. Użytkownik może przesyłać zdjęcia lub pliki z notatkami, a aplikacja automatycznie analizuje je przy użyciu AI, tworzy transkrypcję, podsumowanie, zestawy fiszek oraz pozwala rozmawiać z treścią notatki przez asystenta.

Projekt powstał jako aplikacja zespołowa na studia. Głównym celem systemu jest skrócenie czasu potrzebnego na uporządkowanie materiałów i zamiana surowych notatek w gotowe zasoby do nauki.

## Najważniejsze funkcje

- **Rejestracja i logowanie** przez Clerk, z obsługą własnych widoków logowania i rejestracji.
- **Dashboard użytkownika** z podsumowaniem liczby notatek, statusów przetwarzania AI oraz dostępnych zestawów fiszek.
- **Biblioteka notatek** z osobnym widokiem listy notatek, filtrowaniem, wyszukiwaniem i kartami statusu.
- **Plan nauki** jako oddzielny widok do powtórek, generowania brakujących fiszek i śledzenia materiałów czekających na AI.
- **Tworzenie notatek** z tytułem, przedmiotem, tagami i wieloma plikami.
- **Upload plików** z komputera oraz telefoniczny upload przez kod QR.
- **Przechowywanie plików** w Vercel Blob.
- **Automatyczne przetwarzanie AI w tle** po utworzeniu notatki lub dodaniu nowych plików.
- **OCR i transkrypcja** dla wszystkich plików przypiętych do notatki.
- **Podsumowanie AI** łączące informacje z wielu plików jednej notatki.
- **Widok pojedynczej notatki** z zakładkami: podsumowanie, transkrypcja, fiszki i asystent.
- **Asystent AI** pozwalający zadawać pytania do treści notatki i załączonych plików.
- **Fiszki generowane z notatki** z możliwością tworzenia wielu zapisanych zestawów.
- **Tryb nauki fiszek** z animacją obrotu karty, pomijaniem fiszek i oznaczaniem znanych odpowiedzi.
- **Kod QR do zestawu fiszek** otwierany w modalu, dzięki czemu zestaw można szybko uruchomić na telefonie.
- **Udostępnianie notatek** przez publiczny token, z opcją trybu tylko do odczytu albo edycji publicznej.
- **Klonowanie udostępnionych notatek** do własnej biblioteki.
- **Podstawowe strony informacyjne**: pomoc, prywatność i regulamin.

## Stack technologiczny

| Obszar | Technologia |
| --- | --- |
| Framework | Next.js 16, App Router |
| Język | TypeScript |
| UI | React 19, Tailwind CSS, Radix UI, shadcn/ui, lucide-react |
| Autoryzacja | Clerk |
| Baza danych | PostgreSQL |
| ORM | Prisma 7 |
| Storage plików | Prywatny Vercel Blob Store |
| AI | Google Gemini przez Vercel AI SDK oraz `@google/generative-ai` |
| QR | `react-qr-code` |
| Deployment | Vercel |

## Architektura aplikacji

```txt
src/
  actions/
    note.ts              # server actions dla notatek, plików i przetwarzania AI
    share-actions.ts     # server actions dla udostępniania notatek
  app/
    page.tsx             # landing page
    login/               # logowanie
    register/            # rejestracja
    app/                 # chroniona część aplikacji
      page.tsx           # dashboard
      notes/             # biblioteka notatek
      new/               # tworzenie notatki
      plan/              # plan nauki
      settings/          # ustawienia użytkownika
    notes/[id]/          # widok pojedynczej notatki
    share/[token]/       # publiczny widok udostępnionej notatki
    flashcards/[token]/  # publiczny tryb nauki fiszek
    mobile-upload/       # upload plików z telefonu
    api/                 # route handlers API
  components/
    NoteView.tsx              # główny widok notatki
    NoteFlashcardsPanel.tsx   # zarządzanie zestawami fiszek przy notatce
    FlashcardStudyView.tsx    # tryb nauki fiszek
    MobileHandoffButton.tsx   # generowanie QR do uploadu z telefonu
    DashboardNotes.tsx        # lista i filtrowanie notatek
    Topbar.tsx                # górna nawigacja aplikacji
  lib/
    prisma.ts            # klient Prisma z adapterem PostgreSQL
    note-ai.ts           # analiza notatek przez Gemini
    upload-validation.ts # walidacja przesyłanych plików
prisma/
  schema.prisma          # model danych
  migrations/            # migracje bazy danych
public/
  brand/                 # materiały brandowe aplikacji
```

### Warstwy systemu

**Frontend**

Aplikacja korzysta z App Routera w Next.js. Widoki serwerowe pobierają dane bezpośrednio z bazy przez Prisma, a interaktywne części, takie jak upload, czat, fiszki, modale i filtry, są komponentami klienckimi.

**Backend**

Logika backendowa jest rozdzielona między Server Actions i Route Handlers:

- Server Actions obsługują operacje na notatkach, plikach, tagach, przedmiotach i udostępnianiu.
- Route Handlers obsługują upload, pobieranie plików, przetwarzanie AI, czat, fiszki i mobile handoff.

**AI**

Analiza notatek znajduje się w `src/lib/note-ai.ts`. Funkcja pobiera wszystkie pliki przypięte do notatki, wysyła je do modelu Gemini i zapisuje w bazie:

- pełną transkrypcję,
- podsumowanie,
- status przetwarzania.

Czat z notatką działa osobnym endpointem i wykorzystuje historię wiadomości oraz załączone pliki. Generowanie fiszek działa na podstawie treści notatki i zapisuje wynik jako osobny zestaw.

**Dane i pliki**

Metadane aplikacji są przechowywane w PostgreSQL, a pliki użytkowników w Vercel Blob. W bazie znajdują się tylko informacje o plikach, ich adresy URL oraz dane wygenerowane przez AI.

## Główne przepływy użytkownika

### 1. Utworzenie notatki

1. Użytkownik przechodzi do `/app/new`.
2. Podaje tytuł, przedmiot, tagi i dodaje pliki.
3. Pliki trafiają do Vercel Blob.
4. W bazie powstaje rekord `Note` oraz powiązane rekordy `NoteFile`.
5. Notatka otrzymuje status `PROCESSING`.
6. Aplikacja uruchamia przetwarzanie AI w tle.
7. Po zakończeniu AI zapisuje `content`, `summary` i ustawia status `COMPLETED`.

### 2. Dodanie plików z telefonu

1. Użytkownik generuje kod QR w aplikacji.
2. Telefon otwiera widok `/mobile-upload`.
3. Pliki są wysyłane do Vercel Blob w ramach tymczasowej sesji.
4. Aplikacja desktopowa odpytuje endpoint handoff i wykrywa nowe pliki.
5. Pliki można dołączyć do notatki lub wykorzystać przy tworzeniu nowej.

### 3. Nauka z fiszek

1. Użytkownik otwiera notatkę i przechodzi do zakładki fiszek.
2. Może wygenerować nowy zestaw fiszek z treści notatki.
3. Każdy zestaw jest zapisywany w bazie jako `FlashcardDeck`.
4. Użytkownik może otworzyć zestaw w aplikacji albo pokazać kod QR.
5. Publiczny widok `/flashcards/[token]` uruchamia tryb nauki na dowolnym urządzeniu.

### 4. Udostępnianie notatki

1. Właściciel notatki włącza udostępnianie.
2. Aplikacja generuje publiczny `shareToken`.
3. Link `/share/[token]` pozwala innym użytkownikom otworzyć notatkę.
4. Właściciel może zezwolić na publiczną edycję.
5. Odbiorca może sklonować udostępnioną notatkę do własnej biblioteki.

## Model danych

Najważniejsze modele Prisma:

| Model | Rola |
| --- | --- |
| `Note` | Główny rekord notatki: właściciel, tytuł, tagi, status, transkrypcja, podsumowanie i ustawienia udostępniania. |
| `Subject` | Przedmiot/kategoria przypisana do notatek użytkownika. |
| `NoteFile` | Metadane plików dodanych do notatki. |
| `Message` | Historia rozmowy z asystentem AI dla konkretnej notatki. |
| `FlashcardDeck` | Zapisany zestaw fiszek wygenerowany z notatki. |

Statusy notatki:

- `PROCESSING` - notatka czeka na AI lub jest aktualnie analizowana.
- `COMPLETED` - AI zakończyło transkrypcję i podsumowanie.
- `FAILED` - przetwarzanie nie powiodło się.

Role wiadomości czatu:

- `user`
- `assistant`
- `system`

## Najważniejsze endpointy

| Endpoint | Metoda | Opis |
| --- | --- | --- |
| `/api/upload` | `DELETE` | Usuwanie własnego, niewykorzystanego uploadu. |
| `/api/upload-private` | `POST` | Prywatny upload i rejestracja właściciela pliku. |
| `/api/file` | `GET` | Bezpieczne pobieranie pliku przypisanego do notatki. |
| `/api/ai/process` | `POST` | Ręczne uruchomienie przetwarzania notatki przez AI. |
| `/api/ai/chat` | `GET`, `POST` | Pobieranie historii i streaming odpowiedzi asystenta AI. |
| `/api/ai/flashcards` | `GET`, `POST` | Pobieranie zapisanych zestawów i generowanie nowych fiszek. |
| `/api/handoff/session` | `POST` | Utworzenie sesji QR ważnej 15 minut przez zalogowanego właściciela. |
| `/api/handoff/upload` | `POST` | Prywatny upload z telefonu z ważnym tokenem sesji QR. |
| `/api/handoff/poll` | `GET` | Sprawdzanie, czy telefon wysłał pliki. |
| `/api/handoff/complete` | `POST` | Oznaczenie sesji uploadu z telefonu jako zakończonej. |

## Zmienne środowiskowe

Utwórz lokalnie plik `.env.local`. Tego pliku nie należy commitować.

```env
DATABASE_URL="postgresql://..."

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/register"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/app"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/app"

BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

GEMINI_API_KEY="..."
GOOGLE_GENERATIVE_AI_API_KEY="..."
```

`GEMINI_API_KEY` i `GOOGLE_GENERATIVE_AI_API_KEY` mogą mieć tę samą wartość. Pierwsza zmienna jest używana przez `GoogleAIFileManager`, a druga przez Vercel AI SDK dla providerów Google.

Opcjonalnie lokalnie można ustawić:

```env
DISABLE_AUTH="true"
```

Nie należy ustawiać `DISABLE_AUTH=true` na produkcji, ponieważ wyłącza ochronę tras aplikacji.

## Uruchomienie lokalne

Wymagania:

- Node.js zgodny z wersją wspieraną przez Next.js 16,
- npm,
- baza PostgreSQL,
- konto Clerk,
- token Vercel Blob,
- klucz Google AI Studio / Gemini.

Instalacja:

```bash
npm install
```

Wygenerowanie klienta Prisma:

```bash
npx prisma generate
```

Uruchomienie migracji lokalnie:

```bash
npx prisma migrate dev
```

Uruchomienie aplikacji:

```bash
npm run dev
```

Aplikacja lokalnie działa pod adresem:

```txt
http://localhost:3000
```

## Skrypty npm

| Komenda | Opis |
| --- | --- |
| `npm run dev` | Uruchamia serwer developerski Next.js. |
| `npm run build` | Generuje klienta Prisma i buduje aplikację produkcyjną. |
| `npm run start` | Uruchamia zbudowaną aplikację. |
| `npm run lint` | Uruchamia ESLint. |
| `npm test` | Uruchamia testy jednostkowe i regresyjne. |
| `npm run test:integration` | Uruchamia testy z PostgreSQL wskazanym przez `TEST_DATABASE_URL`. |
| `npm run migrate:public-files` | Pokazuje plan migracji starych publicznych plików; zapis wymaga `-- --apply`. |
| `npm run cleanup:files` | Pokazuje kolejkę usuwania osieroconych blobów; ponowienie wymaga `-- --apply`. |

## Deployment na Vercel

1. Utwórz projekt w Vercel i podepnij repozytorium.
2. Dodaj bazę PostgreSQL albo zewnętrzny connection string.
3. Dodaj **prywatny** Vercel Blob Store i skopiuj `BLOB_READ_WRITE_TOKEN`.
4. Dodaj wszystkie zmienne środowiskowe z sekcji `.env`.
5. Upewnij się, że `DATABASE_URL` wskazuje na bazę produkcyjną.
6. Uruchom migracje produkcyjne:

```bash
npx prisma migrate deploy
```

7. Wdróż aplikację przez Vercel.

Domyślny build projektu:

```bash
npm run build
```

## Bezpieczeństwo

Nowe pliki i klony są prywatne. Wcześniej opublikowane obiekty wymagają osobnej migracji do prywatnego magazynu i usunięcia publicznych źródeł. Zasady własności, cache AI, sesje QR, kolejkę sprzątania i procedurę migracji opisuje [dokumentacja cyklu życia plików](docs/security-file-lifecycle.md).

Workflow `.github/workflows/checks.yml` uruchamia lint, kontrolę typów, testy jednostkowe oraz integracyjne z osobnym PostgreSQL. Usługi Clerk, Blob i Google są w testach symulowane; testy nie wymagają produkcyjnych poświadczeń.

- Plik `.env.local` jest ignorowany przez Git i nie powinien trafić do publicznego repozytorium.
- Sekrety należy przechowywać w panelu Vercel jako Environment Variables.
- Jeśli sekrety były kiedykolwiek zapisane w historii Git, należy je obrócić przed upublicznieniem repozytorium.
- Dostęp do prywatnych tras `/app/*` jest chroniony przez middleware Clerk.
- Dostęp do notatek i plików jest dodatkowo sprawdzany po stronie serwera na podstawie właściciela, tokenu udostępnienia lub listy `sharedWith`.

## Status projektu

Projekt zawiera kompletny przepływ od utworzenia notatki do nauki z fiszek:

1. przesłanie materiałów,
2. zapis plików,
3. analiza AI,
4. transkrypcja i podsumowanie,
5. rozmowa z notatką,
6. generowanie fiszek,
7. nauka na komputerze lub telefonie,
8. udostępnianie notatek innym użytkownikom.

Najważniejsze kierunki dalszego rozwoju:

- dokładniejszy harmonogram powtórek spaced repetition,
- edycja wygenerowanych fiszek,
- lepsza obsługa błędów AI i kolejkowania zadań,
- eksport notatek i fiszek,
- testy automatyczne dla najważniejszych przepływów.
