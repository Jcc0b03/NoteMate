"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";
import {
    BookOpen,
    FileText,
    Star,
    Clock,
    Settings,
    MoreHorizontal,
    LogOut,
} from "lucide-react";
import { NavItem } from "@/components/NavItem";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
    const { user, isLoaded } = useUser();

    return (
        <Sidebar>
            <SidebarHeader className="border-b border-border/40 p-6">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <BookOpen className="size-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">NoteMate</span>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-4 py-6">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <NavItem href="/app" icon={<FileText className="size-4" />} active>
                            All Notes
                        </NavItem>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <NavItem href="#" icon={<Star className="size-4" />}>
                            Favorites
                        </NavItem>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <NavItem href="#" icon={<Clock className="size-4" />}>
                            Recent
                        </NavItem>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <NavItem href="#" icon={<BookOpen className="size-4" />}>
                            Notebooks
                        </NavItem>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t border-border/40 p-4">
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                            {!isLoaded ? (
                                <div className="size-full bg-muted animate-pulse" />
                            ) : user?.imageUrl ? (
                                <img src={user.imageUrl} alt={user.fullName || "User"} className="size-full object-cover" />
                            ) : (
                                <span className="text-xs font-semibold">
                                    {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "U"}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col text-left min-w-0 max-w-[120px]">
                            {!isLoaded ? (
                                <>
                                    <div className="h-4 w-20 bg-muted animate-pulse rounded mb-1" />
                                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                </>
                            ) : (
                                <>
                                    <span className="text-sm font-medium truncate" title={user?.fullName || user?.firstName || "User"}>
                                        {user?.fullName || user?.firstName || "User"}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate" title={user?.primaryEmailAddress?.emailAddress || "Pro Plan"}>
                                        {user?.primaryEmailAddress?.emailAddress || "Pro Plan"}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" suppressHydrationWarning>
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem asChild>
                                <Link href="/app/settings" className="cursor-pointer flex w-full items-center">
                                    <Settings className="mr-2 size-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="text-red-600 focus:text-red-600 cursor-pointer">
                                <SignOutButton>
                                    <div className="flex items-center w-full">
                                        <LogOut className="mr-2 size-4" />
                                        <span>Log out</span>
                                    </div>
                                </SignOutButton>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
