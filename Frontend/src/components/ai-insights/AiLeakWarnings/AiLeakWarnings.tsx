// src/components/ai-insights/AiLeakWarnings/AiLeakWarnings.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import styles from "./AiLeakWarnings.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface WarningItem {
  id: string;
  categoryName: string;
  severity: "high" | "medium";
  overspendAmount: string;
  simpleDescription: string;
}

interface AiLeakWarningsProps {
  warnings: WarningItem[];
  isLoading: boolean;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function AiLeakWarnings({ warnings, isLoading }: AiLeakWarningsProps) {
  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <div className={styles.leaksGroupHeaderRow}>
            <FiAlertTriangle className={styles.titleAlertWarningIcon} size={18} />
            <h3 className={styles.leaksMainLabelTitle}>Checking for money leaks...</h3>
          </div>
          <p className={styles.loadingMessage}>Loading your spending data...</p>
        </>
      );
    }

    if (warnings.length === 0) {
      return (
        <>
          <div className={styles.leaksGroupHeaderRow}>
            <FiAlertTriangle className={styles.titleAlertWarningIcon} size={18} />
            <h3 className={styles.leaksMainLabelTitle}>No money leaks found!</h3>
          </div>
          <p className={styles.emptyMessage}>🎉 Great job! You are staying within your budgets.</p>
        </>
      );
    }

    return (
      <>
        <div className={styles.leaksGroupHeaderRow}>
          <FiAlertTriangle className={styles.titleAlertWarningIcon} size={18} />
          <h3 className={styles.leaksMainLabelTitle}>Money leaks to fix</h3>
        </div>

        <div className={styles.warningsCardLayoutGrid}>
          {warnings.map((warning) => {
            const dotColor = warning.severity === "high" ? "#dc2626" : "#d97706";

            return (
              <div key={warning.id} className={styles.singleLeakCardItem}>
                <div className={styles.cardTopDetailsRow}>
                  <h4 className={styles.leakCardCategoryTitle} title={warning.categoryName}>
                    <span
                      className={styles.categoryDot}
                      style={{ backgroundColor: dotColor }}
                    />
                    <span>{warning.categoryName}</span>
                  </h4>
                  <span
                    className={`${styles.leakSeverityBadgeLabel} ${
                      warning.severity === "high"
                        ? styles.badgeHighDangerSoft
                        : styles.badgeMediumWarningSoft
                    }`}
                  >
                    {warning.overspendAmount}
                  </span>
                </div>
                <p className={styles.leakCardExplanationDescriptionText}>
                  {warning.simpleDescription}
                </p>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <section className={styles.leaksCardWrapper}>
      {renderContent()}
    </section>
  );
}
/* === SECTION 4 END === */