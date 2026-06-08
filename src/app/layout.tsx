/* ==========================================================================
   === FILEPATH: src/app/layout.tsx ===
   ========================================================================== */

import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import Script from "next/script"; // WHY: Next.js native optimization engine to handle script components smoothly without React hydration warnings.
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
  title: "RahoKhata - Your Premium Expense Ledger",
  description: "Track your personal and business expenses with precision.",
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
        
        {/* WHY: Capitalized Script engine executes immediately before page paint cycles 
            to prevent background-flashing layouts while maintaining clean browser DOM records. */}
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: themeInitializerScript,
          }}
        />
        
        {children}
      </body>
    </html>
  );
}
/* === SECTION 3 END === */