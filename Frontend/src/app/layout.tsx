// src/app/layout.tsx
import type { Metadata } from "next";
import { Mulish } from "next/font/google";
// Removed: Script import – replaced with a regular <script> tag for React 19 compatibility
import { CurrencyProvider } from "@/app/(dashboard)/context/CurrencyContext";
import ToastProvider from "@/components/providers/ToastProvider";
import "./globals.css";

/* ==========================================================================
   === SECTION 1: FONTS & METADATA CONFIGURATION ===
   ========================================================================== */
const mulish = Mulish({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-mulish",
});

export const metadata: Metadata = {
  title: "RakhoKhata - Your Premium Expense Ledger",
  description: "Track your personal and business expenses with precision.",
  
  openGraph: {
    title: "RakhoKhata - Your Premium Expense Ledger",
    description: "Track personal and business expenses with isolated workspace precision.",
    url: "https://rakhokhata.com",
    siteName: "RakhoKhata",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "RakhoKhata Application Premium Dashboard Interface Preview Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "RakhoKhata - Your Premium Expense Ledger",
    description: "Track personal and business expenses with isolated workspace precision.",
    images: ["/og-banner.png"],
  },
};
/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: THEME INLINE INITIALIZER SCRIPT ===
   ========================================================================== */
const themeInitializerScript = `
(function () {
  try {
    const savedTheme = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && systemDark)) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (error) {
    console.error("Theme initialization failed:", error);
  }
})();
`;
/* === SECTION 2 END === */


/* ==========================================================================
   === SECTION 3: ROOT STRUCTURAL LAYOUT ===
   ========================================================================== */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={mulish.variable} suppressHydrationWarning>
      <body>
        
        {/* 
          FIXED: Replaced Next.js <Script> with a standard <script> tag 
          to avoid React 19.3 warnings about script tags inside components.
          The script runs before hydration, setting the theme correctly.
        */}
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializerScript }}
          suppressHydrationWarning
        />
        
        {/* Wrapping children inside both state contexts so currency and notifications run everywhere */}
        <CurrencyProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
/* === SECTION 3 END === */