// src/components/dashboard/MetricCard/MetricCard.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & DEPENDENCIES ===
   ========================================================================== */
import React from "react";
import { FiActivity, FiTrendingUp, FiTrendingDown, FiShield } from "react-icons/fi";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./MetricCard.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPESCRIPT INTERFACES ===
   ========================================================================== */
export interface MetricItem {
  title: string;
  value: number; // Actual value
  subtext: string;
  iconType: "bill" | "inflow" | "outflow" | "safe";
  projectedValue?: number; // 👈 NEW: Optional projected monthly value
}

export interface MetricCardProps {
  metrics: MetricItem[];
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: MAIN COMPONENT ===
   ========================================================================== */
export default React.memo(function MetricCard({ metrics }: MetricCardProps) {
  const { formatAmount } = useCurrency();

  if (!metrics || metrics.length === 0) {
    return <div className={styles.emptySlateText}>No financial data available right now.</div>;
  }

  return (
    <div className={styles.metricGridContainer}>
      {metrics.map((item, index) => {
        let cardIcon = <FiActivity size={18} />;
        if (item.iconType === "inflow") {
          cardIcon = <FiTrendingUp size={18} />;
        } else if (item.iconType === "outflow") {
          cardIcon = <FiTrendingDown size={18} />;
        } else if (item.iconType === "safe") {
          cardIcon = <FiShield size={18} />;
        }

        let cardStyleClass = styles.billCard;
        if (item.iconType === "inflow") {
          cardStyleClass = styles.inflowCard;
        } else if (item.iconType === "outflow") {
          cardStyleClass = styles.outflowCard;
        } else if (item.iconType === "safe") {
          cardStyleClass = styles.safeCard;
        }

        const displayIndex = "[" + String(index + 1).padStart(2, "0") + "]";
        const titleWords = item.title ? item.title.split(" ") : [""];
        const [extractedFirstWord, ...restWordsArray] = titleWords;
        const firstWord = extractedFirstWord || "";
        const remainingWords = restWordsArray.join(" ");

        // 👇 Build subtext with projected value if available
        let displaySubtext = item.subtext;
        if (item.projectedValue !== undefined && item.projectedValue !== null) {
          displaySubtext = `${item.subtext} · Projected monthly: ${formatAmount(item.projectedValue, "USD")}`;
        }

        return (
          <article key={item.title} className={`${styles.metricCardBase} ${cardStyleClass}`}>
            <header className={styles.cardHeaderRow}>
              <div className={styles.metaLabelGroup}>
                <span className={styles.cardIndexMarker}>{displayIndex}</span>
                <h3 className={styles.cardTitle}>
                  <span className={styles.titleAccent}>{firstWord.toUpperCase()}</span>
                  {" "}{remainingWords.toUpperCase()}
                </h3>
              </div>
              <div className={styles.vectorIconWrapper}>
                {cardIcon}
              </div>
            </header>

            <div className={styles.cardBodyContent}>
              <h2 className={styles.metricValueDisplay}>
                {formatAmount(item.value, "USD")}
              </h2>
            </div>

            <footer className={styles.cardFooterRow}>
              <p className={styles.commentSubtext}>
                <span className={styles.commentSyntax}>|</span> {displaySubtext}
              </p>
            </footer>
          </article>
        );
      })}
    </div>
  );
});