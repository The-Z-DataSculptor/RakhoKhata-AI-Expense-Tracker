// src/app/(marketing)/layout.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MARKETING LAYOUT WRAPPER ===
   ========================================================================== */
/**
 * Layout shared by all public / marketing pages.
 *
 * WHY a separate layout is used:
 * The (marketing) route group ensures that the Navbar and Footer are
 * only rendered on public pages, keeping the dashboard clean.
 */
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
/* === SECTION 2 END === */