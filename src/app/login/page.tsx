"use client";

import * as React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function LoginPage() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");
    const [verifying, setVerifying] = React.useState(false);
    const [code, setCode] = React.useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") || "/app";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        try {
            const signInAttempt = await signIn.create({
                identifier: email,
                password,
            });

            if (signInAttempt.status === "complete") {
                await setActive({ session: signInAttempt.createdSessionId });
                router.push(redirectUrl);
            } else if (signInAttempt.status === "needs_first_factor" || signInAttempt.status === "needs_second_factor") {
                // Check if email_code is a supported strategy
                const emailCodeFactor = signInAttempt.supportedFirstFactors?.find(
                    (factor) => factor.strategy === "email_code"
                ) || signInAttempt.supportedSecondFactors?.find(
                    (factor) => factor.strategy === "email_code"
                );

                if (emailCodeFactor) {
                    const { emailAddressId } = emailCodeFactor as any;
                    await signIn.prepareFirstFactor({
                        strategy: "email_code",
                        emailAddressId,
                    });
                    setVerifying(true);
                } else {
                    console.error("Email code strategy not supported for this user", signInAttempt);
                    setError("Weryfikacja email nie jest dostępna dla tego konta.");
                }
            } else {
                console.error(JSON.stringify(signInAttempt, null, 2));
                setError("Nieznany status logowania");
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || "Coś poszło nie tak");
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        try {
            const completeSignIn = await signIn.attemptFirstFactor({
                strategy: "email_code",
                code,
            });

            if (completeSignIn.status === "complete") {
                await setActive({ session: completeSignIn.createdSessionId });
                router.push(redirectUrl);
            } else {
                console.error(JSON.stringify(completeSignIn, null, 2));
                setError("Nie udało się zweryfikować kodu.");
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
                    <h1 className="text-3xl font-bold tracking-tight">Witaj ponownie</h1>
                    <p className="text-muted-foreground mt-2">
                        Zaloguj się do swojego konta
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Logowanie</CardTitle>
                        <CardDescription>
                            Wpisz swój email poniżej, aby się zalogować
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Hasło</Label>
                                    <Link href="#" className="ml-auto inline-block text-sm underline">
                                        Nie pamiętasz hasła?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-destructive text-sm">{error}</p>}
                            <Button type="submit" className="w-full">
                                Zaloguj się
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Lub kontynuuj przez
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => signIn?.authenticateWithRedirect({
                                    strategy: "oauth_google",
                                    redirectUrl: "/sso-callback",
                                    redirectUrlComplete: redirectUrl
                                })}
                            >
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Google
                            </Button>
                        </form>
                        <div className="mt-4 text-center text-sm">
                            Nie masz konta?{" "}
                            <Link href="/register" className="underline text-primary">
                                Zarejestruj się
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
