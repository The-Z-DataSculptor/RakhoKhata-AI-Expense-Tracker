// src/components/transactions/TransactionHeader/TransactionHeader.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiPlus } from "react-icons/fi";
import styles from "./TransactionHeader.module.css";

/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface TransactionHeaderProps {
  // Callback function executed when the user clicks the "Add Transaction" button
  onAddTransactionClick: () => void;
  // Dynamic count of total entries to show a quick text label summary
  totalCount: number;
}

/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function TransactionHeader({ onAddTransactionClick, totalCount }: TransactionHeaderProps) {
  
  // Safe default formatting to handle any missing values without throwing a layout error
  const safeCount = totalCount !== undefined && totalCount !== null ? totalCount : 0;
  const entryLabelText = safeCount === 1 ? "1 entry tracked" : `${safeCount.toLocaleString()} entries tracked`;

  return (
    /* ==========================================================================
       === SECTION 4: RENDER (JSX) ===
       ========================================================================== */
    <header className={styles.glassFloatingDeck}>
      
      {/* LEFT ASPECT: IDENTITY AND PULSING STATUS HUB */}
      <div className={styles.brandingBlock}>
        <h1 className={styles.ledgerMainTitle}>Transactions</h1>
        
        <div className={styles.statusBadgePill}>
          {/* Glowing indicator animation dot */}
          <span className={styles.emeraldGlowDot} aria-hidden="true" />
          <span className={styles.statusBadgeText}>Ledger Engine Synced</span>
        </div>
      </div>

      {/* RIGHT ASPECT: METADATA AND CTA BUTTON ROW */}
      <div className={styles.interactiveBlock}>
        <span className={styles.counterMetaSummary}>
          {entryLabelText}
        </span>
        
        <button
          type="button"
          className={styles.premiumActionPill}
          onClick={onAddTransactionClick}
          aria-label="Create a new transaction asset record"
        >
          <FiPlus size={16} className={styles.buttonPlusVector} />
          <span>Add Transaction</span>
        </button>
      </div>

    </header>
    /* === SECTION 4 END === */
  );
}