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
  /** The currently selected global currency string (e.g., "PKR", "USD") */
  currency: string;
  /** The aggregated total amount of money invested across all assets */
  totalInvested: number;
  /** The total count of individual assets currently in the vault */
  positionsCount: number;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & RENDER (JSX) ===
   ========================================================================== */
export function VaultSummaryCards({
  currency,
  totalInvested,
  positionsCount,
}: VaultSummaryCardsProps) {
  // Grab state-aware localized format helpers from global navigation canvas shell wrapper
  const { formatAmount } = useCurrency();

  // FIXED: Replaced 'as any' with an safe indexed parameter lookup type to resolve the linter warning
  const displayInvestedCapital = formatAmount(
    totalInvested, 
    currency as Parameters<typeof formatAmount>[1]
  );

  return (
    <section className={styles.summaryGridWrapper}>

      {/* CARD 1: NET ALLOCATION COST */}
      <div className={styles.splitLevelPremiumCard}>
        <div className={styles.upperMetricsCanvas}>
          <span className={styles.cardSectionLabel}>Net Allocation Cost</span>
          <h2 className={styles.hugePrimaryMetricsText}>{displayInvestedCapital}</h2>
        </div>
        
        <div className={styles.lowerInsightsPocket}>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Status</span>
            <span className={styles.pocketPrimaryValue}>Fully Allocated</span>
          </div>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Active Assets</span>
            <span className={styles.pocketPrimaryValue}>🪙 {positionsCount} Types</span>
          </div>
        </div>
      </div>

      {/* CARD 2: ACTIVE TRACKERS */}
      <div className={styles.splitLevelPremiumCard}>
        <div className={styles.upperMetricsCanvas}>
          <div className={styles.labelFlexRow}>
            <span className={styles.cardSectionLabel}>Active Trackers</span>
            <span className={`${styles.roiPerformanceBadge} ${styles.profitBadgeColor}`}>
              Live
            </span>
          </div>
          <h2 className={`${styles.hugePrimaryMetricsText} ${styles.gainTextColor}`}>
            {positionsCount} Positions
          </h2>
        </div>
        
        <div className={styles.lowerInsightsPocket}>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Sync Engine</span>
            <span className={`${styles.pocketPrimaryValue} ${styles.highlightedRunnerText}`}>
              ⚡ Real-time
            </span>
          </div>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Security</span>
            <span className={`${styles.pocketPrimaryValue} ${styles.gainValueLabel}`}>
              Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: BASE VALUE REFERENCE */}
      <div className={styles.splitLevelPremiumCard}>
        <div className={styles.upperMetricsCanvas}>
          <span className={styles.cardSectionLabel}>Base Value Reference</span>
          <h2 className={styles.hugePrimaryMetricsText}>{currency}</h2>
        </div>
        
        <div className={styles.lowerInsightsPocket}>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Workspace Standard</span>
            <span className={styles.pocketPrimaryValue}>Uniform Baseline</span>
          </div>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Conversion</span>
            <span className={styles.pocketPrimaryValue}>Stable</span>
          </div>
        </div>
      </div>

    </section>
  );
}
/* === SECTION 3 END === */