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

      {/* Global alert viewport fully locked into your premium design system */}
      <Toaster 
        position="bottom-right" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            // Forces Sonner to use your exact app typography, backgrounds, and borders
            fontFamily: "var(--font-mulish, sans-serif)",
            backgroundColor: "var(--bg-surface, #ffffff)",
            color: "var(--text-primary, #10043f)",
            border: "1px solid var(--border-color, #e5e1f4)",
            borderRadius: "var(--radius-md, 8px)",
            boxShadow: "0 10px 30px rgba(16, 4, 63, 0.05)", /* Matches your dashboard depth card shadow */
          },
        }}
      />
    </>
  );
}
/* === SECTION 4 END === */