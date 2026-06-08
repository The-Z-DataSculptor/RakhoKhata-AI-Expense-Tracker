/* ==========================================================================
   === FILEPATH: src/components/dashboard/TimeSwitcher/TimeSwitcher.tsx ===
   ========================================================================== */

"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DEPENDENCIES ===
   ========================================================================== */
import React from "react";
import styles from "./TimeSwitcher.module.css";
/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: TYPESCRIPT INTERFACES ===
   ========================================================================== */
// Added the "all" key to represent everything recorded up to now
export type TimePeriod = "7d" | "14d" | "30d" | "all";

interface TimeSwitcherProps {
  activePeriod: TimePeriod;
  // Callback function to notify the parent container when a user clicks a tab
  onPeriodChange: (period: TimePeriod) => void;
}
/* === SECTION 2 END === */


/* ==========================================================================
   === SECTION 3: MAIN COMPONENT RENDER ===
   ========================================================================== */
export default React.memo(function TimeSwitcher({ activePeriod, onPeriodChange }: TimeSwitcherProps) {
  
  // WHY: Keeping our buttons in an array makes it easy to add or remove options.
  // We use clean, reader-friendly text labels for the interface.
  const timeOptions: { key: TimePeriod; label: string }[] = [
    { key: "7d", label: "1 Week" },
    { key: "14d", label: "2 Weeks" },
    { key: "30d", label: "30 Days" },
    { key: "all", label: "All Time" }, // The new option for total records
  ];

  return (
    <div className={styles.switcherWrapper}>
      <span className={styles.contextLabel}>Timeframe:</span>
      
      {/* THE PILL TRAY BAR CONTAINER */}
      <div className={styles.pillTray} role="group" aria-label="Filter expenses by time">
        {timeOptions.map((option) => {
          // Check if this button matches the active state
          const isActive = activePeriod === option.key;
          
          return (
            <button
              key={option.key}
              type="button"
              // WHY: Adds the .pillActive styling class only if the button is currently selected
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