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
  currency: string;
  totalInvested: number;
  positionsCount: number;
  sourceCurrency: string;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & RENDER ===
   ========================================================================== */
export function VaultSummaryCards({
  currency,
  totalInvested,
  positionsCount,
  sourceCurrency,
}: VaultSummaryCardsProps) {
  const { formatAmount } = useCurrency();

  // WHY THIS FIX WAS MADE: Defensively converts and bounds input values to prevent
  // passing negative or NaN values to currency formatting context routines.
  const safeTotalInvested = Math.max(0, Number(totalInvested) || 0);
  const safePositionsCount = Math.max(0, Math.floor(Number(positionsCount) || 0));
  const displayCurrency = currency ? currency.trim().toUpperCase() : "USD";
  const displaySourceCurrency = sourceCurrency ? sourceCurrency.trim().toUpperCase() : "USD";

  return (
    <section className={styles.summaryGridWrapper} aria-label="Vault Financial Overview">
      {/* CARD 1: TOTAL INVESTED */}
      <div className={styles.splitLevelPremiumCard}>
        <div className={styles.upperMetricsCanvas}>
          <span className={styles.cardSectionLabel}>Total Money Invested</span>
          <h2 className={styles.hugePrimaryMetricsText}>
            {formatAmount(safeTotalInvested, displaySourceCurrency)}
          </h2>
        </div>
        <div className={styles.lowerInsightsPocket}>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Status</span>
            <span className={styles.pocketPrimaryValue}>Active</span>
          </div>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Positions</span>
            <span className={styles.pocketPrimaryValue}>🪙 {safePositionsCount}</span>
          </div>
        </div>
      </div>

      {/* CARD 2: PORTFOLIO CURRENCY */}
      <div className={styles.splitLevelPremiumCard}>
        <div className={styles.upperMetricsCanvas}>
          <span className={styles.cardSectionLabel}>Portfolio Currency</span>
          <h2 className={`${styles.hugePrimaryMetricsText} ${styles.gainTextColor}`}>
            {displayCurrency}
          </h2>
        </div>
        <div className={styles.lowerInsightsPocket}>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Stable</span>
            <span className={styles.pocketPrimaryValue}>Yes</span>
          </div>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Conversion</span>
            <span className={styles.pocketPrimaryValue}>Manual</span>
          </div>
        </div>
      </div>

      {/* CARD 3: QUICK GLANCE */}
      <div className={styles.splitLevelPremiumCard}>
        <div className={styles.upperMetricsCanvas}>
          <span className={styles.cardSectionLabel}>Asset Types</span>
          <h2 className={styles.hugePrimaryMetricsText}>{safePositionsCount}</h2>
        </div>
        <div className={styles.lowerInsightsPocket}>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Tracked</span>
            <span className={styles.pocketPrimaryValue}>On-chain</span>
          </div>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Security</span>
            <span className={styles.pocketPrimaryValue}>Encrypted</span>
          </div>
        </div>
      </div>
    </section>
  );
}
/* === SECTION 3 END === */