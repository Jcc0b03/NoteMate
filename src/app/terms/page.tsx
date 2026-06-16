import { LegalPageLayout } from "@/components/LegalPageLayout";

export const metadata = {
    title: "Regulamin | NoteMate",
    description: "Zasady korzystania z aplikacji NoteMate.",
};

export default function TermsPage() {
    return (
        <LegalPageLayout title="Regulamin" updatedAt="16 czerwca 2026">
            <p>
                Niniejszy Regulamin określa zasady korzystania z aplikacji <strong>NoteMate</strong> („Aplikacja"). Korzystając
                z Aplikacji, akceptujesz poniższe warunki. NoteMate to projekt edukacyjny (studencki), a regulamin ma charakter
                przykładowy.
            </p>

            <h2>1. Definicje</h2>
            <ul>
                <li><strong>Użytkownik</strong> – osoba korzystająca z Aplikacji po założeniu konta.</li>
                <li><strong>Notatka</strong> – materiały (zdjęcia, pliki PDF) przesłane przez Użytkownika wraz z treścią wygenerowaną przez AI.</li>
                <li><strong>Asystent AI</strong> – funkcja oparta na modelu Google Gemini, służąca do OCR, podsumowań i rozmów o notatce.</li>
            </ul>

            <h2>2. Konto</h2>
            <p>
                Do korzystania z większości funkcji wymagane jest konto. Odpowiadasz za poufność swoich danych logowania oraz za
                działania podejmowane na Twoim koncie. Konto jest osobiste i nie może być udostępniane osobom trzecim.
            </p>

            <h2>3. Dozwolone korzystanie</h2>
            <p>Korzystając z Aplikacji, zobowiązujesz się, że nie będziesz przesyłać ani udostępniać treści, które:</p>
            <ul>
                <li>są niezgodne z prawem, obraźliwe lub naruszają prawa osób trzecich;</li>
                <li>naruszają cudze prawa autorskie lub własność intelektualną;</li>
                <li>zawierają dane wrażliwe osób trzecich bez ich zgody;</li>
                <li>zawierają złośliwe oprogramowanie lub mają na celu zakłócenie działania Aplikacji.</li>
            </ul>

            <h2>4. Twoje treści</h2>
            <p>
                Zachowujesz prawa do przesłanych przez siebie notatek i materiałów. Udzielasz nam jedynie ograniczonej licencji
                niezbędnej do przechowywania, wyświetlania i przetwarzania treści w celu świadczenia funkcji Aplikacji (np.
                generowania podsumowań). Gdy świadomie udostępniasz notatkę za pomocą linku, staje się ona dostępna dla osób,
                którym ten link przekażesz.
            </p>

            <h2>5. Funkcje AI i ograniczenie odpowiedzialności</h2>
            <p>
                Wyniki działania Asystenta AI (transkrypcje, podsumowania, odpowiedzi) mogą zawierać błędy lub nieścisłości i nie
                stanowią porady eksperckiej. Zawsze weryfikuj istotne informacje we własnym zakresie. Aplikacja udostępniana jest
                „tak jak jest", bez gwarancji nieprzerwanego i bezbłędnego działania. W maksymalnym zakresie dozwolonym przez
                prawo nie ponosimy odpowiedzialności za szkody wynikające z korzystania z Aplikacji.
            </p>

            <h2>6. Rozwiązanie</h2>
            <p>
                Możesz w każdej chwili usunąć swoje notatki oraz konto. Możemy zawiesić lub usunąć konto naruszające niniejszy
                Regulamin.
            </p>

            <h2>7. Zmiany Regulaminu</h2>
            <p>
                Zastrzegamy sobie prawo do zmiany Regulaminu. O istotnych zmianach poinformujemy w Aplikacji. Dalsze korzystanie
                z Aplikacji po wprowadzeniu zmian oznacza ich akceptację.
            </p>

            <h2>8. Kontakt</h2>
            <p>
                Pytania dotyczące Regulaminu możesz kierować na adres{" "}
                <a href="mailto:pomoc@notemate.app">pomoc@notemate.app</a>.
            </p>
        </LegalPageLayout>
    );
}
