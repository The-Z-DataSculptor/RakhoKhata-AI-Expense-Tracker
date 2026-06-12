"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiCheckCircle, FiRefreshCw, FiExternalLink } from "react-icons/fi";
import styles from "./DashboardFooter.module.css";

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function DashboardFooter() {
  // Generates a simple presentational timestamp
  const currentYear = new Date().getFullYear();

  return (
    /* ==========================================================================
       === SECTION 4: RENDER (JSX) ===
       ========================================================================== */
    <footer className={styles.footerContainer}>
      
      {/* LEFT SIDE: GENERIC SYSTEM STATUS METRIC */}
      <div className={styles.statusSide}>
        <div className={styles.statusNode}>
          <FiCheckCircle size={14} className={styles.successIcon} />
          <span className={styles.statusText}>All Core Data Engine Systems Operational</span>
        </div>
        <p className={styles.syncMetaData}>
          <FiRefreshCw size={11} className={styles.spinIcon} />
          <span>Local workspace cache synced smoothly just now</span>
        </p>
      </div>

      {/* RIGHT SIDE: CLEAN TEXT NAVIGATION DECK */}
      <div className={styles.linksSide}>
        <a href="#export" className={styles.footerLink}>
          <span>Export Ledger</span>
          <FiExternalLink size={12} />
        </a>
        <span className={styles.dividerDot}>•</span>
        <a href="#settings" className={styles.footerLink}>
          <span>Workspace Configurations</span>
        </a>
        <span className={styles.dividerDot}>•</span>
        <span className={styles.copyrightText}>© {currentYear} Hub Engine</span>
      </div>

    </footer>
  );
}