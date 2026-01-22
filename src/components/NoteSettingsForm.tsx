"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface NoteSettingsFormProps {
    title: string;
    setTitle: (title: string) => void;
    subjectValue: string;
    setSubjectValue: (value: string) => void;
    tags: string[];
    setTags: (tags: string[]) => void;
}

const defaultSubjects = [
    {
        value: "math",
        label: "Matematyka",
    },
    {
        value: "physics",
        label: "Fizyka",
    },
    {
        value: "history",
        label: "Historia",
    },
    {
        value: "biology",
        label: "Biologia",
    },
];

export function NoteSettingsForm({
    title,
    setTitle,
    subjectValue,
    setSubjectValue,
    tags,
    setTags
}: NoteSettingsFormProps) {
    const [open, setOpen] = useState(false);
    const [subjects, setSubjects] = useState(defaultSubjects);
    const [inputValue, setInputValue] = useState("");
    const [tagInput, setTagInput] = useState("");

    const handleCreateSubject = () => {
        if (!inputValue) return;
        const newSubject = { value: inputValue.toLowerCase(), label: inputValue };
        setSubjects([...subjects, newSubject]);
        setSubjectValue(newSubject.value);
        setOpen(false);
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold">Tytuł notatki</Label>
                <Input
                    id="title"
                    placeholder="np. Wykład z algebry"
                    className="bg-muted/50"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label className="font-semibold">Przedmiot</Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between bg-muted/50 font-normal hover:bg-muted/70"
                        >
                            {subjectValue
                                ? subjects.find((subject) => subject.value === subjectValue)?.label || subjectValue
                                : "Wybierz przedmiot..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder="Szukaj przedmiotu..."
                                onValueChange={setInputValue}
                            />
                            <CommandList>
                                <CommandEmpty className="py-2 px-2">
                                    <p className="text-sm text-muted-foreground mb-2 px-2">Nie znaleziono przedmiotu.</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start gap-2"
                                        onClick={handleCreateSubject}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Dodaj "{inputValue}"
                                    </Button>
                                </CommandEmpty>
                                <CommandGroup>
                                    {subjects.map((subject) => (
                                        <CommandItem
                                            key={subject.value}
                                            value={subject.value}
                                            onSelect={(currentValue) => {
                                                setSubjectValue(currentValue === subjectValue ? "" : currentValue);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    subjectValue === subject.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {subject.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <Label className="font-semibold">Tagi</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                        <div
                            key={tag}
                            className={cn(
                                "text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1",
                                index % 2 === 0
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            )}
                        >
                            # {tag}
                            <button
                                onClick={() => removeTag(tag)}
                                className={cn(
                                    "hover:opacity-75 transition-opacity",
                                    index % 2 === 0 ? "hover:text-blue-900" : "hover:text-green-900"
                                )}
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    ))}
                </div>
                <Input
                    placeholder="Dodaj tag i naciśnij Enter..."
                    className="bg-muted/50"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                />
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-4 flex gap-3">
                <Sparkles className="size-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400">Wskazówka AI</h4>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
                        Notemate automatycznie wykryje daty i definicje z Twoich notatek, aby utworzyć fiszki do nauki.
                    </p>
                </div>
            </div>
        </div>
    );
}
