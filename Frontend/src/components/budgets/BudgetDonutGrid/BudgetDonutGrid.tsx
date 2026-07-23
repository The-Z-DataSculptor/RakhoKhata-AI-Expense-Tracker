// src/components/budgets/BudgetDonutGrid/BudgetDonutGrid.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & CONSTANTS ===
   ========================================================================== */
import React from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import styles from "./BudgetDonutGrid.module.css";

// WHY THIS FIX WAS MADE: Hoisting static geometry calculations outside the component prevents
// redundant recalculations on every render cycle, optimizing rendering performance.
const DONUT_RADIUS = 36;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface BudgetItem {
  id: string;
  categoryName: string;
  spentAmount: number; // in workspace's original currency
  limitAmount: number; // in workspace's original currency
  startDate: string;
  endDate: string;
}

interface BudgetDonutGridProps {
  items?: BudgetItem[];
  onEditClick?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
  isLoading?: boolean;
  sourceCurrency: string;
}

type BudgetStatusLevel = "DANGER" | "WARNING" | "SUCCESS";
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PURE HELPERS ===
   ========================================================================== */
// WHY THIS FIX WAS MADE: Consolidates budget status checks into a single pure function
// that defensively guards against division-by-zero and NaN usage ratios.
const calculateBudgetStatus = (spent: number, limit: number): BudgetStatusLevel => {
  if (limit <= 0 || isNaN(limit) || isNaN(spent)) {
    return "SUCCESS";
  }
  const usageRatio = spent / limit;
  if (usageRatio >= 1.0) return "DANGER";
  if (usageRatio >= 0.8) return "WARNING";
  return "SUCCESS";
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: COMPONENT LOGIC & RENDER ===
   ========================================================================== */
export function BudgetDonutGrid({ 
  items = [], 
  onEditClick, 
  onDeleteClick,
  isLoading = false,
  sourceCurrency,
}: BudgetDonutGridProps) {
  const { formatAmount } = useCurrency();

  // WHY THIS FIX WAS MADE: Defensive array check prevents application runtime crashes
  // if null or non-array props are passed into items.
  const safeItems = Array.isArray(items) ? items : [];

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.gridContainer} role="status" aria-live="polite">
        <div className={styles.loadingState}>
          <p>Loading your budgets...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (safeItems.length === 0) {
    return (
      <div className={styles.gridContainer} role="status" aria-live="polite">
        <div className={styles.emptyState}>
          <p>No budgets created yet.</p>
          <p className={styles.emptySubtext}>Create your first budget to start tracking your spending limits.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridContainer}>
      {safeItems.map((budget, index) => {
        const safeSpent = Number(budget.spentAmount) || 0;
        const safeLimit = Number(budget.limitAmount) || 0;
        
        // WHY THIS FIX WAS MADE: Guards percentage math against zero limits and clamps bounded percentage
        // between 0% and 100% to guarantee proper SVG progress ring offset calculation.
        const rawPercent = safeLimit > 0 ? (safeSpent / safeLimit) * 100 : 0;
        const boundedPercent = Math.min(Math.max(0, rawPercent), 100);
        const displayPercent = isNaN(rawPercent) ? "0" : rawPercent.toFixed(0);

        const strokeDashoffset = DONUT_CIRCUMFERENCE - (boundedPercent / 100) * DONUT_CIRCUMFERENCE;
        
        const statusLevel = calculateBudgetStatus(safeSpent, safeLimit);

        const statusColorClass = 
          statusLevel === "DANGER" 
            ? styles.colorDanger 
            : statusLevel === "WARNING" 
              ? styles.colorWarning 
              : styles.colorSuccess;

        const badgeColorClass = 
          statusLevel === "DANGER" 
            ? styles.badgeDanger 
            : statusLevel === "WARNING" 
              ? styles.badgeWarning 
              : styles.badgeSuccess;

        const remainingCash = safeLimit - safeSpent;
        const isOverBudget = remainingCash < 0;

        // WHY THIS FIX WAS MADE: Uses a composite key fallback to prevent React key collision errors
        // if budget.id is missing or unpopulated.
        const uniqueKey = budget.id || `budget-card-${index}`;

        return (
          <div key={uniqueKey} className={styles.donutCard}>
            
            {/* TOP LINE: CATEGORY TITLES, DATES, STATUS PILL, & ACTIONS */}
            <div className={styles.cardHeaderTop}>
              <div className={styles.titleAndDateMeta}>
                <h3 className={styles.categoryTitle} title={budget.categoryName || "Untitled Category"}>
                  {budget.categoryName || "Untitled Category"}
                </h3>
                <span className={styles.durationTimelineSpan}>
                  🗓️ {budget.startDate || "N/A"} – {budget.endDate || "N/A"}
                </span>
              </div>

              <div className={styles.headerActions}>
                <span className={`${styles.statusBadge} ${badgeColorClass}`}>
                  {isOverBudget ? "Over Limit" : "On Track"}
                </span>
                
                <div className={styles.actionIconGroup}>
                  <button 
                    type="button"
                    className={styles.iconBtn} 
                    onClick={() => onEditClick?.(budget.id)}
                    title="Edit Budget"
                    aria-label={`Edit ${budget.categoryName || "budget"} limit`}
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button 
                    type="button"
                    className={`${styles.iconBtn} ${styles.deleteBtn}`} 
                    onClick={() => onDeleteClick?.(budget.id)}
                    title="Delete Budget"
                    aria-label={`Delete ${budget.categoryName || "budget"} limit`}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* MIDDLE ROW: DONUT RING SIDE-BY-SIDE WITH ACCENT METRICS */}
            <div className={styles.cardMainSection}>
              
              {/* CIRCULAR GEOMETRY FRAME */}
              <div className={styles.visualDonutSide}>
                <div className={styles.svgWrapperRelative}>
                  <svg className={styles.donutSvgObject} viewBox="0 0 80 80" aria-hidden="true">
                    <circle className={styles.donutTrackCircleLayer} cx="40" cy="40" r={DONUT_RADIUS} />
                    <circle
                      className={`${styles.donutProgressCircleLayer} ${statusColorClass}`}
                      cx="40"
                      cy="40"
                      r={DONUT_RADIUS}
                      strokeDasharray={DONUT_CIRCUMFERENCE}
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <div className={styles.centerPercentageLabel}>
                    <span className={`${styles.percentNumberText} ${statusColorClass}`}>
                      {displayPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* CORE EDITORIAL NUMBERS DISPLAY */}
              <div className={styles.textDetailsSide}>
                <div className={styles.spentGroup}>
                  <span className={styles.metaLabelHeader}>Total Spent</span>
                  <p className={styles.bigBoldAmount}>
                    {formatAmount(safeSpent, sourceCurrency)}
                  </p>
                </div>

                <div className={styles.limitGroup}>
                  <span className={styles.metaLabelHeader}>Budget Limit</span>
                  <p className={styles.subAmountLabel}>
                    {formatAmount(safeLimit, sourceCurrency)}
                  </p>
                </div>
              </div>

            </div>

            {/* CARD BOTTOM SUMMARY OVERLAY */}
            <div className={styles.cardFooterNoticeLine}>
              <span className={styles.remainingContextLabel}>Available funds</span>
              {isOverBudget ? (
                <span className={styles.dangerNoticeText}>
                  -{formatAmount(Math.abs(remainingCash), sourceCurrency)}
                </span>
              ) : (
                <span className={styles.successNoticeText}>
                  +{formatAmount(remainingCash, sourceCurrency)}
                </span>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
/* === SECTION 4 END === */