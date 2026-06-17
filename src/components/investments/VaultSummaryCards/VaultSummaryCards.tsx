// src/components/investments/VaultSummaryCards/VaultSummaryCards.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./VaultSummaryCards.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface VaultSummaryCardsProps {
  /** The absolute aggregated current value of all investments combined (Calculated in base USD units) */
  totalCurrentValueUSD: number;
  /** The out-of-pocket tracking capital cost basis across all combined investments (Calculated in base USD units) */
  totalInvestedCapitalUSD: number;
  /** Label indicating the top growing asset element for insight text injection (e.g., "BTC (+42%)") */
  topRunnerLabel?: string;
  /** Current breakdown profile info of your active investments portfolio (e.g., "65% Crypto / 35% Stocks") */
  portfolioMixLabel?: string;
  /** Numerical indicator representing count of active asset types inside storage */
  activeAssetsCount?: number;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function VaultSummaryCards({
  totalCurrentValueUSD,
  totalInvestedCapitalUSD,
  topRunnerLabel = "BTC (+42%)",
  portfolioMixLabel = "65% Crypto / 35% Stocks",
  activeAssetsCount = 3,
}: VaultSummaryCardsProps) {
  // Grab state-aware localized format helpers from global navigation canvas shell wrapper
  const { formatAmount } = useCurrency();

  // Mathematical execution logic to isolate returns performance analytics
  const rawNetGainLossUSD = totalCurrentValueUSD - totalInvestedCapitalUSD;
  const isPortfolioProfitable = rawNetGainLossUSD >= 0;

  // Calculate clean, secure Return On Investment (ROI) percentages avoiding division by zero errors
  const calculatedROIPercentage = totalInvestedCapitalUSD > 0 
    ? (rawNetGainLossUSD / totalInvestedCapitalUSD) * 100 
    : 0;

  // Format financial parameters using global active currency context rules (Set cleanly to USD)
  const displayNetValue = formatAmount(totalCurrentValueUSD, "USD");
  const displayInvestedCapital = formatAmount(totalInvestedCapitalUSD, "USD");
  const displayNetGainLoss = formatAmount(Math.abs(rawNetGainLossUSD), "USD");
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <section className={styles.summaryGridWrapper}>

      {/* CARD 1: NET VAULT VALUATION */}
      <div className={styles.splitLevelPremiumCard}>
        {/* UPPER CLEAN CANVAS SECTION */}
        <div className={styles.upperMetricsCanvas}>
          <span className={styles.cardSectionLabel}>Net Vault Valuation</span>
          <h2 className={styles.hugePrimaryMetricsText}>{displayNetValue}</h2>
        </div>
        
        {/* LOWER TINTED STORAGE CONTAINER POCKET */}
        <div className={styles.lowerInsightsPocket}>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Portfolio Mix</span>
            <span className={styles.pocketPrimaryValue}>{portfolioMixLabel}</span>
          </div>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Asset Count</span>
            <span className={styles.pocketPrimaryValue}>🪙 {activeAssetsCount} Types</span>
          </div>
        </div>
      </div>

      {/* CARD 2: TOTAL INVESTED CAPITAL */}
      <div className={styles.splitLevelPremiumCard}>
        {/* UPPER CLEAN CANVAS SECTION */}
        <div className={styles.upperMetricsCanvas}>
          <span className={styles.cardSectionLabel}>Total Invested Capital</span>
          <h2 className={styles.hugePrimaryMetricsText}>{displayInvestedCapital}</h2>
        </div>
        
        {/* LOWER TINTED STORAGE CONTAINER POCKET */}
        <div className={styles.lowerInsightsPocket}>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Funding Status</span>
            <span className={styles.pocketPrimaryValue}>Fully Allocated</span>
          </div>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Base Currency</span>
            <span className={styles.pocketPrimaryValue}>USD Gateway</span>
          </div>
        </div>
      </div>

      {/* CARD 3: TOTAL PORTFOLIO RETURNS */}
      <div className={styles.splitLevelPremiumCard}>
        {/* UPPER CLEAN CANVAS SECTION */}
        <div className={styles.upperMetricsCanvas}>
          <div className={styles.labelFlexRow}>
            <span className={styles.cardSectionLabel}>Total Returns Engine</span>
            {/* High-visibility colored indicator tag */}
            <span className={`${styles.roiPerformanceBadge} ${isPortfolioProfitable ? styles.profitBadgeColor : styles.lossBadgeColor}`}>
              <svg 
                className={styles.trendArrowIcon}
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                {isPortfolioProfitable ? (
                  <>
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </>
                ) : (
                  <>
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                    <polyline points="17 18 23 18 23 12"></polyline>
                  </>
                )}
              </svg>
              {Math.abs(calculatedROIPercentage).toFixed(1)}%
            </span>
          </div>
          <h2 className={`${styles.hugePrimaryMetricsText} ${isPortfolioProfitable ? styles.gainTextColor : styles.lossTextColor}`}>
            {isPortfolioProfitable ? "+" : "-"}{displayNetGainLoss}
          </h2>
        </div>
        
        {/* LOWER TINTED STORAGE CONTAINER POCKET */}
        <div className={styles.lowerInsightsPocket}>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Top Performing Runner</span>
            <span className={`${styles.pocketPrimaryValue} ${styles.highlightedRunnerText}`}>
              🔥 {topRunnerLabel}
            </span>
          </div>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Growth Status</span>
            <span className={`${styles.pocketPrimaryValue} ${isPortfolioProfitable ? styles.gainValueLabel : styles.lossValueLabel}`}>
              {isPortfolioProfitable ? "Net Profit" : "Net Loss"}
            </span>
          </div>
        </div>
      </div>

    </section>
  );
}
/* === SECTION 4 END === */