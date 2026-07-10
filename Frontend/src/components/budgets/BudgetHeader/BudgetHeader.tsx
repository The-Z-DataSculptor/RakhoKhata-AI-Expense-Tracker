// src/components/budgets/BudgetHeader/BudgetHeader.tsx
"use client";

import React from "react";
import TimeSwitcher, { type TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import styles from "./BudgetHeader.module.css";

interface BudgetHeaderProps {
  activeRange: TimePeriod;
  onRangeChange: (range: TimePeriod) => void;
  onCreateBudgetClick: () => void;
}

export function BudgetHeader({ activeRange, onRangeChange, onCreateBudgetClick }: BudgetHeaderProps) {
  return (
    <div className={styles.headerContainer}>
      {/* LEFT SIDE: HEADINGS */}
      <div className={styles.textGroup}>
        <h1 className={styles.pageTitle}>Budgets</h1>
        <p className={styles.pageSubtitle}>
          Set spending limits and track your monthly targets.
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