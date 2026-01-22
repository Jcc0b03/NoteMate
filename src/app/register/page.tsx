"use client";

import * as React from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const [email, setEmail] = React.useState("");
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [verifying, setVerifying] = React.useState(false);
    const [code, setCode] = React.useState("");
    const [error, setError] = React.useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        if (password !== confirmPassword) {
            setError("Hasła nie są identyczne");
            return;
        }

        try {
            await signUp.create({
                emailAddress: email,
                password,
                firstName,
                lastName,
            });

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setVerifying(true);
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || "Coś poszło nie tak");
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === "complete") {
                await setActive({ session: completeSignUp.createdSessionId });
                router.push("/app");
            } else {
                console.error(JSON.stringify(completeSignUp, null, 2));
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || "Nieprawidłowy kod weryfikacyjny");
        }
    };

    if (verifying) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Zweryfikuj swój email</CardTitle>
                        <CardDescription>
                            Wysłaliśmy kod na adres {email}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVerify} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Kod weryfikacyjny</Label>
                                <Input
                                    id="code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Wpisz kod weryfikacyjny"
                                    required
                                />
                            </div>
                            {error && <p className="text-destructive text-sm">{error}</p>}
                            <Button type="submit" className="w-full">
                                Zweryfikuj email
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
                        <BookOpen className="size-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Utwórz konto</h1>
                    <p className="text-muted-foreground mt-2">
                        Wpisz swoje dane, aby rozpocząć
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Rejestracja</CardTitle>
                        <CardDescription>
                            Utwórz nowe konto, aby zacząć organizować notatki
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="first-name">Imię</Label>
                                    <Input
                                        id="first-name"
                                        placeholder="Jan"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="last-name">Nazwisko</Label>
                                    <Input
                                        id="last-name"
                                        placeholder="Kowalski"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="jan@przyklad.pl"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Hasło</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">Potwierdź hasło</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-destructive text-sm">{error}</p>}
                            <div id="clerk-captcha"></div>
                            <Button type="submit" className="w-full">
                                Utwórz konto
                            </Button>
                        </form>
                        <div className="mt-4 text-center text-sm">
                            Masz już konto?{" "}
                            <Link href="/login" className="underline text-primary">
                                Zaloguj się
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
