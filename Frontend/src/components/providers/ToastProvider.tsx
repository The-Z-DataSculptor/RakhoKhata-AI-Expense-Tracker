// src/components/providers/ToastProvider.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { Toaster } from "sonner";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface ToastProviderProps {
  children: React.ReactNode;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LAYOUT ===
   ========================================================================== */
export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {/* Render the core pages and layout trees of your application */}
      {children}

      {/* 
        WHY THIS FIX WAS MADE: 
        1. Added 'visibleToasts={5}' to cap max active toast elements in DOM, preventing main-thread freezes from notification loops.
        2. Added 'theme="system"' so Sonner dynamically synchronizes with client dark/light theme shifts.
        3. Added 'duration={4000}' and 'expand={false}' for predictable layout behavior on smaller displays.
      */}
      <Toaster 
        position="bottom-right" 
        richColors 
        closeButton
        visibleToasts={5}
        duration={4000}
        expand={false}
        theme="system"
        toastOptions={{
          style: {
            fontFamily: "var(--font-mulish, sans-serif)",
            backgroundColor: "var(--bg-surface, #ffffff)",
            color: "var(--text-primary, #10043f)",
            border: "1px solid var(--border-color, #e5e1f4)",
            borderRadius: "var(--radius-md, 8px)",
            boxShadow: "0 10px 30px rgba(16, 4, 63, 0.05)",
          },
        }}
      />
    </>
  );
}
/* === SECTION 3 END === */