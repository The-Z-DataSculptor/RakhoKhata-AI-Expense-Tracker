// src/app/layout.tsx
/* ==========================================================================
   === SECTION 1: IMPORTS & METADATA ===
   ========================================================================== */
import type { Metadata, Viewport } from "next";
import { Mulish } from "next/font/google";
import { CurrencyProvider } from "@/app/(dashboard)/context/CurrencyContext";
import ToastProvider from "@/components/providers/ToastProvider";
import "./globals.css";

// ----- Load Mulish font with variable swap for optimal Core Web Vitals -----
const mulish = Mulish({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-mulish",
  display: "swap",
});

// ----- Dynamic Browser Viewport & Theme Colors -----
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#10043f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ----- Production SEO, Schema & Social OpenGraph Metadata -----
export const metadata: Metadata = {
  metadataBase: new URL("https://rakhokhaata.com"),
  title: {
    default: "Rakho Khaata – Your Friendly AI Money Coach & Expense Tracker",
    template: "%s | Rakho Khaata",
  },
  description:
    "Meet Rakho Khaata — your smart personal money coach and secure expense ledger. Track spending effortlessly, manage budgets, and chat with AI.",
  keywords: [
    "Expense Tracker",
    "Rakho Khaata",
    "Financial Ledger",
    "Multi-Currency Tracker",
    "Category Budget Planner",
    "Investment Vault",
    "Freelancer Expense Manager",
    "Visual Budget App",
  ],
  authors: [{ name: "Rakho Khaata Team", url: "https://rakhokhaata.com" }],
  creator: "Rakho Khaata",
  publisher: "Rakho Khaata",
  // ----- Google Search Console Verification (Fixed) -----
  verification: {
    google: "jooqJjiZkKb5_IUlSR1IxiP1J6tW7hU2-YpKcr6I6vw",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
    title: "Rakho Khaata – Your Friendly AI Money Coach & Expense Tracker",
    description:
      "Meet Rakho Khaata — your smart personal money coach and secure expense ledger. Track spending effortlessly, manage budgets, and chat with AI.",
    url: "https://rakhokhaata.com",
    siteName: "Rakho Khaata",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "Rakho Khaata Financial Ledger Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rakho Khaata – Your Friendly AI Money Coach & Expense Tracker",
    description:
      "Meet Rakho Khaata — your smart personal money coach and secure expense ledger. Track spending effortlessly, manage budgets, and chat with AI.",
    images: ["/og-banner.png"],
  },
};
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: THEME INITIALISATION SCRIPT ===
   ========================================================================== */
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
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: ROOT LAYOUT COMPONENT ===
   ========================================================================== */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={mulish.variable} suppressHydrationWarning>
      <head>
        {/* Placed in <head> to prevent React 19 console warning & eliminate FOUC */}
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializerScript }}
          suppressHydrationWarning
        />
      </head>
      <body>
        <CurrencyProvider>
          <ToastProvider>{children}</ToastProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
/* === SECTION 3 END === */