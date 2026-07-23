// src/components/budgets/BudgetHeader/BudgetHeader.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiPlus } from "react-icons/fi";
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
  // WHY THIS FIX WAS MADE: Sanitizes totalBudgets to guarantee a valid non-negative integer,
  // preventing negative counts or NaN values from being displayed in the header badge.
  const safeTotalBudgets = Math.max(0, Math.floor(Number(totalBudgets) || 0));

  return (
    <div className={styles.headerContainer}>
      
      {/* LEFT SIDE: HEADINGS & STATUS BADGE */}
      <div className={styles.textGroup}>
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>Budgets</h1>
          {safeTotalBudgets > 0 && (
            <span className={styles.activeCountBadge}>
              {safeTotalBudgets} Active
            </span>
          )}
        </div>
        <p className={styles.pageSubtitle}>
          Set spending limits and track your monthly targets.
        </p>
      </div>

      {/* RIGHT SIDE: INTERACTIVE CONTROLS */}
      <div className={styles.controlsGroup}>
        <div className={styles.timeSwitcherWrapper}>
          <TimeSwitcher activePeriod={activeRange} onPeriodChange={onRangeChange} />
        </div>

        <button 
          type="button" 
          className={styles.createBudgetBtn} 
          onClick={onCreateBudgetClick}
          aria-label="Create a new budget category limit"
        >
          <FiPlus size={16} className={styles.plusIcon} />
          <span>Create New Budget</span>
        </button>
      </div>

    </div>
  );
}
/* === SECTION 3 END === */