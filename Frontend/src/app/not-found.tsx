import React from "react";
import Link from "next/link";
import { FiAlertTriangle, FiHome, FiCompass } from "react-icons/fi";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.notFoundSection}>
      <div className={styles.glowBackground} aria-hidden="true" />

      <div className={styles.container}>
        {/* ERROR BADGE */}
        <div className={styles.badgeWrapper}>
          <span className={styles.badgePill}>
            <FiAlertTriangle size={14} aria-hidden="true" />
            <span>404 Error</span>
          </span>
        </div>

        {/* HEADINGS */}
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.description}>
          Oops! The page or financial ledger you are looking for has been moved, 
          deleted, or never existed in the first place.
        </p>

        {/* ACTION BUTTONS */}
        <div className={styles.ctaGroup}>
          <Link href="/" className={styles.primaryCta}>
            <FiHome size={16} aria-hidden="true" />
            <span>Back to Homepage</span>
          </Link>
          <Link href="/features/ai-financial-companion" className={styles.secondaryCta}>
            <FiCompass size={16} aria-hidden="true" />
            <span>Explore AI Features</span>
          </Link>
        </div>
      </div>
    </main>
  );
}