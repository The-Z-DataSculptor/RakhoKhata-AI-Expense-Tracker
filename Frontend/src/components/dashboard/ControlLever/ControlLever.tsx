// src/components/dashboard/ControlLever/ControlLever.tsx
"use client";

import React from "react";
import { FiTrendingDown, FiSmile, FiShield } from "react-icons/fi";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext"; 
import { TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import styles from "./ControlLever.module.css";

interface ControlLeverProps {
  totalIncome: number;
  fixedExpenses: number;     
  flexibleExpenses: number;  
  activePeriod: TimePeriod;
  sourceCurrency: string;   // <-- NEW: workspace currency for formatting
}

export default function ControlLever({
  totalIncome,
  fixedExpenses,
  flexibleExpenses,
  activePeriod,
  sourceCurrency,
}: ControlLeverProps) {
  
  const { formatAmount } = useCurrency();

  const fixedWidth = totalIncome > 0 ? (fixedExpenses / totalIncome) * 100 : 0;
  const flexibleWidth = totalIncome > 0 ? (flexibleExpenses / totalIncome) * 100 : 0;
  const savingsWidth = Math.max(0, 100 - (fixedWidth + flexibleWidth));

  const leftOverSavings = Math.max(0, totalIncome - (fixedExpenses + flexibleExpenses));

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

      <div className={styles.splitBarMasterTrack}>
        <div 
          className={`${styles.barSegment} ${styles.segmentFixed}`} 
          style={{ width: `${fixedWidth}%` }}
        >
          {fixedWidth > 8 && <span className={styles.segmentLabel}>Fixed Costs</span>}
        </div>

        <div 
          className={`${styles.barSegment} ${styles.segmentFlexible}`} 
          style={{ width: `${flexibleWidth}%` }}
        >
          {flexibleWidth > 8 && <span className={styles.segmentLabel}>Flexible Spending</span>}
        </div>

        <div 
          className={`${styles.barSegment} ${styles.segmentSavings}`} 
          style={{ width: `${savingsWidth}%` }}
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
            <span className={styles.amountValue}>{formatAmount(fixedExpenses, sourceCurrency)}</span>
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
            <span className={styles.amountValue}>{formatAmount(flexibleExpenses, sourceCurrency)}</span>
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