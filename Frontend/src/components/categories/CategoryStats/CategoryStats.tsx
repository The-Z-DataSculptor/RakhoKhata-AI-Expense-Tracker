// src/components/categories/CategoryStats/CategoryStats.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiTrendingUp, FiTrendingDown, FiActivity, FiZap } from "react-icons/fi";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./CategoryStats.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface CategoryStatData {
  topExpenseName: string;
  topExpenseAmount: number; // in base USD
  topExpensePercentage: number;
  topIncomeName: string;
  topIncomeAmount: number; // in base USD
  topIncomePercentage: number;
  fastClimberName: string;
  fastClimberGrowthPercentage: number;
  habitTrackerName: string;
  habitTrackerCount: number;
}

interface CategoryStatsProps {
  statsData: CategoryStatData;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function CategoryStats({ statsData }: CategoryStatsProps) {
  const { formatAmount } = useCurrency();

  const data = statsData || {
    topExpenseName: "None",
    topExpenseAmount: 0,
    topExpensePercentage: 0,
    topIncomeName: "None",
    topIncomeAmount: 0,
    topIncomePercentage: 0,
    fastClimberName: "None",
    fastClimberGrowthPercentage: 0,
    habitTrackerName: "None",
    habitTrackerCount: 0
  };

  const ringRadius = 20;
  const ringCircumference = 2 * Math.PI * ringRadius;

  const calculateOffset = (percentageValue: number) => {
    const safePercent = Math.min(Math.max(percentageValue, 0), 100);
    return ringCircumference - (safePercent / 100) * ringCircumference;
  };

  const climberOffset = calculateOffset(Math.min(data.fastClimberGrowthPercentage || 40, 100));
  const habitOffset = calculateOffset(Math.min((data.habitTrackerCount || 6) * 4, 100));
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.kineticRailContainer}>
      
      {/* NODE 1: TOP EXPENSE */}
      <div className={styles.railNodeItem}>
        <div className={styles.backgroundWaveCanvas}>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={styles.waveSvg}>
            <path d="M0,20 Q25,5 50,20 T100,20" fill="none" className={styles.dangerWavePath} strokeWidth="1.5" />
          </svg>
        </div>

        <div className={styles.railNodeCore}>
          <div className={styles.geometricRingAnchor}>
            <svg width="50" height="50" className={styles.ringSvgCanvas}>
              <circle className={styles.trackRingCircle} cx="25" cy="25" r={ringRadius} />
              <circle 
                className={`${styles.fillRingCircle} ${styles.dangerRingStroke}`} 
                cx="25" 
                cy="25" 
                r={ringRadius} 
                strokeDasharray={ringCircumference}
                strokeDashoffset={calculateOffset(data.topExpensePercentage)}
              />
            </svg>
            <div className={`${styles.centerIconPill} ${styles.dangerContext}`}>
              <FiTrendingDown size={15} />
            </div>
          </div>

          <div className={styles.railDataDeck}>
            <span className={styles.railContextLabel}>Top Expense</span>
            <h4 className={`${styles.floatingGlassPill} ${styles.dangerTextTint}`}>
              {data.topExpenseName}
            </h4>
            <p className={styles.railValueSubtext}>
              Spent: <span className={styles.brightAccentHighlight}>
                {/* ✅ FIXED: source is USD */}
                {formatAmount(data.topExpenseAmount, "USD")}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* NODE 2: MAIN INCOME */}
      <div className={styles.railNodeItem}>
        <div className={styles.backgroundWaveCanvas}>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={styles.waveSvg}>
            <path d="M0,30 Q25,10 50,25 T100,5" fill="none" className={styles.successWavePath} strokeWidth="1.5" />
          </svg>
        </div>

        <div className={styles.railNodeCore}>
          <div className={styles.geometricRingAnchor}>
            <svg width="50" height="50" className={styles.ringSvgCanvas}>
              <circle className={styles.trackRingCircle} cx="25" cy="25" r={ringRadius} />
              <circle 
                className={`${styles.fillRingCircle} ${styles.successRingStroke}`} 
                cx="25" 
                cy="25" 
                r={ringRadius} 
                strokeDasharray={ringCircumference}
                strokeDashoffset={calculateOffset(data.topIncomePercentage)}
              />
            </svg>
            <div className={`${styles.centerIconPill} ${styles.successContext}`}>
              <FiTrendingUp size={15} />
            </div>
          </div>

          <div className={styles.railDataDeck}>
            <span className={styles.railContextLabel}>Main Income</span>
            <h4 className={`${styles.floatingGlassPill} ${styles.successTextTint}`}>
              {data.topIncomeName}
            </h4>
            <p className={styles.railValueSubtext}>
              Inflow: <span className={styles.brightAccentHighlight}>
                {formatAmount(data.topIncomeAmount, "USD")}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* NODE 3: FASTEST GROWING */}
      <div className={styles.railNodeItem}>
        <div className={styles.backgroundWaveCanvas}>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={styles.waveSvg}>
            <path d="M0,35 Q30,5 60,25 T100,10" fill="none" className={styles.warningWavePath} strokeWidth="1.5" />
          </svg>
        </div>

        <div className={styles.railNodeCore}>
          <div className={styles.geometricRingAnchor}>
            <svg width="50" height="50" className={styles.ringSvgCanvas}>
              <circle className={styles.trackRingCircle} cx="25" cy="25" r={ringRadius} />
              <circle 
                className={`${styles.fillRingCircle} ${styles.warningRingStroke}`} 
                cx="25" 
                cy="25" 
                r={ringRadius} 
                strokeDasharray={ringCircumference}
                strokeDashoffset={climberOffset}
              />
            </svg>
            <div className={`${styles.centerIconPill} ${styles.warningContext}`}>
              <FiZap size={15} />
            </div>
          </div>

          <div className={styles.railDataDeck}>
            <span className={styles.railContextLabel}>Fastest Climber</span>
            <h4 className={`${styles.floatingGlassPill} ${styles.warningTextTint}`}>
              {data.fastClimberName}
            </h4>
            <p className={styles.railValueSubtext}>
              Surged: <span className={styles.brightAccentHighlight}>+{data.fastClimberGrowthPercentage}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* NODE 4: MOST FREQUENT */}
      <div className={styles.railNodeItem}>
        <div className={styles.backgroundWaveCanvas}>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={styles.waveSvg}>
            <path d="M0,20 Q20,30 40,10 T100,20" fill="none" className={styles.infoWavePath} strokeWidth="1.5" />
          </svg>
        </div>

        <div className={styles.railNodeCore}>
          <div className={styles.geometricRingAnchor}>
            <svg width="50" height="50" className={styles.ringSvgCanvas}>
              <circle className={styles.trackRingCircle} cx="25" cy="25" r={ringRadius} />
              <circle 
                className={`${styles.fillRingCircle} ${styles.infoRingStroke}`} 
                cx="25" 
                cy="25" 
                r={ringRadius} 
                strokeDasharray={ringCircumference}
                strokeDashoffset={habitOffset}
              />
            </svg>
            <div className={`${styles.centerIconPill} ${styles.infoContext}`}>
              <FiActivity size={15} />
            </div>
          </div>

          <div className={styles.railDataDeck}>
            <span className={styles.railContextLabel}>Most Frequent</span>
            <h4 className={`${styles.floatingGlassPill} ${styles.infoTextTint}`}>
              {data.habitTrackerName}
            </h4>
            <p className={styles.railValueSubtext}>
              Logged: <span className={styles.brightAccentHighlight}>{data.habitTrackerCount}x</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}