# NoteMate 📘

> **Twój partner w nauce**

**NoteMate** to inteligentny asystent naukowy, który pozwala studentom i uczniom digitalizować odręczne notatki. Aplikacja wykorzystuje AI do odczytywania pisma ręcznego (OCR), tworzenia podsumowań oraz umożliwia interaktywną "rozmowę" z treścią notatki.

---

## ✨ Funkcjonalności (MVP)

1.  **Dashboard**: Widok siatki z zapisanymi notatkami (miniaturka, tytuł, data).
2.  **Upload & Vision**:
    *   Przesyłanie zdjęć notatek.
    *   Automatyczna analiza przez OpenAI GPT-4o (OCR + podsumowanie).
3.  **Inteligentny Czat**:
    *   Widok Split-Screen (Notatka vs Czat).
    *   Możliwość "odpytywania" z materiału.
    *   Edytowalna transkrypcja.

---

## 🛠️ Tech Stack

Zestaw dobrany pod szybki development (Speedrun Edition) i darmowy hosting.

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Język**: TypeScript
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
*   **Auth**: [Clerk](https://clerk.com/)
*   **Baza danych**: [Vercel Postgres](https://vercel.com/storage/postgres) (z Prisma ORM)
*   **Storage**: [Vercel Blob](https://vercel.com/storage/blob) (zdjęcia notatek)
*   **AI**: OpenAI GPT-4o + [Vercel AI SDK](https://sdk.vercel.ai/)

---

## 🎨 Design System

Styl inspirowany aplikacjami takimi jak Duolingo – przyjazny, czysty i nowoczesny.
[Zobacz inspirację projektu](https://stitch.withgoogle.com/projects/4976148389212435323)

### Paleta Kolorów
| Rola | Kolor | Hex | Zastosowanie |
| :--- | :--- | :--- | :--- |
| **Primary** | Niebieski | `#1E90FF` | Przyciski główne, linki, logo |
| **Secondary** | Zielony | `#2ECC71` | Sukces, akcenty edukacyjne |
| **Accent** | Żółty | `#F1C40F` | Gwiazdki, wyróżnienia |
| **Text** | Ciemny szary | `#333333` | Główny tekst |
| **Background** | Biel / Szary | `#FFFFFF` / `#F8F9FA` | Tło aplikacji i kart |

### Typografia
*   **Font**: Poppins (Google Fonts)
*   **Wagi**: Bold (700), Medium (500), Regular (400)
*   **Styl**: Zaokrąglone rogi (Rounded-XL/2XL), miękkie cienie.

---

## 🗄️ Baza Danych (Schema)

Model danych zdefiniowany w `schema.prisma`:

```prisma
model Note {
  id          String   @id @default(cuid())
  userId      String   // ID użytkownika z Clerk
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  imageUrl    String   // URL do pliku w Vercel Blob
  title       String?  @default("Nowa notatka")
  
  // Dane wygenerowane przez AI
  content     String?  @db.Text // Pełna transkrypcja (OCR)
  summary     String?  @db.Text // Krótkie podsumowanie
  
  // Status przetwarzania
  status      String   @default("PROCESSING") // PROCESSING, COMPLETED, FAILED
}
```

---

## 🚀 Uruchomienie Lokalne

1.  **Sklonuj repozytorium:**
    ```bash
    git clone git@github-jcc0b:Jcc0b03/NoteMate.git
    cd notemate
    ```

2.  **Zainstaluj zależności:**
    ```bash
    npm install
    ```

3.  **Skonfiguruj zmienne środowiskowe:**
    Utwórz plik `.env.local` i dodaj klucze dla Clerk, OpenAI, Vercel Postgres oraz Blob:
    ```env
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
    CLERK_SECRET_KEY=...
    OPENAI_API_KEY=...
    POSTGRES_PRISMA_URL=...
    POSTGRES_URL_NON_POOLING=...
    BLOB_READ_WRITE_TOKEN=...
    ```

4.  **Uruchom serwer developerski:**
    ```bash
    npm run dev
    ```
    Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000).

