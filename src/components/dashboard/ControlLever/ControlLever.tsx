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

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface ControlLeverProps {
  totalIncome: number;
  fixedExpenses: number;     // Bills you must pay (Raw baseline value)
  flexibleExpenses: number;  // Fun/Lifestyle choices (Raw baseline value)
  activePeriod: TimePeriod;  // CONNECTED: Tracks the active time selection
}

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function ControlLever({
  totalIncome,
  fixedExpenses,
  flexibleExpenses,
  activePeriod,
}: ControlLeverProps) {
  
  // 1. Grab your global format tool from the context
  const { formatAmount } = useCurrency();
  
  // NOTE: Change "USD" below to "PKR" if your raw database inputs are already saved in rupees!
  const BASE_SOURCE_CURRENCY = "USD"; 

  // 2. Percentages use relative ratios, so raw baseline inputs work perfectly for bar widths
  const fixedWidth = totalIncome > 0 ? (fixedExpenses / totalIncome) * 100 : 0;
  const flexibleWidth = totalIncome > 0 ? (flexibleExpenses / totalIncome) * 100 : 0;
  const savingsWidth = Math.max(0, 100 - (fixedWidth + flexibleWidth));

  // 3. Calculate leftover raw savings to run through the global formatter
  const totalSpent = fixedExpenses + flexibleExpenses;
  const leftOverSavings = Math.max(0, totalIncome - totalSpent);

  // 4. TIMEFRAME STRING UTILITY: Converts active keys into exact matching description labels
  const getPeriodLabel = () => {
    if (activePeriod === "7d") return "this week";
    if (activePeriod === "14d") return "for 2 weeks";
    if (activePeriod === "30d") return "this month";
    return "overall";
  };

  const periodLabel = getPeriodLabel();

  return (
    /* ==========================================================================
       === SECTION 4: RENDER (JSX) ===
       ========================================================================== */
    <div className={styles.containerCard}>
      
      {/* HEADER ELEMENT */}
      <div className={styles.cardHeader}>
        <h3 className={styles.mainTitle}>Your Expense Control Lever</h3>
        <p className={styles.subTitle}>
          A single look at how your bills and choices compete for your hard-earned income.
        </p>
      </div>

      {/* THE SINGLE COMBINED TRACK HORIZONTAL BAR */}
      <div className={styles.splitBarMasterTrack}>
        {/* Segment A: Fixed Bills */}
        <div 
          className={`${styles.barSegment} ${styles.segmentFixed}`} 
          style={{ width: `${fixedWidth}%` }}
        >
          {fixedWidth > 8 && <span className={styles.segmentLabel}>Bills</span>}
        </div>

        {/* Segment B: Lifestyle Choice Spending */}
        <div 
          className={`${styles.barSegment} ${styles.segmentFlexible}`} 
          style={{ width: `${flexibleWidth}%` }}
        >
          {flexibleWidth > 8 && <span className={styles.segmentLabel}>Daily Choices</span>}
        </div>

        {/* Segment C: Leftover/Unspent Space */}
        <div 
          className={`${styles.barSegment} ${styles.segmentSavings}`} 
          style={{ width: `${savingsWidth}%` }}
        >
          {savingsWidth > 12 && <span className={styles.segmentLabel}>Unspent</span>}
        </div>
      </div>

      {/* METRIC CARD DESCRIPTIVE ROWS */}
      <div className={styles.detailsGridRows}>
        
        {/* ROW 1: FIXED OUTFLOWS */}
        <div className={styles.infoRowBlock}>
          <div className={styles.leftLabelSide}>
            <span className={`${styles.indicatorDot} ${styles.dotFixed}`}></span>
            <FiShield size={16} className={styles.rowIcon} />
            <div>
              <p className={styles.rowHeadline}>Unavoidable Outflow</p>
              {/* UPDATED: Dynamic subtext template string literal */}
              <p className={styles.rowSubtext}>Locked costs like rent, loans, and mandatory bills {periodLabel}.</p>
            </div>
          </div>
          <div className={styles.rightValueSide}>
            <span className={styles.amountValue}>{formatAmount(fixedExpenses, BASE_SOURCE_CURRENCY)}</span>
            <span className={styles.percentageValue}>{fixedWidth.toFixed(0)}% of income</span>
          </div>
        </div>

        {/* ROW 2: ADJUSTABLE LIFESTYLE */}
        <div className={styles.infoRowBlock}>
          <div className={styles.leftLabelSide}>
            <span className={`${styles.indicatorDot} ${styles.dotFlexible}`}></span>
            <FiTrendingDown size={16} className={styles.rowIcon} />
            <div>
              <p className={styles.rowHeadline}>Adjustable Lifestyle Spending</p>
              {/* UPDATED: Dynamic subtext template string literal */}
              <p className={styles.rowSubtext}>Things you choose to buy like cafe food, shopping, and trips {periodLabel}.</p>
            </div>
          </div>
          <div className={styles.rightValueSide}>
            <span className={styles.amountValue}>{formatAmount(flexibleExpenses, BASE_SOURCE_CURRENCY)}</span>
            <span className={styles.percentageValue}>{flexibleWidth.toFixed(0)}% of income</span>
          </div>
        </div>

      </div>

      {/* THE LIVE SAVINGS REWARD CALLOUT INDICATOR */}
      <div className={styles.savingsBracketCallout}>
        <div className={styles.bracketDashedLines}>
          <div className={styles.bracketLeftHook}></div>
          <div className={styles.bracketCenterStraight}></div>
          <div className={styles.bracketRightHook}></div>
        </div>
        <div className={styles.rewardMessageText}>
          <FiSmile size={16} className={styles.rewardIconJump} />
          <span>
            {/* UPDATED: Injected dynamic periodLabel string token inside the sentence element */}
            <strong>If you stop spending right now</strong>, you will keep and save <strong>{formatAmount(leftOverSavings, BASE_SOURCE_CURRENCY)}</strong> {periodLabel}!
          </span>
        </div>
      </div>

    </div>
  );
}