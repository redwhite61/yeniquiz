import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Online Quiz Platform - Test ve Sınav Sistemi",
  description: "Online quiz platformu ile farklı kategorilerde testler çözün, sonuçlarınızı görün ve liderlik tablosunda yer alın.",
  keywords: ["quiz", "test", "sınav", "online", "eğitim", "öğrenme"],
  authors: [{ name: "Quiz Platform Team" }],
  openGraph: {
    title: "Online Quiz Platform",
    description: "Farklı kategorilerde testler çözün, sonuçlarınızı görün ve liderlik tablosunda yer alın.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Quiz Platform",
    description: "Farklı kategorilerde testler çözün, sonuçlarınızı görün ve liderlik tablosunda yer alın.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
