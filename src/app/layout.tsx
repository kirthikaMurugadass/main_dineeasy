import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { I18nProviderWrapper } from "@/components/providers/i18n-provider-wrapper";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DineEasy — Digital Menus for Cafés & Restaurants",
    template: "%s | DineEasy",
  },
  description:
    "Create beautiful, multilingual digital menus for your café or restaurant. QR code sharing, instant updates, premium design. Made in Switzerland.",
  keywords: [
    "digital menu",
    "restaurant menu",
    "QR code menu",
    "café menu",
    "menu maker",
    "DineEasy",
  ],
  openGraph: {
    title: "DineEasy — Digital Menus Made Effortless",
    description:
      "Premium digital menus for cafés and restaurants. Multi-language, beautiful themes, instant publishing.",
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('dineeasy-theme');var m=window.matchMedia('(prefers-color-scheme: dark)');var r=(t==='system'||!t)?m.matches:t==='dark';document.documentElement.classList.add(r?'dark':'light');})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <I18nProviderWrapper>
            {children}
            <Toaster position="top-right" richColors />
          </I18nProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
