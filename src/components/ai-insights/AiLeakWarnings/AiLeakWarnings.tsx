// src/components/ai-insights/AiLeakWarnings/AiLeakWarnings.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================= */
import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import styles from "./AiLeakWarnings.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface LeakItem {
  id: string;
  categoryName: string;
  severity: "high" | "medium";
  overspendAmount: string;
  simpleDescription: string;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function AiLeakWarnings() {
  // Simple, easy-to-read warnings list
  const warningsList: LeakItem[] = [
    {
      id: "leak-1",
      categoryName: "Marketing Ads",
      severity: "high",
      overspendAmount: "12,000 PKR over budget",
      simpleDescription: "You spent too much on running ads this week. Lower your daily ad limits to stop losing cash."
    },
    {
      id: "leak-2",
      categoryName: "Food & Groceries",
      severity: "medium",
      overspendAmount: "4,500 PKR over budget",
      simpleDescription: "Buying small snacks too often is quietly cutting into your monthly savings pool."
    }
  ];
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <section className={styles.leaksSectionWrapper}>
      
      {/* CARD GROUP TITLE HEADER */}
      <div className={styles.leaksGroupHeaderRow}>
        <FiAlertTriangle className={styles.titleAlertWarningIcon} size={15} />
        <h3 className={styles.leaksMainLabelTitle}>Wasted Money Alerts</h3>
      </div>

      {/* CARDS CONTAINER GRID */}
      <div className={styles.warningsCardLayoutGrid}>
        {warningsList.map((card) => (
          <div key={card.id} className={styles.singleLeakCardItem}>
            
            {/* CARD TOP INFO BAR */}
            <div className={styles.cardTopDetailsRow}>
              <h4 className={styles.leakCardCategoryTitle}>{card.categoryName}</h4>
              <span className={`${styles.leakSeverityBadgeLabel} ${card.severity === "high" ? styles.badgeHighDangerSoft : styles.badgeMediumWarningSoft}`}>
                {card.overspendAmount}
              </span>
            </div>

            {/* SIMPLE REASON TEXT */}
            <p className={styles.leakCardExplanationDescriptionText}>
              {card.simpleDescription}
            </p>

          </div>
        ))}
      </div>

    </section>
  );
}
/* === SECTION 4 END === */