"use client";

import React, { useState } from "react";
import {
  Share2,
  MoreVertical,
  ZoomIn,
  ZoomOut,
  Copy,
  Send,
  Trash2,
  Download,
  Edit2,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

export default function NotePage() {
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(100);
  const [title, setTitle] = useState("Notatka z Biologii");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
      { role: "ai", content: "Cześć! Jestem Twoim asystentem AI. W czym mogę pomóc w związku z tą notatką?" }
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [noteContent, setNoteContent] = useState(`Biologia komórki - notatki z wykładu 15.10.2023

1. Wstęp
Komórka jest podstawową jednostką strukturalną i funkcjonalną każdego organizmu.

2. Budowa komórki
- Błona komórkowa: oddziela wnętrze komórki od środowiska zewnętrznego.
- Cytoplazma: wypełnia wnętrze, w niej zawieszone są organella.
- Jądro komórkowe: zawiera materiał genetyczny (DNA).

3. Mitochondria
Są to centra energetyczne komórki. Zachodzi w nich oddychanie komórkowe, w wyniku którego powstaje ATP.

4. Podział komórkowy
Mitoza prowadzi do powstania dwóch identycznych komórek potomnych. Mejoza jest podziałem redukcyjnym, w wyniku którego powstają gamety.`);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

  const handleSendMessage = () => {
      if (!chatInput.trim()) return;
      setMessages([...messages, { role: "user", content: chatInput }]);
      const currentInput = chatInput;
      setChatInput("");
      // Simulate AI response
      setTimeout(() => {
          setMessages((prev) => [...prev, { role: "ai", content: `To ciekawe pytanie o "${currentInput}"! Na podstawie notatki...` }]);
      }, 1000);
  };

  const handlePredefinedQuestion = (question: string) => {
      setMessages((prev) => [...prev, { role: "user", content: question }]);
      setTimeout(() => {
          setMessages((prev) => [...prev, { role: "ai", content: `Jasne, już odpowiadam na pytanie: "${question}".` }]);
      }, 1000);
  }

  return (
    <div className="h-screen flex flex-col font-sans bg-background text-foreground">
      {/* Header */}
      <header className="border-b p-4 flex justify-between items-center bg-card">
        <div className="flex flex-col">
           <input
             value={title}
             onChange={(e) => setTitle(e.target.value)}
             className="text-xl md:text-2xl font-bold bg-transparent border-none outline-none focus:ring-0 text-foreground p-0"
           />
           <span className="text-xs md:text-sm text-muted-foreground">Dodano 15 paź 2023</span>
        </div>
        <div className="flex items-center gap-2">
           <Button className="bg-[#1E90FF] hover:bg-blue-600 text-white gap-2 hidden md:flex">
             <Share2 className="w-4 h-4" /> Udostępnij
           </Button>
           <Button className="bg-[#1E90FF] hover:bg-blue-600 text-white md:hidden size-9 p-0">
             <Share2 className="w-4 h-4" />
           </Button>
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="icon">
                 <MoreVertical className="w-5 h-5" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuItem className="text-destructive focus:text-destructive">
                 <Trash2 className="w-4 h-4 mr-2" /> Usuń notatkę
               </DropdownMenuItem>
               <DropdownMenuItem>
                 <Download className="w-4 h-4 mr-2" /> Pobierz tekst
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"}>

          {/* Left Panel - Source of Truth */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="relative w-full h-full bg-gray-100 dark:bg-zinc-900 overflow-hidden flex items-center justify-center p-4">
               <div
                 className="transition-transform duration-200 ease-out origin-center"
                 style={{ transform: `scale(${zoom / 100})` }}
               >
                 {/* Mock Image */}
                 <img
                   src="https://images.unsplash.com/photo-1517842645767-c639042777db?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                   alt="Notatka"
                   className="max-w-full shadow-lg rounded-lg object-contain"
                   style={{ maxHeight: '80vh' }}
                 />
               </div>

               {/* Zoom Controls */}
               <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                 <Button size="icon" variant="secondary" onClick={handleZoomOut}>
                   <ZoomOut className="w-4 h-4" />
                 </Button>
                 <Button size="icon" variant="secondary" onClick={handleZoomIn}>
                   <ZoomIn className="w-4 h-4" />
                 </Button>
               </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - AI Workspace */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full bg-background flex flex-col">
              <Tabs defaultValue="transcript" className="w-full h-full flex flex-col">
                <div className="border-b px-4">
                  <TabsList className="w-full justify-start h-12 bg-transparent p-0 gap-4">
                    <TabsTrigger
                      value="transcript"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#1E90FF] data-[state=active]:shadow-none rounded-none px-0 pb-2 pt-2"
                    >
                      Notatka
                    </TabsTrigger>
                    <TabsTrigger
                      value="chat"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#1E90FF] data-[state=active]:shadow-none rounded-none px-0 pb-2 pt-2"
                    >
                      Czat z AI
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="transcript" className="flex-1 p-0 m-0 overflow-hidden">
                   <ScrollArea className="h-full p-6">
                      <div className="bg-[#F8F9FA] dark:bg-zinc-800 p-4 rounded-xl border border-border mb-6">
                        <h3 className="font-bold text-foreground mb-2">Podsumowanie</h3>
                        <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                          <li>Kluczowe pojęcia z zakresu biologii komórkowej.</li>
                          <li>Opis procesu mitozy i mejozy.</li>
                          <li>Różnice między komórką roślinną a zwierzęcą.</li>
                        </ul>
                      </div>

                      <div className="prose dark:prose-invert max-w-none text-foreground">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold m-0">Pełny Tekst</h3>
                          <div className="flex gap-2">
                              {isEditing ? (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                        <X className="w-4 h-4 mr-2" /> Anuluj
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-[#1E90FF] hover:text-blue-600">
                                        <Save className="w-4 h-4 mr-2" /> Zapisz
                                    </Button>
                                  </>
                              ) : (
                                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                     <Edit2 className="w-4 h-4 mr-2" /> Edytuj
                                  </Button>
                              )}
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Copy className="w-4 h-4" /> Kopiuj
                              </Button>
                          </div>
                        </div>

                        {isEditing ? (
                            <Textarea
                                className="min-h-[300px] font-sans text-sm md:text-base leading-relaxed"
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                            />
                        ) : (
                            <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                              {noteContent}
                            </p>
                        )}
                      </div>
                   </ScrollArea>
                </TabsContent>

                <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0 overflow-hidden">
                   <ScrollArea className="flex-1 p-4">
                      <div className="flex flex-col gap-4">
                        {messages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-xl text-sm md:text-base ${
                                msg.role === "user"
                                  ? "bg-[#1E90FF] text-white rounded-br-none"
                                  : "bg-[#F1F5F9] dark:bg-zinc-800 text-foreground rounded-bl-none"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                   </ScrollArea>

                   <div className="p-4 border-t bg-background">
                      {/* Suggested Questions */}
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                         <Button variant="outline" size="sm" className="rounded-full whitespace-nowrap" onClick={() => handlePredefinedQuestion("Zrób test z tej wiedzy")}>
                           Zrób test z tej wiedzy
                         </Button>
                         <Button variant="outline" size="sm" className="rounded-full whitespace-nowrap" onClick={() => handlePredefinedQuestion("Wyjaśnij trudne pojęcia")}>
                           Wyjaśnij trudne pojęcia
                         </Button>
                         <Button variant="outline" size="sm" className="rounded-full whitespace-nowrap" onClick={() => handlePredefinedQuestion("Streść w 3 zdaniach")}>
                           Streść w 3 zdaniach
                         </Button>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Zadaj pytanie do notatki..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button onClick={handleSendMessage} className="bg-[#1E90FF] hover:bg-blue-600">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                   </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
