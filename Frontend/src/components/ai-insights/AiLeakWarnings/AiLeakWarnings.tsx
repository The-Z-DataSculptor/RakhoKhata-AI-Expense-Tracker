"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import Link from "next/link";
import { FiAlertTriangle, FiCheckCircle, FiTarget } from "react-icons/fi";
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
  /** Whether at least one budget exists in the current workspace */
  hasBudgets?: boolean;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & RENDER ===
   ========================================================================== */
export function AiLeakWarnings({ warnings, isLoading, hasBudgets }: AiLeakWarningsProps) {
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

    // No budgets – show compact empty state with CTA
    if (!hasBudgets) {
      return (
        <div className={styles.noBudgetsPremiumState} role="status" aria-live="polite">
          <div className={styles.noBudgetsGlassCard}>
            <div className={styles.noBudgetsIconWrapper}>
              <FiTarget className={styles.noBudgetsIcon} />
            </div>
            <h3 className={styles.noBudgetsHeadline}>No Budgets Set Yet</h3>
            <p className={styles.noBudgetsSubtext}>
              Set spending limits for your categories to automatically get money leaks and overspending warning.
            </p>
            <Link href="/dashboard/budgets" className={styles.noBudgetsCtaBtn}>
              Go to Budgets
            </Link>
          </div>
        </div>
      );
    }

    // Budgets exist but no leaks found
    if (safeWarnings.length === 0) {
      return (
        <div role="status" aria-live="polite">
          <div className={styles.leaksGroupHeaderRow}>
            <FiCheckCircle className={styles.titleAlertWarningIcon} size={18} style={{ color: "#10b981" }} />
            <h3 className={styles.leaksMainLabelTitle}>No money leaks found!</h3>
          </div>
          <p className={styles.emptyMessage}>Great job! You are staying within your budgets.</p>
        </div>
      );
    }

    // Leaks detected
    return (
      <>
        <div className={styles.leaksGroupHeaderRow}>
          <FiAlertTriangle className={styles.titleAlertWarningIcon} size={18} />
          <h3 className={styles.leaksMainLabelTitle}>Money leaks to fix ({safeWarnings.length})</h3>
        </div>

        <div className={styles.warningsCardLayoutGrid}>
          {safeWarnings.map((warning, index) => {
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