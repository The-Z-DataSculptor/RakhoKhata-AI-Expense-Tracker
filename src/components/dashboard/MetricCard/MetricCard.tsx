/* ==========================================================================
   === FILEPATH: src/components/dashboard/MetricCard/MetricCard.tsx ===
   ========================================================================== */


/* ==========================================================================
   === SECTION 1: IMPORTS & DEPENDENCIES ===
   ========================================================================== */
import React from "react";
// Importing standard, clean icons from Feather Icons group
import { FiActivity, FiTrendingUp, FiTrendingDown, FiShield } from "react-icons/fi";
import styles from "./MetricCard.module.css";
/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: TYPESCRIPT INTERFACES ===
   ========================================================================== */
export interface MetricItem {
  title: string;
  value: string;
  subtext: string;
  iconType: "bill" | "inflow" | "outflow" | "safe";
}

export interface MetricCardProps {
  metrics: MetricItem[];
}
/* === SECTION 2 END === */


/* ==========================================================================
   === SECTION 3: MAIN COMPONENT ===
   ========================================================================== */
export default function MetricCard({ metrics }: MetricCardProps) {
  
  // Safety check: If there are no items in the list, show a friendly message
  if (!metrics || metrics.length === 0) {
    return <div className={styles.emptySlateText}>No financial data available right now.</div>;
  }

  return (
    <div className={styles.metricGridContainer}>
      {metrics.map((item, index) => {
        
        // 1. BEGINNER FRIENDLY: Explicitly choose the icon based on the type
        let cardIcon = <FiActivity size={18} />;
        if (item.iconType === "inflow") {
          cardIcon = <FiTrendingUp size={18} />;
        } else if (item.iconType === "outflow") {
          cardIcon = <FiTrendingDown size={18} />;
        } else if (item.iconType === "safe") {
          cardIcon = <FiShield size={18} />;
        }

        // 2. BEGINNER FRIENDLY: Explicitly choose the CSS class name based on the type
        let cardStyleClass = styles.billCard;
        if (item.iconType === "inflow") {
          cardStyleClass = styles.inflowCard;
        } else if (item.iconType === "outflow") {
          cardStyleClass = styles.outflowCard;
        } else if (item.iconType === "safe") {
          cardStyleClass = styles.safeCard;
        }

        // Create a human-friendly count structure (e.g., [01], [02], [03])
        const displayIndex = "[" + String(index + 1).padStart(2, "0") + "]";

        // THE "WHY" EXTRACTOR: We split the string by spaces to isolate the first word
        // This lets us style the first word differently without invalid pseudo-elements
        const titleWords = item.title.split(" ");
        const firstWord = titleWords[0];
        const remainingWords = titleWords.slice(1).join(" ");

        return (
          <article key={item.title} className={`${styles.metricCardBase} ${cardStyleClass}`}>
            
            {/* TOP LINE: TITLE & ICON */}
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

            {/* MIDDLE LINE: THE BIG MONEY NUMBER */}
            <div className={styles.cardBodyContent}>
              <h2 className={styles.metricValueDisplay}>
                {item.value}
              </h2>
            </div>

            {/* BOTTOM LINE: THE POPPING COMMENT DESCRIPTION */}
            <footer className={styles.cardFooterRow}>
              <p className={styles.commentSubtext}>
                <span className={styles.commentSyntax}>|</span> {item.subtext}
              </p>
            </footer>

          </article>
        );
      })}
    </div>
  );
}
/* === SECTION 3 END === */