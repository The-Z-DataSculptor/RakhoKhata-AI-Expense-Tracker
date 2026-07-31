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

// ----- Production SEO & Social OpenGraph Metadata -----
export const metadata: Metadata = {
  metadataBase: new URL("https://rakhokhaata.com"),
  title: {
    default: "RakhoKhaata – Smart Expense & Investment Ledger",
    template: "%s | RakhoKhaata",
  },
  description:
    "Track personal & business expenses, manage investments, set smart budgets, and leverage AI financial insights with secure isolated workspaces.",
  keywords: [
    "Expense Tracker",
    "RakhoKhaata",
    "Financial Ledger",
    "Budget Manager",
    "Investment Vault",
    "Multi-Currency Tracker",
    "AI Financial Coach",
  ],
  authors: [{ name: "RakhoKhaata Engine" }],
  creator: "RakhoKhaata",
  publisher: "RakhoKhaata",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "RakhoKhaata – Smart Expense & Investment Ledger",
    description:
      "Precision personal & business expense tracking, automated budget alerts, investment vault protection, and AI financial analysis.",
    url: "https://rakhokhaata.com",
    siteName: "RakhoKhaata",
    images: [
      {
        url: "/og-banner.png", // Ensure your file in public/ is renamed to og-banner.png
        width: 1200,
        height: 630,
        alt: "RakhoKhaata Premium Financial Dashboard & Expense Tracker Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RakhoKhaata – Smart Expense & Investment Ledger",
    description:
      "Precision personal & business expense tracking, automated budget alerts, and AI financial analysis.",
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