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

  const safeTotalInvested = Math.max(0, Number(totalInvested) || 0);
  const safePositionsCount = Math.max(0, Math.floor(Number(positionsCount) || 0));
  const displayCurrency = currency ? currency.trim().toUpperCase() : "USD";
  const displaySourceCurrency = sourceCurrency ? sourceCurrency.trim().toUpperCase() : "USD";

  return (
    <section className={styles.summaryGridWrapper} aria-label="Vault Financial Overview">
      {/* CARD 1: TOTAL INVESTED */}
      <div className={styles.sleekCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardSectionLabel}>Total Invested</span>
          <span className={`${styles.statusPill} ${styles.activePill}`}>
            <span className={styles.dot} />
            Active
          </span>
        </div>
        <div className={styles.mainValueRow}>
          <h2 className={styles.primaryMetric}>
            {formatAmount(safeTotalInvested, displaySourceCurrency)}
          </h2>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerItem}>
            Positions: <strong>{safePositionsCount}</strong>
          </span>
        </div>
      </div>

      {/* CARD 2: PORTFOLIO CURRENCY */}
      <div className={styles.sleekCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardSectionLabel}>Portfolio Currency</span>
          <span className={`${styles.statusPill} ${styles.infoPill}`}>
            Conversion: Manual
          </span>
        </div>
        <div className={styles.mainValueRow}>
          <h2 className={`${styles.primaryMetric} ${styles.currencyMetric}`}>
            {displayCurrency}
          </h2>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerItem}>
            Status: <strong>Stable</strong>
          </span>
        </div>
      </div>

      {/* CARD 3: ASSET TYPES */}
      <div className={styles.sleekCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardSectionLabel}>Asset Types</span>
          <span className={`${styles.statusPill} ${styles.encryptedPill}`}>
            🔒 Encrypted
          </span>
        </div>
        <div className={styles.mainValueRow}>
          <h2 className={styles.primaryMetric}>{safePositionsCount}</h2>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerItem}>
            Tracking: <strong>On-chain</strong>
          </span>
        </div>
      </div>
    </section>
  );
}