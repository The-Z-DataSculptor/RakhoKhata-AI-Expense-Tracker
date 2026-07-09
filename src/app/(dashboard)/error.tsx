// src/app/(dashboard)/error.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useEffect } from "react";
import Link from "next/link"; // FIXED: Added missing Next.js Link import
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import styles from "./error.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function DashboardError({ error, reset }: ErrorBoundaryProps) {
  
  useEffect(() => {
    // Log the error details to see what went wrong behind the scenes
    console.error("Dashboard Boundary Caught An Exception:", error);
  }, [error]);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.errorViewportDeck}>
      
      {/* Centralized white container box matching your dashboard layout specifications */}
      <div className={styles.errorCardBox} role="alert">
        
        <div className={styles.errorIconFrame}>
          <FiAlertTriangle size={24} />
        </div>

        <h2 className={styles.errorHeadline}>Something went wrong</h2>
        
        <p className={styles.errorExplanation}>
          We had trouble loading your workspace data. This usually happens because of a temporary 
          network hiccup or a minor connection timeout with the database.
        </p>

        {/* Action controls deck allowing the user to recover without forcing a browser refresh */}
        <div className={styles.actionControlsFrameDeck}>
          <button 
            type="button" 
            className={styles.primaryRecoveryButton}
            onClick={() => reset()}
          >
            <FiRefreshCw size={14} className={styles.refreshIconDecoration} />
            <span>Try Again</span>
          </button>

          <Link href="/" className={styles.secondaryHomeButton}>
            Go to Homepage
          </Link>
        </div>

      </div>

    </div>
  );
}
/* === SECTION 4 END === */