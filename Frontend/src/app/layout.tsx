// src/app/layout.tsx
/* ==========================================================================
   === SECTION 1: IMPORTS & METADATA ===
   ========================================================================== */
import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import { CurrencyProvider } from "@/app/(dashboard)/context/CurrencyContext";
import ToastProvider from "@/components/providers/ToastProvider";
import "./globals.css";

// ----- Load the Mulish font with a CSS variable so it can be used everywhere -----
const mulish = Mulish({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-mulish",
});

// ----- Basic SEO metadata used by Next.js for <head> tags -----
export const metadata: Metadata = {
  title: "RakhoKhaata – Your Premium Expense Ledger",
  description: "Track your personal and business expenses with precision.",
  openGraph: {
    title: "RakhoKhaata – Your Premium Expense Ledger",
    description:
      "Track personal and business expenses with isolated workspace precision.",
    url: "https://rakhokhaata.com",
    siteName: "RakhoKhaata",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "RakhoKhaata Application Premium Dashboard Interface Preview Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RakhoKhaata – Your Premium Expense Ledger",
    description:
      "Track personal and business expenses with isolated workspace precision.",
    images: ["/og-banner.png"],
  },
};
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: THEME INITIALISATION SCRIPT ===
   ========================================================================== */
/**
 * WHY this script exists:
 * Without it, the page would render with the default (light) colour scheme
 * before React hydrates, causing an ugly flash of light colours for dark‑mode
 * users. This inline script runs **before** the first paint and immediately
 * sets the `data-theme` attribute on `<html>`, so the correct CSS variables
 * are applied from the very first frame.
 */
const themeInitializerScript = `
(function () {
  try {
    var savedTheme = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (error) {
    // localStorage may be disabled – fall back to light theme
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: ROOT LAYOUT COMPONENT ===
   ========================================================================== */
/**
 * WHY providers are placed here:
 * The `CurrencyProvider` and `ToastProvider` must wrap every page so that
 * any component in the app can display amounts in the user's chosen currency
 * and trigger toast notifications. Placing them in the root layout guarantees
 * they are available everywhere.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={mulish.variable} suppressHydrationWarning>
      <body>
        {/* Inline script – must be a regular <script> tag for React 19 compatibility */}
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializerScript }}
          suppressHydrationWarning
        />

        <CurrencyProvider>
          <ToastProvider>{children}</ToastProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
/* === SECTION 3 END === */