// src/components/budgets/BudgetHeader/BudgetHeader.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import TimeSwitcher, { type TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import styles from "./BudgetHeader.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface BudgetHeaderProps {
  activeRange: TimePeriod;
  onRangeChange: (range: TimePeriod) => void;
  onCreateBudgetClick: () => void;
  totalBudgets?: number;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT RENDER ===
   ========================================================================== */
export function BudgetHeader({ 
  activeRange, 
  onRangeChange, 
  onCreateBudgetClick,
  totalBudgets = 0 
}: BudgetHeaderProps) {
  return (
    <div className={styles.headerContainer}>
      {/* LEFT SIDE: HEADINGS */}
      <div className={styles.textGroup}>
        <h1 className={styles.pageTitle}>Budgets</h1>
        <p className={styles.pageSubtitle}>
          Set spending limits and track your monthly targets.
          {totalBudgets > 0 && ` (${totalBudgets} active)`}
        </p>
      </div>

      {/* RIGHT SIDE: INTERACTIVE CONTROLS */}
      <div className={styles.controlsGroup}>
        <TimeSwitcher activePeriod={activeRange} onPeriodChange={onRangeChange} />

        <button type="button" className={styles.createBudgetBtn} onClick={onCreateBudgetClick}>
          Create New Budget
        </button>
      </div>
    </div>
  );
}