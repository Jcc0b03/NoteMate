import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, CheckCircle2, CreditCard, MessageSquare, ScanLine, Sparkles } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-950 selection:bg-sky-100">
      <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center">
            <BrandLogo className="h-12 w-auto" priority />
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <Link href="#product" className="border-b-2 border-transparent py-7 transition-colors hover:border-sky-500 hover:text-sky-700">
              Produkt
            </Link>
            <Link href="#workflow" className="border-b-2 border-transparent py-7 transition-colors hover:border-sky-500 hover:text-sky-700">
              Jak działa
            </Link>
            <Link href="#study" className="border-b-2 border-transparent py-7 transition-colors hover:border-sky-500 hover:text-sky-700">
              Nauka
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href={userId ? "/app" : "/login"} className="hidden text-sm font-semibold text-slate-700 hover:text-sky-700 sm:block">
              {userId ? "Dashboard" : "Logowanie"}
            </Link>
            <Link href={userId ? "/app" : "/register"}>
              <Button className="rounded-lg bg-sky-600 px-5 text-white hover:bg-sky-700">
                {userId ? "Otwórz aplikację" : "Zacznij za darmo"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <section className="relative min-h-[calc(86svh-5rem)] overflow-hidden">
          <Image
            src="/brand/landing-hero.png"
            alt="Notemate zamienia odręczne notatki w cyfrowe podsumowania, fiszki i plan nauki"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-white/45" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.86)_34%,rgba(255,255,255,0.42)_62%,rgba(255,255,255,0.12)_100%)]" />

          <div className="relative mx-auto flex min-h-[calc(86svh-5rem)] max-w-7xl items-center px-5 py-14 md:px-8">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white/85 px-3 py-2 text-xs font-bold uppercase tracking-wide text-sky-700 shadow-sm">
                <Sparkles className="size-4" />
                AI do notatek, fiszek i powtórek
              </div>

              <h1 className="text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">
                Notemate
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700 md:text-xl">
                Twój partner w nauce. Skanuj notatki, dostawaj czytelne podsumowania, generuj fiszki i ucz się z planem dopasowanym do materiałów.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={userId ? "/app" : "/register"}>
                  <Button className="h-12 rounded-lg bg-sky-600 px-7 text-base text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700">
                    {userId ? "Przejdź do notatek" : "Załóż konto"}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <Link href="#product">
                  <Button variant="outline" className="h-12 rounded-lg border-slate-300 bg-white/80 px-7 text-base text-slate-800 hover:bg-white">
                    Zobacz możliwości
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="border-y border-slate-200 bg-slate-50 py-20 md:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold text-sky-700">Jedno miejsce na cały materiał</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Od zdjęcia notatki do gotowego planu nauki
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Notemate porządkuje chaotyczne materiały: analizuje pliki, tworzy podsumowania, pozwala rozmawiać z notatką i zamienia ją w zestawy fiszek dostępne na telefonie przez QR.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  ["OCR i podsumowania", "AI czyta zdjęcia oraz PDF-y i łączy informacje z wielu plików."],
                  ["Fiszki i QR", "Twórz wiele zestawów z jednej notatki i ucz się na telefonie."],
                  ["Plan nauki", "Widzisz, co powtórzyć dzisiaj i które materiały czekają na AI."],
                  ["Chat z notatką", "Pytasz o materiał bez przekopywania się przez całe pliki."],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <CheckCircle2 className="mb-3 size-5 text-emerald-600" />
                    <h3 className="font-semibold text-slate-950">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Image
                src="/brand/landing-product.png"
                alt="Interfejs Notemate z podglądem notatki, podsumowaniem AI i fiszkami"
                width={1600}
                height={900}
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40"
              />
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-emerald-700">Prosty workflow</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Mniej przepisywania, więcej nauki
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { icon: Camera, title: "Dodaj materiały", text: "Wrzuć zdjęcia lub PDF-y. Notemate pilnuje przetwarzania w tle." },
                { icon: MessageSquare, title: "Zrozum treść", text: "Czytaj podsumowanie, transkrypcję i zadawaj pytania asystentowi." },
                { icon: CreditCard, title: "Utrwal wiedzę", text: "Generuj zestawy fiszek, otwieraj je QR-em i dodawaj do planu nauki." },
              ].map((item, index) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                      <item.icon className="size-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-300">0{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="study" className="bg-slate-950 py-20 text-white md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold text-emerald-300">Gotowe do sesji</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
                Nauka z notatek, które już masz
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Aplikacja pomaga przejść od materiałów do działania: widzisz najnowsze notatki, status AI, fiszki i zadania na dziś.
              </p>
              <Link href={userId ? "/app" : "/register"}>
                <Button className="mt-8 h-12 rounded-lg bg-emerald-400 px-7 text-base text-emerald-950 hover:bg-emerald-300">
                  Rozpocznij naukę
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/10 p-5">
                <ScanLine className="mb-4 size-6 text-sky-300" />
                <h3 className="font-semibold">AI działa w tle</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Nie musisz otwierać notatki, żeby przetwarzanie ruszyło.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-5">
                <CreditCard className="mb-4 size-6 text-emerald-300" />
                <h3 className="font-semibold">Wiele zestawów fiszek</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Twórz różne warianty pytań i wracaj do nich później.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-5 sm:col-span-2">
                <MessageSquare className="mb-4 size-6 text-amber-300" />
                <h3 className="font-semibold">Jedno miejsce na powtórki</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Dashboard, biblioteka i plan nauki mają osobne role, więc łatwiej wrócić do pracy.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between md:px-8">
            <BrandLogo className="h-11 w-auto" />
            <div className="flex gap-5 text-sm text-slate-600">
              <Link href="/privacy" className="hover:text-sky-700">Prywatność</Link>
              <Link href="/terms" className="hover:text-sky-700">Regulamin</Link>
              <Link href="/help" className="hover:text-sky-700">Pomoc</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
