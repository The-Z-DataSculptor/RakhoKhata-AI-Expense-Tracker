// src/components/dashboard/ControlLever/ControlLever.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiTrendingDown, FiSmile, FiShield } from "react-icons/fi";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext"; 
import { TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import styles from "./ControlLever.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface ControlLeverProps {
  totalIncome: number;
  fixedExpenses: number;     
  flexibleExpenses: number;  
  activePeriod: TimePeriod;
  sourceCurrency: string;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & RENDER ===
   ========================================================================== */
export default function ControlLever({
  totalIncome,
  fixedExpenses,
  flexibleExpenses,
  activePeriod,
  sourceCurrency,
}: ControlLeverProps) {
  const { formatAmount } = useCurrency();

  // WHY THIS FIX WAS MADE: Defensively handles non-numeric inputs and guards against division by zero
  // to avoid NaN width percentages and broken visual progress bars.
  const safeIncome = Math.max(0, Number(totalIncome) || 0);
  const safeFixed = Math.max(0, Number(fixedExpenses) || 0);
  const safeFlexible = Math.max(0, Number(flexibleExpenses) || 0);

  const fixedWidth = safeIncome > 0 ? Math.min(100, (safeFixed / safeIncome) * 100) : 0;
  const flexibleWidth = safeIncome > 0 ? Math.min(100 - fixedWidth, (safeFlexible / safeIncome) * 100) : 0;
  const savingsWidth = Math.max(0, 100 - (fixedWidth + flexibleWidth));

  const leftOverSavings = Math.max(0, safeIncome - (safeFixed + safeFlexible));

  const getPeriodLabel = () => {
    if (activePeriod === "7d") return "for this week";
    if (activePeriod === "14d") return "for the first half of the month";
    if (activePeriod === "30d") return "this month";
    return "overall";
  };

  const periodLabel = getPeriodLabel();

  return (
    <div className={styles.containerCard}>
      
      <div className={styles.cardHeader}>
        <h3 className={styles.mainTitle}>How Your Money Is Allocated</h3>
        <p className={styles.subTitle}>
          Based on your current month’s budget, this shows how your income is split {periodLabel}.
        </p>
      </div>

      <div className={styles.splitBarMasterTrack} role="progressbar" aria-valuenow={Math.round(fixedWidth + flexibleWidth)}>
        <div 
          className={`${styles.barSegment} ${styles.segmentFixed}`} 
          style={{ width: `${fixedWidth.toFixed(2)}%` }}
        >
          {fixedWidth > 8 && <span className={styles.segmentLabel}>Fixed Costs</span>}
        </div>

        <div 
          className={`${styles.barSegment} ${styles.segmentFlexible}`} 
          style={{ width: `${flexibleWidth.toFixed(2)}%` }}
        >
          {flexibleWidth > 8 && <span className={styles.segmentLabel}>Flexible Spending</span>}
        </div>

        <div 
          className={`${styles.barSegment} ${styles.segmentSavings}`} 
          style={{ width: `${savingsWidth.toFixed(2)}%` }}
        >
          {savingsWidth > 12 && <span className={styles.segmentLabel}>Unspent</span>}
        </div>
      </div>

      <div className={styles.detailsGridRows}>
        
        <div className={styles.infoRowBlock}>
          <div className={styles.leftLabelSide}>
            <span className={`${styles.indicatorDot} ${styles.dotFixed}`}></span>
            <FiShield size={16} className={styles.rowIcon} />
            <div>
              <p className={styles.rowHeadline}>Fixed Costs</p>
              <p className={styles.rowSubtext}>Regular bills – rent, utilities, subscriptions – that stay the same {periodLabel}.</p>
            </div>
          </div>
          <div className={styles.rightValueSide}>
            <span className={styles.amountValue}>{formatAmount(safeFixed, sourceCurrency)}</span>
            <span className={styles.percentageValue}>{fixedWidth.toFixed(0)}% of income</span>
          </div>
        </div>

        <div className={styles.infoRowBlock}>
          <div className={styles.leftLabelSide}>
            <span className={`${styles.indicatorDot} ${styles.dotFlexible}`}></span>
            <FiTrendingDown size={16} className={styles.rowIcon} />
            <div>
              <p className={styles.rowHeadline}>Flexible Spending</p>
              <p className={styles.rowSubtext}>Everyday choices – eating out, shopping, entertainment – you control {periodLabel}.</p>
            </div>
          </div>
          <div className={styles.rightValueSide}>
            <span className={styles.amountValue}>{formatAmount(safeFlexible, sourceCurrency)}</span>
            <span className={styles.percentageValue}>{flexibleWidth.toFixed(0)}% of income</span>
          </div>
        </div>

      </div>

      <div className={styles.savingsBracketCallout}>
        <div className={styles.bracketDashedLines}>
          <div className={styles.bracketLeftHook}></div>
          <div className={styles.bracketCenterStraight}></div>
          <div className={styles.bracketRightHook}></div>
        </div>
        <div className={styles.rewardMessageText}>
          <FiSmile size={16} className={styles.rewardIconJump} />
          <span>
            <strong>If you pause spending now</strong>, you'll keep <strong>{formatAmount(leftOverSavings, sourceCurrency)}</strong> {periodLabel}!
          </span>
        </div>
      </div>

    </div>
  );
}
/* === SECTION 3 END === */