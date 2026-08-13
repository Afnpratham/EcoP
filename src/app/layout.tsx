import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EcoP — Rewarding Sustainable Behaviour Through AI",
    template: "%s · EcoP",
  },
  description:
    "EcoP is an AI-powered waste-management and sustainability platform. Scan a bin, dispose responsibly, and earn redeemable Eco Points.",
  applicationName: "EcoP",
  keywords: ["recycling", "sustainability", "AI", "rewards", "campus"],
  authors: [{ name: "EcoP" }],
  openGraph: {
    title: "EcoP — Rewarding Sustainable Behaviour Through AI",
    description:
      "Scan a bin, dispose responsibly, and earn redeemable Eco Points powered by computer vision.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#22c55e" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1a13" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, outfit.variable, "font-sans")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
