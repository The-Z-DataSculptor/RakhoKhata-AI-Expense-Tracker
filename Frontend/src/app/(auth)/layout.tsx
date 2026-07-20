// src/app/(auth)/layout.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React from "react";
import styles from "./layout.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/**
 * Props for the authentication layout.
 * Only expects children to be rendered inside the container.
 */
interface AuthLayoutProps {
  children: React.ReactNode;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * Minimal layout wrapper for all authentication pages (login, signup,
 * reset password, verify email). It applies the shared CSS container styles
 * but does not add any extra markup that would interfere with the
 * individually designed forms.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return <div className={styles.authContainer}>{children}</div>;
}
/* === SECTION 3 END === */