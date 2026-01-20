import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Poppins, Noto_Color_Emoji } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoColorEmoji = Noto_Color_Emoji({
  variable: "--font-noto-color-emoji",
  subsets: ["emoji"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "NoteMate",
  description: "Your modern note-taking dashboard",
  metadataBase: new URL("https://notemate.pl"), // Replace with your actual domain or Vercel URL
  openGraph: {
    title: "NoteMate",
    description: "Your modern note-taking dashboard",
    siteName: "NoteMate",
    locale: "pl_PL",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${poppins.variable} ${notoColorEmoji.variable} font-sans antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
