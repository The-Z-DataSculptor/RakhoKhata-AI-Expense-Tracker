// src/components/dashboard/DashboardFooter/DashboardFooter.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import styles from "./DashboardFooter.module.css";

/* ==========================================================================
   === SECTION 2: COMPONENT LOGIC ===
   ========================================================================== */
export default function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footerContainer}>
      
      <div className={styles.statusSide}>
        <div className={styles.statusNode}>
          <FiCheckCircle size={14} className={styles.successIcon} />
          <span className={styles.statusText}>All systems operational</span>
        </div>
        <p className={styles.syncMetaData}>
          <FiRefreshCw size={11} className={styles.spinIcon} />
          <span>Your data is up to date</span>
        </p>
      </div>

      <div className={styles.linksSide}>
        <span className={styles.copyrightText}>© {currentYear} RakhoKhata</span>
      </div>

    </footer>
  );
}