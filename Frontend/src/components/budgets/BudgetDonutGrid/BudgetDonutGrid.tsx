// src/components/budgets/BudgetDonutGrid/BudgetDonutGrid.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { FiEdit2, FiTrash2 } from "react-icons/fi"; // NEW: Imported Feather icons for actions
import styles from "./BudgetDonutGrid.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface MockDonutItem {
  id: string;
  categoryName: string;
  spentAmount: number;
  limitAmount: number;
  startDate: string; 
  endDate: string;   
}

interface BudgetDonutGridProps {
  items?: MockDonutItem[];
  // NEW: Exposed handler functions to the parent component
  onEditClick?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function BudgetDonutGrid({ items, onEditClick, onDeleteClick }: BudgetDonutGridProps) {
  const { formatAmount } = useCurrency();

  const fallbackMockItems: MockDonutItem[] = [
    { id: "b1", categoryName: "Marketing Ads", spentAmount: 12000, limitAmount: 30000, startDate: "Jun 01", endDate: "Jun 30" },
    { id: "b2", categoryName: "Cloud Servers", spentAmount: 28500, limitAmount: 30000, startDate: "Jun 01", endDate: "Jun 30" },
    { id: "b3", categoryName: "Office Supplies", spentAmount: 4500, limitAmount: 15000, startDate: "Jun 10", endDate: "Jun 25" },
    { id: "b4", categoryName: "Team Refuel", spentAmount: 16500, limitAmount: 15000, startDate: "Jun 15", endDate: "Jun 22" },
  ];

  const activeBudgets = items || fallbackMockItems;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const getStatusColorClass = (spent: number, limit: number): string => {
    const usageRatio = spent / limit;
    if (usageRatio >= 1.0) return styles.colorDanger;
    if (usageRatio >= 0.8) return styles.colorWarning;
    return styles.colorSuccess;
  };

  const getBadgeColorClass = (spent: number, limit: number): string => {
    const usageRatio = spent / limit;
    if (usageRatio >= 1.0) return styles.badgeDanger;
    if (usageRatio >= 0.8) return styles.badgeWarning;
    return styles.badgeSuccess;
  };

  return (
    /* ==========================================================================
       === SECTION 4: RENDER (JSX) ===
       ========================================================================== */
    <div className={styles.gridContainer}>
      {activeBudgets.map((budget) => {
        const rawPercent = budget.limitAmount > 0 ? (budget.spentAmount / budget.limitAmount) * 100 : 0;
        const boundedPercent = Math.min(rawPercent, 100);
        const displayPercent = rawPercent.toFixed(0);

        const strokeDashoffset = circumference - (boundedPercent / 100) * circumference;
        
        const statusColorClass = getStatusColorClass(budget.spentAmount, budget.limitAmount);
        const badgeColorClass = getBadgeColorClass(budget.spentAmount, budget.limitAmount);
        const remainingCash = budget.limitAmount - budget.spentAmount;
        const isOverBudget = remainingCash < 0;

        return (
          <div key={budget.id} className={styles.donutCard}>
            
            {/* TOP LINE: CATEGORY TITLES, DATES, STATUS PILL, & ACTIONS */}
            <div className={styles.cardHeaderTop}>
              <div className={styles.titleAndDateMeta}>
                <h3 className={styles.categoryTitle}>{budget.categoryName}</h3>
                <span className={styles.durationTimelineSpan}>
                  🗓️ {budget.startDate} – {budget.endDate}
                </span>
              </div>

              {/* NEW: Action Group Cluster */}
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
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button 
                    type="button"
                    className={`${styles.iconBtn} ${styles.deleteBtn}`} 
                    onClick={() => onDeleteClick?.(budget.id)}
                    title="Delete Budget"
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
                  <svg className={styles.donutSvgObject} viewBox="0 0 80 80">
                    <circle className={styles.donutTrackCircleLayer} cx="40" cy="40" r={radius} />
                    <circle
                      className={`${styles.donutProgressCircleLayer} ${statusColorClass}`}
                      cx="40"
                      cy="40"
                      r={radius}
                      strokeDasharray={circumference}
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
                    {formatAmount(budget.spentAmount, "PKR")}
                  </p>
                </div>

                <div className={styles.limitGroup}>
                  <span className={styles.metaLabelHeader}>Target Pool Limit</span>
                  <p className={styles.subAmountLabel}>
                    {formatAmount(budget.limitAmount, "PKR")}
                  </p>
                </div>
              </div>

            </div>

            {/* CARD BOTTOM SUMMARY OVERLAY */}
            <div className={styles.cardFooterNoticeLine}>
              <span className={styles.remainingContextLabel}>Available funds</span>
              {isOverBudget ? (
                <span className={styles.dangerNoticeText}>
                  -{formatAmount(Math.abs(remainingCash), "PKR")}
                </span>
              ) : (
                <span className={styles.successNoticeText}>
                  +{formatAmount(remainingCash, "PKR")}
                </span>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}