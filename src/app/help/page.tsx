import { LegalPageLayout } from "@/components/LegalPageLayout";

export const metadata = {
    title: "Pomoc | NoteMate",
    description: "Centrum pomocy NoteMate — najczęściej zadawane pytania.",
};

export default function HelpPage() {
    return (
        <LegalPageLayout title="Centrum pomocy">
            <p>
                Poniżej znajdziesz odpowiedzi na najczęściej zadawane pytania dotyczące korzystania z aplikacji{" "}
                <strong>NoteMate</strong>. Jeśli nie znajdziesz tu odpowiedzi, napisz do nas — chętnie pomożemy.
            </p>

            <h2>Jak dodać notatkę?</h2>
            <p>
                Kliknij przycisk <strong>„Dodaj Notatkę"</strong> w prawym górnym rogu, a następnie przeciągnij i upuść pliki lub
                kliknij obszar, aby wybrać je z dysku. Możesz nadać notatce tytuł, przypisać przedmiot oraz tagi, a na końcu
                kliknąć <strong>„Przetwórz i Zapisz"</strong>.
            </p>

            <h2>Jak działa rozpoznawanie pisma (OCR) i podsumowania AI?</h2>
            <p>
                Po dodaniu notatki Asystent AI (oparty na modelu Google Gemini) automatycznie odczytuje treść z Twoich zdjęć i
                plików PDF, tworzy ich transkrypcję oraz zwięzłe podsumowanie najważniejszych zagadnień. Status notatki zmieni się
                z <em>„Przetwarzanie"</em> na <em>„Gotowe"</em>, gdy analiza się zakończy.
            </p>

            <h2>Jakie formaty plików są obsługiwane?</h2>
            <p>
                Możesz przesyłać pliki w formatach <strong>JPG, PNG, GIF oraz PDF</strong>. Maksymalny rozmiar pojedynczego pliku
                to <strong>10 MB</strong>.
            </p>

            <h2>Jak przesłać zdjęcia z telefonu? (Mobile Handoff)</h2>
            <p>
                Podczas dodawania notatki na komputerze kliknij <strong>„Prześlij z telefonu"</strong>. Wyświetli się kod QR —
                zeskanuj go telefonem, zrób lub wybierz zdjęcia, a następnie wyślij je. Pojawią się one automatycznie na ekranie
                komputera. Nie zamykaj okna z kodem QR, dopóki wszystkie pliki nie zostaną przesłane.
            </p>

            <h2>Jak udostępnić notatkę?</h2>
            <p>
                Otwórz notatkę i kliknij przycisk <strong>„Udostępnij"</strong>. Możesz wygenerować link do udostępnienia oraz
                zdecydować, czy odbiorcy mogą tylko przeglądać notatkę, czy także ją edytować. Udostępnianie możesz w każdej chwili
                wyłączyć.
            </p>

            <h2>Jak rozmawiać z notatką (Asystent AI)?</h2>
            <p>
                W widoku notatki przejdź do zakładki <strong>„Asystent AI"</strong>. Możesz zadawać pytania dotyczące materiału,
                prosić o wyjaśnienia lub o przygotowanie pytań powtórkowych — asystent korzysta z treści dołączonych plików.
            </p>

            <h2>Jak usunąć notatkę lub konto?</h2>
            <p>
                Aby usunąć notatkę, otwórz menu (ikona trzech kropek) na karcie notatki lub w jej widoku i wybierz{" "}
                <strong>„Usuń"</strong>. Aby usunąć konto, przejdź do <strong>Ustawień</strong> i skorzystaj z opcji zarządzania
                kontem.
            </p>

            <h2>Potrzebujesz dalszej pomocy?</h2>
            <p>
                Napisz do nas na adres <a href="mailto:pomoc@notemate.app">pomoc@notemate.app</a> — odpowiemy najszybciej, jak to
                możliwe.
            </p>
        </LegalPageLayout>
    );
}
