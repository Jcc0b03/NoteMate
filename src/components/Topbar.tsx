"use client";

import Link from "next/link";
import { Bell, Plus, BookOpen, Settings, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton, useUser } from "@clerk/nextjs";

export function Topbar() {
    const { user } = useUser();

    return (
        <header className="h-20 border-b border-border bg-white dark:bg-card sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white p-2 rounded-xl">
                    <BookOpen className="size-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-lg leading-tight text-blue-950 dark:text-blue-100">Notemate</span>
                    <span className="text-[10px] text-blue-500 font-medium tracking-wide">Twój partner w nauce</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
                <Link href="/app" className="text-sm font-semibold text-foreground">
                    Dashboard
                </Link>
                <Link href="/app/notes" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Moje Notatki
                </Link>
                <Link href="/app/plan" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Plan Nauki
                </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-8">
                <button className="text-muted-foreground hover:text-foreground transition-colors relative">
                    <Bell className="size-5" />
                    <span className="absolute -top-0.5 -right-0.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-card" />
                </button>

                <Link href="/app/new">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-5 h-10 shadow-lg shadow-blue-500/20 font-medium">
                        <Plus className="size-4 mr-2" />
                        Dodaj Notatkę
                    </Button>
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="size-9 bg-orange-100 border border-orange-200 cursor-pointer hover:opacity-80 transition-opacity">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback className="text-orange-700 font-bold">AL</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                            <User className="mr-2 size-4" />
                            <span>Profil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                            <Settings className="mr-2 size-4" />
                            <span>Ustawienia</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <SignOutButton>
                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                <LogOut className="mr-2 size-4" />
                                <span>Wyloguj się</span>
                            </DropdownMenuItem>
                        </SignOutButton>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
