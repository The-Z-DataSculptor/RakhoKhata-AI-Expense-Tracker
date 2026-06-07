// src/app/(marketing)/layout.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
// We adjusted the paths relative to the new (marketing) folder position
import Navbar from "../../components/layout/Navbar"; 
import Footer from "../../components/layout/Footer"; 
/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: MARKETING WIDE WRAPPER LAYOUT ===
   ========================================================================== */
export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Automatically drops the Navbar onto the homepage and any future public page */}
      <Navbar />
      
      {children}
      
      {/* Automatically drops the Footer onto the bottom of all public pages */}
      <Footer />
    </>
  );
}
/* === SECTION 2 END === */