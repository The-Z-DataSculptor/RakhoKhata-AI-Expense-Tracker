// src/app/(auth)/layout.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React from "react";
import styles from "./layout.module.css";

/**
 * Props for the authentication layout.
 * Only expects children to be rendered inside the container.
 */
interface AuthLayoutProps {
  children: React.ReactNode;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: LAYOUT COMPONENT ===
   ========================================================================== */

/**
 * Minimal layout wrapper for all authentication pages (login, signup,
 * reset password, verify email).
 *
 * WHY a dedicated layout is used for auth pages:
 * The marketing pages and the dashboard have entirely different designs.
 * Using a nested layout in the (auth) route group keeps the auth pages
 * isolated.  Any styling or providers required specifically for
 * authentication flows can be added here without affecting the rest of
 * the app.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return <div className={styles.authContainer}>{children}</div>;
}
/* === SECTION 2 END === */