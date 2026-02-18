import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DineEasy — Digital Menus for Swiss Cafés",
    template: "%s | DineEasy",
  },
  description:
    "Create beautiful, multilingual digital menus for your restaurant. QR code sharing, instant updates, premium design. Made in Switzerland.",
  keywords: [
    "digital menu",
    "restaurant menu",
    "QR code menu",
    "Swiss café",
    "menu maker",
    "DineEasy",
  ],
  openGraph: {
    title: "DineEasy — Digital Menus Made Effortless",
    description:
      "Premium digital menus for Swiss cafés. Multi-language, beautiful themes, instant publishing.",
    type: "website",
    locale: "en_CH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${mono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
