"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Plus, Settings, LogOut, User } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";

const navLinks = [
    { href: "/app", label: "Dashboard" },
    { href: "/app/notes", label: "Moje Notatki" },
    { href: "/app/plan", label: "Plan Nauki" },
];

export function Topbar() {
    const { user } = useUser();
    const pathname = usePathname();

    const initials = (
        `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` ||
        user?.primaryEmailAddress?.emailAddress?.[0] ||
        "U"
    ).toUpperCase();

    return (
        <header className="h-20 border-b border-border bg-white dark:bg-card sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
            {/* Logo -> Dashboard */}
            <Link href="/app" className="flex items-center">
                <BrandLogo className="h-12 w-auto" priority />
            </Link>

            {/* Navigation */}
            <nav className="hidden h-full items-center gap-8 md:flex">
                {navLinks.map((link) => {
                    const isActive = link.href === "/app" ? pathname === "/app" : pathname.startsWith(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "relative flex h-full items-center border-b-2 px-1 text-sm transition-colors",
                                isActive
                                    ? "border-sky-600 font-semibold text-sky-700"
                                    : "border-transparent font-medium text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {link.label}
                        </Link>
                    );
                })}
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
                            <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? "Użytkownik"} />
                            <AvatarFallback className="text-orange-700 font-bold">{initials}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.fullName ?? "Użytkownik"}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/app/settings">
                                <User className="mr-2 size-4" />
                                <span>Profil</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/app/settings">
                                <Settings className="mr-2 size-4" />
                                <span>Ustawienia</span>
                            </Link>
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
