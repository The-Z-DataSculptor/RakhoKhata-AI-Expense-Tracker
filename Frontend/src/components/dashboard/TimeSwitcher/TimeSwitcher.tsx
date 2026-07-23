// src/components/dashboard/TimeSwitcher/TimeSwitcher.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import styles from "./TimeSwitcher.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export type TimePeriod = "7d" | "14d" | "30d" | "all";

interface TimeSwitcherProps {
  activePeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: MAIN COMPONENT ===
   ========================================================================== */
export default React.memo(function TimeSwitcher({ activePeriod, onPeriodChange }: TimeSwitcherProps) {
  const timeOptions: { key: TimePeriod; label: string }[] = [
    { key: "7d", label: "This Week" },
    { key: "14d", label: "Half Month" },
    { key: "30d", label: "This Month" },
    { key: "all", label: "All Time" },
  ];

  return (
    <div className={styles.switcherWrapper}>
      <span className={styles.contextLabel}>Budget View:</span>
      <div className={styles.pillTray} role="group" aria-label="Budget planning periods">
        {timeOptions.map((option) => {
          const isActive = activePeriod === option.key;
          return (
            <button
              key={option.key}
              type="button"
              className={`${styles.pillButton} ${isActive ? styles.pillActive : ""}`}
              onClick={() => onPeriodChange(option.key)}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});
/* === SECTION 3 END === */