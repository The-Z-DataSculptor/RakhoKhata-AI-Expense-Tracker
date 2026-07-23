// src/app/(dashboard)/error.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React, { useEffect } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import styles from "./error.module.css";

interface ErrorBoundaryProps {
  error: Error & { digest?: string }; // digest is added by Next.js
  reset: () => void; // function to retry rendering the page
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ERROR BOUNDARY COMPONENT ===
   ========================================================================== */
/**
 * DashboardError
 *
 * WHY this component exists:
 * Next.js error boundaries catch runtime errors in the dashboard route
 * group.  Instead of showing a blank screen, we display a user‑friendly
 * message with a “Try Again” button and a link to the homepage.
 */
export default function DashboardError({
  error,
  reset,
}: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error details for debugging
    console.error("Dashboard Boundary Caught An Exception:", error);
  }, [error]);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: RENDER ===
   ========================================================================== */
  return (
    <div className={styles.errorViewportDeck}>
      <div className={styles.errorCardBox} role="alert">
        <div className={styles.errorIconFrame}>
          <FiAlertTriangle size={24} />
        </div>

        <h2 className={styles.errorHeadline}>Something went wrong</h2>

        <p className={styles.errorExplanation}>
          We had trouble loading your workspace data. This usually happens
          because of a temporary network hiccup or a minor connection timeout
          with the database.
        </p>

        <div className={styles.actionControlsFrameDeck}>
          <button
            type="button"
            className={styles.primaryRecoveryButton}
            onClick={() => reset()}
          >
            <FiRefreshCw
              size={14}
              className={styles.refreshIconDecoration}
            />
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
/* === SECTION 3 END === */