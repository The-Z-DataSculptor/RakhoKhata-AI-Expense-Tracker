// src/components/categories/CategoryStats/CategoryStats.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & MODULE CONSTANTS ===
   ========================================================================== */
import React from "react";
import { FiTrendingUp, FiTrendingDown, FiActivity, FiZap } from "react-icons/fi";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./CategoryStats.module.css";

// WHY THIS FIX WAS MADE: Hoisting static geometry constants outside the component scope prevents
// re-calculating ring dimensions and circumferences on every render cycle.
const RING_RADIUS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface CategoryStatData {
  topExpenseName: string;
  topExpenseAmount: number; // in workspace's original currency
  topExpensePercentage: number;
  topIncomeName: string;
  topIncomeAmount: number; // in workspace's original currency
  topIncomePercentage: number;
  fastClimberName: string;
  fastClimberGrowthPercentage: number;
  habitTrackerName: string;
  habitTrackerCount: number;
}

interface CategoryStatsProps {
  statsData: CategoryStatData;
  sourceCurrency: string;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & PURE HELPERS ===
   ========================================================================== */
// WHY THIS FIX WAS MADE: Defensively calculates SVG strokeDashoffset, handling NaN and negative values safely.
const calculateOffset = (percentageValue: number): number => {
  const numericVal = Number(percentageValue);
  if (isNaN(numericVal)) return RING_CIRCUMFERENCE;
  const safePercent = Math.min(Math.max(numericVal, 0), 100);
  return RING_CIRCUMFERENCE - (safePercent / 100) * RING_CIRCUMFERENCE;
};

export default function CategoryStats({ statsData, sourceCurrency }: CategoryStatsProps) {
  const { formatAmount } = useCurrency();

  // Defensive default fallback values
  const data: CategoryStatData = statsData || {
    topExpenseName: "None",
    topExpenseAmount: 0,
    topExpensePercentage: 0,
    topIncomeName: "None",
    topIncomeAmount: 0,
    topIncomePercentage: 0,
    fastClimberName: "None",
    fastClimberGrowthPercentage: 0,
    habitTrackerName: "None",
    habitTrackerCount: 0,
  };

  // WHY THIS FIX WAS MADE: Uses explicit nullish coalescing (??) instead of logical OR (||) to avoid
  // overriding legitimate 0 values with hardcoded default numbers (40% and 6 count).
  const safeClimberGrowth = data.fastClimberGrowthPercentage ?? 0;
  const safeHabitCount = data.habitTrackerCount ?? 0;

  const climberOffset = calculateOffset(Math.min(safeClimberGrowth, 100));
  const habitOffset = calculateOffset(Math.min(safeHabitCount * 4, 100));
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.kineticRailContainer}>
      
      {/* NODE 1: TOP EXPENSE */}
      <div className={styles.railNodeItem}>
        <div className={styles.backgroundWaveCanvas}>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={styles.waveSvg} aria-hidden="true">
            <path d="M0,20 Q25,5 50,20 T100,20" fill="none" className={styles.dangerWavePath} strokeWidth="1.5" />
          </svg>
        </div>

        <div className={styles.railNodeCore}>
          <div className={styles.geometricRingAnchor}>
            <svg width="50" height="50" className={styles.ringSvgCanvas} aria-hidden="true">
              <circle className={styles.trackRingCircle} cx="25" cy="25" r={RING_RADIUS} />
              <circle 
                className={`${styles.fillRingCircle} ${styles.dangerRingStroke}`} 
                cx="25" 
                cy="25" 
                r={RING_RADIUS} 
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={calculateOffset(data.topExpensePercentage)}
              />
            </svg>
            <div className={`${styles.centerIconPill} ${styles.dangerContext}`}>
              <FiTrendingDown size={15} />
            </div>
          </div>

          <div className={styles.railDataDeck}>
            <span className={styles.railContextLabel}>Top Expense</span>
            <h4 className={`${styles.floatingGlassPill} ${styles.dangerTextTint}`} title={data.topExpenseName || "None"}>
              {data.topExpenseName || "None"}
            </h4>
            <p className={styles.railValueSubtext}>
              Spent: <span className={styles.brightAccentHighlight}>
                {formatAmount(Number(data.topExpenseAmount) || 0, sourceCurrency)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* NODE 2: MAIN INCOME */}
      <div className={styles.railNodeItem}>
        <div className={styles.backgroundWaveCanvas}>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={styles.waveSvg} aria-hidden="true">
            <path d="M0,30 Q25,10 50,25 T100,5" fill="none" className={styles.successWavePath} strokeWidth="1.5" />
          </svg>
        </div>

