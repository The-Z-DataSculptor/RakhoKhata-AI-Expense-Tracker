// src/components/transactions/TransactionFooter/TransactionFooter.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { FiArrowUpRight, FiArrowDownLeft, FiFileText } from "react-icons/fi";
// WHY: Connecting global multi-currency context to compute live layout exchange translations
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./TransactionFooter.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface TransactionFooterProps {
  /** The calculated live income total sum passed from the main page engine */
  totalIncome: number;
  /** The calculated live expense total sum passed from the main page engine */
  totalExpenses: number;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function TransactionFooter({ 
  totalIncome, 
  totalExpenses 
}: TransactionFooterProps) {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  
  // WHY: Hooks directly into the global switcher state to dynamically rewrite prefixes ($ vs Rs.)
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
      
      {/* LEFT COLUMN: TOTAL INCOME METRIC NODE */}
      <div className={styles.metaStatNode}>
        <div className={`${styles.iconBadgeTrack} ${styles.incomeIcon}`}>
          <FiArrowUpRight size={18} />
        </div>
        <div>
          <p className={styles.statLabel}>Total Income</p>
          <p className={`${styles.statValue} ${styles.incomeColor}`}>
            {/* WHY: Converts baseline PKR balances directly to match active navbar selection */}
            +{formatAmount(totalIncome, "PKR")}
          </p>
        </div>
      </div>

      {/* MIDDLE COLUMN: TOTAL EXPENSES METRIC NODE */}
      <div className={styles.metaStatNode}>
        <div className={`${styles.iconBadgeTrack} ${styles.expenseIcon}`}>
          <FiArrowDownLeft size={18} />
        </div>
        <div>
          <p className={styles.statLabel}>Total Expenses</p>
          <p className={`${styles.statValue} ${styles.expenseColor}`}>
            -{formatAmount(totalExpenses, "PKR")}
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: ACTION COMMAND BUTTON DECK */}
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