import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  MessageSquare,
  Camera,
  Folder,
  Star,
  PlayCircle,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@clerk/nextjs/server";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <BookOpen className="size-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Notemate</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-blue-600 transition-colors">Funkcje</Link>
            <Link href="#pricing" className="hover:text-blue-600 transition-colors">Cennik</Link>
            <Link href="#about" className="hover:text-blue-600 transition-colors">O nas</Link>
          </div>

          <div className="flex items-center gap-4">
            {userId ? (
              <Link href="/app" className="text-sm font-semibold text-slate-700 hover:text-blue-600 hidden sm:block">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 hidden sm:block">
                Zaloguj się
              </Link>
            )}

            <Link href={userId ? "/app" : "/register"}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-lg shadow-blue-500/25">
                {userId ? "Wróć do aplikacji" : "Zacznij za darmo"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-32 lg:pb-28">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-8 border border-blue-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Nowość: AI Chat 2.0
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
                Twoje notatki,<br />
                <span className="text-blue-600">teraz mądrzejsze.</span>
              </h1>

              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                Twój partner w nauce. Skanuj, organizuj i rozmawiaj ze swoimi odręcznymi zapiskami dzięki sztucznej inteligencji.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href={userId ? "/app" : "/register"}>
                  <Button className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base shadow-xl shadow-blue-600/20 w-full sm:w-auto">
                    Zacznij za darmo
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <Button variant="outline" className="h-12 px-8 rounded-full border-slate-200 hover:bg-slate-50 text-slate-700 text-base gap-2 w-full sm:w-auto">
                  <PlayCircle className="size-5" />
                  Zobacz demo
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <Avatar key={i} className="size-10 border-2 border-white">
                      <AvatarImage src={`https://i.pravatar.cc/100?img=${i + 10}`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <p>
                  Dołączyło <span className="font-bold text-slate-900">10,000+ uczniów</span>
                </p>
              </div>
            </div>

            {/* Hero Image / Mockup */}
            <div className="relative lg:h-[600px] w-full flex items-center justify-center">
              <div className="relative w-full aspect-square max-w-[600px]">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50 -z-10" />

                {/* Main Card Mockup */}
                <div className="absolute inset-x-4 inset-y-12 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                    <div className="flex gap-2">
                      <div className="size-3 rounded-full bg-red-400" />
                      <div className="size-3 rounded-full bg-yellow-400" />
                      <div className="size-3 rounded-full bg-green-400" />
                    </div>
                    <div className="h-2 w-32 bg-slate-200 rounded-full" />
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6 h-full bg-slate-50/30">
                    <div className="space-y-4">
                      <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-slate-100 rounded" />
                        <div className="h-3 w-5/6 bg-slate-100 rounded" />
                        <div className="h-3 w-4/5 bg-slate-100 rounded" />
                      </div>
                      <div className="h-32 w-full bg-blue-50/50 rounded-xl border-2 border-dashed border-blue-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-400">Analiza notatki...</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
                      <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-2xl rounded-tl-none px-3 py-2 text-xs max-w-[80%]">
                          Z czego chcesz zrobić powtórkę?
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-3 py-2 text-xs max-w-[80%]">
                          Zrób quiz z dat.
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-2xl rounded-tl-none px-3 py-2 text-xs max-w-[80%] flex items-center gap-2">
                          <span className="size-1.5 bg-blue-500 rounded-full animate-bounce" />
                          Generuję pytania...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase Section */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Widok, który zmienia naukę
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Twoje notatki po lewej, inteligentny asystent po prawej. Ucz się szybciej bez przełączania okien.
            </p>
          </div>

          <div className="max-w-6xl mx-auto px-6">
            <div className="bg-white rounded-t-3xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Browser Header */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="size-3 rounded-full bg-red-400" />
                  <div className="size-3 rounded-full bg-yellow-400" />
                  <div className="size-3 rounded-full bg-green-400" />
                </div>
                <div className="bg-white px-3 py-1 rounded-md shadow-sm text-xs text-slate-500 flex-1 text-center font-mono">
                  app.notemate.com/dashboard
                </div>
              </div>

              {/* App Interface Mockup */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 h-[400px] lg:h-[500px] overflow-hidden">
                {/* Note View */}
                <div className="lg:col-span-2 bg-slate-50 p-8 flex items-center justify-center border-r border-slate-200">
                  <div className="bg-white p-8 shadow-sm border border-slate-200 w-[80%] h-[90%] rotate-1 transform transition-transform hover:rotate-0 duration-500">
                    <h3 className="font-handwriting text-2xl mb-4 text-slate-800" style={{ fontFamily: 'cursive' }}>Biologia - Fotosynteza</h3>
                    <div className="space-y-3 font-handwriting text-slate-600" style={{ fontFamily: 'cursive' }}>
                      <p>Reakcja świetlna zachodzi w tylakoidach chloroplastów.</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Wymaga światła i wody</li>
                        <li>Powstaje ATP i NADPH</li>
                        <li>Produkt uboczny: Tlen</li>
                      </ul>
                      <div className="border-2 border-green-200 rounded-lg p-4 mt-6">
                        <p className="font-bold text-green-700 text-sm mb-1">WAŻNE!</p>
                        <p>Faza ciemna (Cykl Calvina) - stroma.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat View */}
                <div className="bg-white flex flex-col h-full relative">
                  <div className="flex-1 p-6 space-y-6 overflow-hidden">
                    <div className="flex gap-3">
                      <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <BookOpen className="size-4" />
                      </div>
                      <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700">
                        Cześć! Zauważyłem, że robisz notatki z biologii. Chcesz, żebym zrobił quiz z fotosyntezy?
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-2 text-sm">
                        Tak, poproszę 5 pytań!
                      </div>
                    </div>

                    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-both" style={{ animationDelay: '0.5s' }}>
                      <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <BookOpen className="size-4" />
                      </div>
                      <div className="space-y-2 max-w-[85%]">
                        <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700">
                          Jasne! Pytanie 1: Gdzie dokładnie zachodzi faza jasna fotosyntezy?
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <button className="text-left px-3 py-2 rounded-xl border border-slate-200 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors text-xs font-medium">A) W tylakoidach</button>
                          <button className="text-left px-3 py-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-colors text-xs font-medium">B) W mitochondriach</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-slate-100 bg-white absolute bottom-0 w-full">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Zapytaj o notatkę..."
                        className="w-full bg-slate-50 border-0 rounded-full pl-4 pr-12 h-10 text-sm focus:ring-2 focus:ring-blue-100"
                      />
                      <button className="absolute right-1 top-1 size-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors">
                        <Send className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 max-w-xl">
                Wszystko, czego potrzebujesz do efektywnej nauki
              </h2>
              <p className="text-lg text-slate-600">
                Notemate zmienia Twój tradycyjny zeszyt w interaktywne centrum wiedzy.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Camera,
                  title: "Skanuj zeszyty",
                  desc: "Zrób zdjęcie, a nasza AI natychmiast odczyta Twoje pismo ręczne i przekonwertuje je na tekst cyfrowy.",
                  color: "blue"
                },
                {
                  icon: MessageSquare,
                  title: "Rozmawiaj z notatkami",
                  desc: "Zadawaj pytania do swoich notatek jak do nauczyciela. Generuj quizy i fiszki w kilka sekund.",
                  color: "purple"
                },
                {
                  icon: Folder,
                  title: "Uporządkuj wiedzę",
                  desc: "Automatyczne tagowanie, podsumowania i inteligentne łączenie tematów sprawią, że nigdy nic nie zgubisz.",
                  color: "green"
                }
              ].map((feature, idx) => (
                <div key={idx} className="group p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300">
                  <div className={`size-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 bg-${feature.color}-100 text-${feature.color}-600 ` +
                    (feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      feature.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600')}>
                    <feature.icon className="size-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Uczniowie uwielbiają Notemate</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Kasia",
                  role: "Studentka Medycyny",
                  quote: "Notemate uratował moją sesję! Funkcja skanowania działa idealnie nawet z moim bazgraniem.",
                  avatar: "https://i.pravatar.cc/150?img=5"
                },
                {
                  name: "Marek",
                  role: "Licealista",
                  quote: "Niesamowite, jak dobrze radzi sobie z generowaniem pytań. Uczę się 2x szybciej.",
                  avatar: "https://i.pravatar.cc/150?img=11"
                },
                {
                  name: "Zuzia",
                  role: "Maturzystka",
                  quote: "Bardzo pomocne przy powtórkach do matury. Organizacja materiałów to złoto.",
                  avatar: "https://i.pravatar.cc/150?img=9"
                }
              ].map((person, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="size-12 border border-slate-100">
                      <AvatarImage src={person.avatar} />
                      <AvatarFallback>{person.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-slate-900">{person.name}</h4>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{person.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 text-yellow-400 mb-4">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="size-4 fill-current" />)}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed italic">
                    "{person.quote}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white pt-20 pb-10 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                    <BookOpen className="size-4" />
                  </div>
                  <span className="font-bold text-lg">Notemate</span>
                </div>
                <p className="text-sm text-slate-500 mb-6">
                  Tworzymy przyszłość edukacji, łącząc tradycyjne notatki z nowoczesną technologią AI.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-4 text-sm">Produkt</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li><Link href="#" className="hover:text-blue-600">Funkcje</Link></li>
                  <li><Link href="#" className="hover:text-blue-600">Cennik</Link></li>
                  <li><Link href="#" className="hover:text-blue-600">Dla szkół</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-4 text-sm">Firma</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li><Link href="#" className="hover:text-blue-600">O nas</Link></li>
                  <li><Link href="#" className="hover:text-blue-600">Blog</Link></li>
                  <li><Link href="#" className="hover:text-blue-600">Kontakt</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-4 text-sm">Prawne</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li><Link href="/privacy" className="hover:text-blue-600">Prywatność</Link></li>
                  <li><Link href="/terms" className="hover:text-blue-600">Regulamin</Link></li>
                  <li><Link href="/help" className="hover:text-blue-600">Pomoc</Link></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">© 2024 Notemate. Wszelkie prawa zastrzeżone.</p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                <div className="size-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
                  <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                </div>
                <div className="size-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
                  <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