        <div className={styles.railNodeCore}>
          <div className={styles.geometricRingAnchor}>
            <svg width="50" height="50" className={styles.ringSvgCanvas} aria-hidden="true">
              <circle className={styles.trackRingCircle} cx="25" cy="25" r={RING_RADIUS} />
              <circle 
                className={`${styles.fillRingCircle} ${styles.successRingStroke}`} 
                cx="25" 
                cy="25" 
                r={RING_RADIUS} 
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={calculateOffset(data.topIncomePercentage)}
              />
            </svg>
            <div className={`${styles.centerIconPill} ${styles.successContext}`}>
              <FiTrendingUp size={15} />
            </div>
          </div>

          <div className={styles.railDataDeck}>
            <span className={styles.railContextLabel}>Main Income</span>
            <h4 className={`${styles.floatingGlassPill} ${styles.successTextTint}`} title={data.topIncomeName || "None"}>
              {data.topIncomeName || "None"}
            </h4>
            <p className={styles.railValueSubtext}>
              Inflow: <span className={styles.brightAccentHighlight}>
                {formatAmount(Number(data.topIncomeAmount) || 0, sourceCurrency)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* NODE 3: FASTEST GROWING */}
      <div className={styles.railNodeItem}>
        <div className={styles.backgroundWaveCanvas}>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={styles.waveSvg} aria-hidden="true">
            <path d="M0,35 Q30,5 60,25 T100,10" fill="none" className={styles.warningWavePath} strokeWidth="1.5" />
          </svg>
        </div>

        <div className={styles.railNodeCore}>
          <div className={styles.geometricRingAnchor}>
            <svg width="50" height="50" className={styles.ringSvgCanvas} aria-hidden="true">
              <circle className={styles.trackRingCircle} cx="25" cy="25" r={RING_RADIUS} />
              <circle 
                className={`${styles.fillRingCircle} ${styles.warningRingStroke}`} 
                cx="25" 
                cy="25" 
                r={RING_RADIUS} 
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={climberOffset}
              />
            </svg>
            <div className={`${styles.centerIconPill} ${styles.warningContext}`}>
              <FiZap size={15} />
            </div>
          </div>

          <div className={styles.railDataDeck}>
            <span className={styles.railContextLabel}>Fastest Climber</span>
            <h4 className={`${styles.floatingGlassPill} ${styles.warningTextTint}`} title={data.fastClimberName || "None"}>
              {data.fastClimberName || "None"}
            </h4>
            <p className={styles.railValueSubtext}>
              Surged: <span className={styles.brightAccentHighlight}>+{safeClimberGrowth}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* NODE 4: MOST FREQUENT */}
      <div className={styles.railNodeItem}>
        <div className={styles.backgroundWaveCanvas}>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={styles.waveSvg} aria-hidden="true">
            <path d="M0,20 Q20,30 40,10 T100,20" fill="none" className={styles.infoWavePath} strokeWidth="1.5" />
          </svg>
        </div>

        <div className={styles.railNodeCore}>
          <div className={styles.geometricRingAnchor}>
            <svg width="50" height="50" className={styles.ringSvgCanvas} aria-hidden="true">
              <circle className={styles.trackRingCircle} cx="25" cy="25" r={RING_RADIUS} />
              <circle 
                className={`${styles.fillRingCircle} ${styles.infoRingStroke}`} 
                cx="25" 
                cy="25" 
                r={RING_RADIUS} 
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={habitOffset}
              />
            </svg>
            <div className={`${styles.centerIconPill} ${styles.infoContext}`}>
              <FiActivity size={15} />
            </div>
          </div>

          <div className={styles.railDataDeck}>
            <span className={styles.railContextLabel}>Most Frequent</span>
            <h4 className={`${styles.floatingGlassPill} ${styles.infoTextTint}`} title={data.habitTrackerName || "None"}>
              {data.habitTrackerName || "None"}
            </h4>
            <p className={styles.railValueSubtext}>
              Logged: <span className={styles.brightAccentHighlight}>{safeHabitCount}x</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
/* === SECTION 4 END === */