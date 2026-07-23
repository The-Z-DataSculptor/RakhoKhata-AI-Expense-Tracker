// src/components/ai-insights/AiLeakWarnings/AiLeakWarnings.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
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
   === SECTION 3: COMPONENT LOGIC & RENDER ===
   ========================================================================== */
export function AiLeakWarnings({ warnings, isLoading }: AiLeakWarningsProps) {
  // WHY THIS FIX WAS MADE: Defensively guards against null or undefined warnings prop to prevent
  // client-side runtime crashes if API responses fail to pass an array.
  const safeWarnings = Array.isArray(warnings) ? warnings : [];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div role="status" aria-live="polite">
          <div className={styles.leaksGroupHeaderRow}>
            <FiAlertTriangle className={styles.titleAlertWarningIcon} size={18} />
            <h3 className={styles.leaksMainLabelTitle}>Checking for money leaks...</h3>
          </div>
          <p className={styles.loadingMessage}>Loading your spending data...</p>
        </div>
      );
    }

    if (safeWarnings.length === 0) {
      return (
        <div role="status" aria-live="polite">
          <div className={styles.leaksGroupHeaderRow}>
            <FiCheckCircle className={styles.titleAlertWarningIcon} size={18} style={{ color: "#10b981" }} />
            <h3 className={styles.leaksMainLabelTitle}>No money leaks found!</h3>
          </div>
          <p className={styles.emptyMessage}> Great job! You are staying within your budgets.</p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.leaksGroupHeaderRow}>
          <FiAlertTriangle className={styles.titleAlertWarningIcon} size={18} />
          <h3 className={styles.leaksMainLabelTitle}>Money leaks to fix ({safeWarnings.length})</h3>
        </div>

        <div className={styles.warningsCardLayoutGrid}>
          {safeWarnings.map((warning, index) => {
            // WHY THIS FIX WAS MADE: Uses a fallback composite key if warning.id is missing or duplicate,
            // ensuring DOM node identification integrity during React reconciliation.
            const uniqueKey = warning.id || `leak-warning-${index}`;
            const dotColor = warning.severity === "high" ? "#dc2626" : "#d97706";

            return (
              <div key={uniqueKey} className={styles.singleLeakCardItem}>
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
    <section className={styles.leaksCardWrapper} aria-label="Budget Leak Warnings Section">
      {renderContent()}
    </section>
  );
}
/* === SECTION 3 END === */