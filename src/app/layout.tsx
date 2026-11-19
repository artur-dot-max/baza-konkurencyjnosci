import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { a11yBootstrapScript } from "@/components/accessibility-toolbar";
import { ActivityTracker } from "@/components/activity-tracker";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Baza Konkurencyjności Funduszu Sprawiedliwości",
    template: "%s | Baza Konkurencyjności FS",
  },
  description:
    "Baza Konkurencyjności Funduszu Sprawiedliwości — portal zamówień publicznych. Przeglądaj ogłoszenia, składaj oferty, zarządzaj postępowaniami.",
  keywords: [
    "Fundusz Sprawiedliwości",
    "zamówienia publiczne",
    "baza konkurencyjności",
    "ogłoszenia",
    "postępowania",
  ],
  authors: [{ name: "Fundusz Sprawiedliwości" }],
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Baza Konkurencyjności Funduszu Sprawiedliwości",
    title: "Baza Konkurencyjności Funduszu Sprawiedliwości",
    description:
      "Portal zamówień publicznych Funduszu Sprawiedliwości. Przeglądaj ogłoszenia i składaj oferty.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Script
          id="a11y-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: a11yBootstrapScript }}
        />
        <a href="#main-content" className="skip-link">
          Przejdź do treści głównej
        </a>
        <SessionProvider>
          <ActivityTracker />
          {children}
          <CookieConsentBanner />
        </SessionProvider>
      </body>
    </html>
  );
}
