import { LegalPageLayout } from "@/components/LegalPageLayout";

export const metadata = {
    title: "Polityka Prywatności | NoteMate",
    description: "Jak NoteMate zbiera, wykorzystuje i chroni Twoje dane osobowe.",
};

export default function PrivacyPage() {
    return (
        <LegalPageLayout title="Polityka Prywatności" updatedAt="16 czerwca 2026">
            <p>
                Niniejsza Polityka Prywatności opisuje, w jaki sposób aplikacja <strong>NoteMate</strong> („Aplikacja", „my")
                zbiera, wykorzystuje i chroni dane osobowe użytkowników. NoteMate to projekt edukacyjny (studencki), a poniższy
                dokument ma charakter przykładowy.
            </p>

            <h2>1. Administrator danych</h2>
            <p>
                Administratorem danych przetwarzanych w Aplikacji jest zespół projektu NoteMate. W sprawach dotyczących danych
                osobowych możesz skontaktować się z nami pod adresem{" "}
                <a href="mailto:pomoc@notemate.app">pomoc@notemate.app</a>.
            </p>

            <h2>2. Jakie dane zbieramy</h2>
            <ul>
                <li>
                    <strong>Dane konta</strong> – adres e-mail oraz imię/nazwisko podawane podczas rejestracji. Logowanie i
                    zarządzanie kontem obsługuje dostawca uwierzytelniania <strong>Clerk</strong>.
                </li>
                <li>
                    <strong>Przesłane pliki</strong> – zdjęcia oraz pliki PDF notatek, które przesyłasz do Aplikacji. Pliki są
                    przechowywane w usłudze <strong>Vercel Blob</strong>.
                </li>
                <li>
                    <strong>Treść generowana przez AI</strong> – transkrypcje (OCR) oraz podsumowania tworzone na podstawie
                    przesłanych plików, a także treść rozmów z asystentem AI.
                </li>
                <li>
                    <strong>Niezbędne pliki cookie</strong> – wykorzystywane do utrzymania sesji i bezpieczeństwa logowania.
                </li>
            </ul>

            <h2>3. W jakim celu przetwarzamy dane</h2>
            <ul>
                <li>świadczenie podstawowych funkcji Aplikacji (przechowywanie i wyświetlanie notatek);</li>
                <li>rozpoznawanie pisma (OCR) oraz generowanie podsumowań i odpowiedzi asystenta AI;</li>
                <li>uwierzytelnianie użytkownika i zapewnienie bezpieczeństwa konta;</li>
                <li>udostępnianie notatek innym osobom, gdy świadomie korzystasz z tej funkcji.</li>
            </ul>

            <h2>4. Komu przekazujemy dane</h2>
            <p>
                Korzystamy z zaufanych dostawców usług, którzy przetwarzają dane wyłącznie w naszym imieniu i w zakresie
                niezbędnym do działania Aplikacji:
            </p>
            <ul>
                <li><strong>Clerk</strong> – uwierzytelnianie i zarządzanie kontami;</li>
                <li><strong>Vercel</strong> – hosting Aplikacji oraz przechowywanie przesłanych plików (Vercel Blob);</li>
                <li>
                    <strong>Google (Gemini API)</strong> – przetwarzanie zawartości plików w celu OCR i generowania podsumowań
                    oraz odpowiedzi asystenta.
                </li>
            </ul>
            <p>Nie sprzedajemy danych osobowych podmiotom trzecim.</p>

            <h2>5. Okres przechowywania</h2>
            <p>
                Twoje notatki i pliki przechowujemy do czasu ich usunięcia przez Ciebie lub usunięcia konta. Usunięcie notatki
                powoduje także usunięcie powiązanych z nią plików.
            </p>

            <h2>6. Twoje prawa</h2>
            <p>
                Masz prawo do dostępu do swoich danych, ich sprostowania oraz usunięcia. W każdej chwili możesz usunąć
                poszczególne notatki lub całe konto. Aby zrealizować pozostałe żądania, napisz na{" "}
                <a href="mailto:pomoc@notemate.app">pomoc@notemate.app</a>.
            </p>

            <h2>7. Zmiany Polityki</h2>
            <p>
                Możemy aktualizować niniejszą Politykę Prywatności. O istotnych zmianach poinformujemy w Aplikacji, a datę
                ostatniej aktualizacji znajdziesz na górze tej strony.
            </p>
        </LegalPageLayout>
    );
}
