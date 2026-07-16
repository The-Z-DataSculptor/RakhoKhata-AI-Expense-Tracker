// src/components/investments/VaultSummaryCards/VaultSummaryCards.tsx
"use client";

import React from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./VaultSummaryCards.module.css";

interface VaultSummaryCardsProps {
  currency: string;
  totalInvested: number;
  positionsCount: number;
  sourceCurrency: string;
}

export function VaultSummaryCards({
  currency,
  totalInvested,
  positionsCount,
  sourceCurrency,
}: VaultSummaryCardsProps) {
  const { formatAmount } = useCurrency();

  return (
    <section className={styles.summaryGridWrapper}>
      {/* CARD 1: TOTAL INVESTED */}
      <div className={styles.splitLevelPremiumCard}>
        <div className={styles.upperMetricsCanvas}>
          <span className={styles.cardSectionLabel}>Total Money Invested</span>
          <h2 className={styles.hugePrimaryMetricsText}>
            {formatAmount(totalInvested, sourceCurrency)}
          </h2>
        </div>
        <div className={styles.lowerInsightsPocket}>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Status</span>
            <span className={styles.pocketPrimaryValue}>Active</span>
          </div>
          <div className={styles.pocketDataColumn}>
            <span className={styles.pocketSublabel}>Positions</span>
            <span className={styles.pocketPrimaryValue}>🪙 {positionsCount}</span>
          </div>
        </div>
      </div>

      {/* CARD 2: PORTFOLIO CURRENCY */}
      <div className={styles.splitLevelPremiumCard}>
        <div className={styles.upperMetricsCanvas}>
          <span className={styles.cardSectionLabel}>Portfolio Currency</span>
          <h2 className={`${styles.hugePrimaryMetricsText} ${styles.gainTextColor}`}>
            {currency}
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
          <h2 className={styles.hugePrimaryMetricsText}>{positionsCount}</h2>
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