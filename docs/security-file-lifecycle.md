# Pliki prywatne, migracja i testy regresyjne

Nowe uploady, w tym pliki z telefonu i kopie notatek, korzystają z **prywatnego Vercel Blob Store**. `BLOB_READ_WRITE_TOKEN` musi wskazywać taki magazyn; token starego publicznego magazynu nie wystarczy. Podgląd i pobieranie przebiegają przez `/api/file`, po sprawdzeniu dostępu do notatki. Odpowiedzi mają `private, no-store` oraz `nosniff`.

Przed uruchomieniem nowej wersji wykonaj `npx prisma generate` i `npx prisma migrate deploy` dla właściwej bazy. Migracja `20261018120000_secure_file_lifecycle` dodaje rejestr uploadów, sesje telefonu i pola cache Google, a także uzupełnia brakujące wcześniej pola udostępniania.

## Własność i usuwanie

- Upload jest rejestrowany z właścicielem i metadanymi ustalonymi przez serwer. Utworzenie notatki lub dodanie pliku atomowo rezerwuje własne, niewykorzystane uploady. Parametry MIME, rozmiar i nazwa przesłane przez klienta nie zastępują danych rejestru.
- `DELETE /api/upload` usuwa tylko własny, niewykorzystany upload. Nie przyjmuje dowolnego URL-a jako wystarczającej podstawy do usunięcia pliku.
- Nowy klon otrzymuje niezależne prywatne obiekty. Przy usuwaniu starych notatek sprawdzane są pozostałe referencje do współdzielonych URL-i. Kandydaci do usunięcia trafiają do trwałej tabeli `BlobDeletion`. Awaria Blob pozostawia zadanie do ponowienia, bez usuwania plików nadal używanych przez inną notatkę. `npm run cleanup:files` pokazuje kolejkę, a `npm run cleanup:files -- --apply` ponawia do 100 zadań. Tę komendę trzeba uruchamiać okresowo, np. z harmonogramu; repozytorium nie zakłada działającego osobnego workera.
- Sesję telefonu tworzy zalogowany właściciel przez `POST /api/handoff/session`. Token QR jest ważny 15 minut i upoważnia telefon do wysłania plików oraz zakończenia sesji. Odczyt listy wymaga logowania jako właściciel. Token QR należy traktować jak krótkotrwałe uprawnienie do uploadu.

## Pliki utworzone wcześniej jako publiczne

Zmiana kodu ani tokenu nie odbiera dostępu do istniejących publicznych obiektów. Przed deklarowaniem ich prywatności trzeba skopiować dane do prywatnego magazynu, zmienić referencje i usunąć stare publiczne obiekty.

Przygotowany skrypt domyślnie tylko odczytuje stan:

```bash
npm run migrate:public-files
```

W zaplanowanym oknie migracji ustaw bezpiecznie `BLOB_READ_WRITE_TOKEN` dla nowego prywatnego magazynu i `LEGACY_BLOB_READ_WRITE_TOKEN` dla starego publicznego magazynu, a następnie uruchom:

```bash
npm run migrate:public-files -- --apply
```

Skrypt kopiuje pliki niezależnie dla każdej notatki, aktualizuje bazę w transakcjach i usuwa publiczne źródło dopiero po sprawdzeniu, że nie ma referencji. Ignorowany przez Git manifest `.local-migrations/pending-public-blobs.json` pozwala ponowić usuwanie po awarii. Nie usuwa plików, których nie ma w rejestrze `NoteFile`; stare publiczne miniatury bez odpowiadającego pliku i osierocone uploady wymagają osobnego przeglądu magazynu. Skryptu `--apply` nie zweryfikowano na usługach zewnętrznych bez ich poświadczeń.

## Cache plików Google

URI, nazwa, MIME i termin ważności są zapisane przy `NoteFile` w PostgreSQL. Cache jest używany do minuty przed wygaśnięciem. Dzierżawa w bazie zapobiega podwójnemu uploadowi z kilku instancji. Przygotowanie plików ma wspólny budżet 35 sekund, pojedyncze żądania mają timeout i pętla sprawdzania ma najwyżej 20 prób. Stany błędu nie są używane jako gotowy plik. SDK otrzymuje `Buffer`; nie powstają pliki tymczasowe na dysku. Nieudane uploady o znanej nazwie są usuwane, a dzierżawa zwalniana.

## Testy

```bash
npm test
npm run lint -- --max-warnings=0
npx tsc --noEmit --incremental false
```

Testy integracyjne wymagają jawnie wskazanej, osobnej bazy PostgreSQL z wdrożonymi migracjami:

```bash
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
npm run test:integration
```

`TEST_DATABASE_URL` nie jest pobierany automatycznie z konfiguracji aplikacji. Testy używają rzeczywistych transakcji PostgreSQL oraz symulowanych usług Clerk, Blob i Google. Sprawdzają między innymi brak zapisu po odmowie dostępu, niezależność klonów, zachowanie starych współdzielonych plików, jednorazowe wykorzystanie uploadu i cache AI przy równoległych żądaniach. Nie potwierdzają konfiguracji ani działania usług zewnętrznych z rzeczywistymi kluczami.
