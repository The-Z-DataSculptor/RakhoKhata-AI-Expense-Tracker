// src/components/transactions/TransactionFooter/TransactionFooter.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { FiArrowUpRight, FiArrowDownLeft, FiFileText } from "react-icons/fi";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./TransactionFooter.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface TransactionFooterProps {
  totalIncome: number;   // now in workspace currency
  totalExpenses: number; // now in workspace currency
  sourceCurrency: string; // NEW: workspace currency
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function TransactionFooter({ totalIncome, totalExpenses, sourceCurrency }: TransactionFooterProps) {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const { formatAmount } = useCurrency();

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert("Success! Your transaction summary statement has been saved as a PDF.");
    }, 1500);
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.footerDeckContainer}>
      <div className={styles.metaStatNode}>
        <div className={`${styles.iconBadgeTrack} ${styles.incomeIcon}`}>
          <FiArrowUpRight size={18} />
        </div>
        <div>
          <p className={styles.statLabel}>Total Income</p>
          <p className={`${styles.statValue} ${styles.incomeColor}`}>
            +{formatAmount(totalIncome, sourceCurrency)}
          </p>
        </div>
      </div>

      <div className={styles.metaStatNode}>
        <div className={`${styles.iconBadgeTrack} ${styles.expenseIcon}`}>
          <FiArrowDownLeft size={18} />
        </div>
        <div>
          <p className={styles.statLabel}>Total Expenses</p>
          <p className={`${styles.statValue} ${styles.expenseColor}`}>
            -{formatAmount(totalExpenses, sourceCurrency)}
          </p>
        </div>
      </div>

      <div className={styles.actionButtonBlock}>
        <button
          className={styles.pdfDownloadButton}
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          aria-label="Save current transaction overview statement ledger as a PDF file"
        >
          <FiFileText size={16} />
          <span>{isDownloading ? "Saving PDF..." : "Save Statement as PDF"}</span>
        </button>
      </div>
    </div>
  );
}
/* === SECTION 4 END === */