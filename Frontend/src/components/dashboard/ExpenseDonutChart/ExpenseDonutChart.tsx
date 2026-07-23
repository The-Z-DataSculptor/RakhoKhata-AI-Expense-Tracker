// src/components/dashboard/ExpenseDonutChart/ExpenseDonutChart.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useCurrency } from '@/app/(dashboard)/context/CurrencyContext';
import { CategoryBreakdownItem } from '@/utils/dashboardHelpers';
import styles from './ExpenseDonutChart.module.css';
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface ExpenseDonutChartProps {
  data: CategoryBreakdownItem[];
  sourceCurrency: string;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: MAIN COMPONENT RENDER ===
   ========================================================================== */
export default React.memo(function ExpenseDonutChart({ data, sourceCurrency }: ExpenseDonutChartProps) {
  const { formatAmount } = useCurrency();

  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return (
      <div className={styles.focusCardContainer}>
        <div className={styles.focusCardHeader}>
          <h3>Where Your Money Goes</h3>
          <p>See how your expenses are distributed across different categories.</p>
        </div>
        <div className={styles.emptyStateContainer}>
          <p className={styles.emptyStateText}>Add some expenses to see your spending breakdown.</p>
        </div>
      </div>
    );
  }

  const activeTotalOutflow = safeData.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const handlePieSegmentHoverEnter = (_: unknown, index: number) => {
    setActiveHoverIndex(index);
  };

  const handlePieSegmentHoverLeave = () => {
    setActiveHoverIndex(null);
  };

  let dynamicDisplayLabel = "Total Spending";
  let dynamicDisplayValue = activeTotalOutflow;
  let dynamicDisplayPercentage = "100";

  // WHY THIS FIX WAS MADE: Verifies that the hovered index actually exists in safeData
  // to avoid reading properties of undefined if data length changes dynamically.
  if (activeHoverIndex !== null && activeHoverIndex < safeData.length && safeData[activeHoverIndex]) {
    const hoveredItem = safeData[activeHoverIndex];
    dynamicDisplayLabel = hoveredItem.name || "Category";
    dynamicDisplayValue = Number(hoveredItem.value) || 0;
    const percent = activeTotalOutflow > 0 ? (dynamicDisplayValue / activeTotalOutflow) * 100 : 0;
    dynamicDisplayPercentage = percent.toFixed(0);
  }

  return (
    <div className={styles.focusCardContainer}>
      <div className={styles.focusCardHeader}>
        <h3>Where Your Money Goes</h3>
        <p>Your spending broken down by category – hover any slice to see details.</p>
      </div>

      <div className={styles.focusCardBody}>

        <div className={styles.chartViewportWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={safeData}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={88}
                dataKey="value"
                onMouseEnter={handlePieSegmentHoverEnter}
                onMouseLeave={handlePieSegmentHoverLeave}
                stroke="var(--bg-surface)"
                strokeWidth={3}
              >
                {safeData.map((entry, index) => (
                  <Cell
                    key={`slice-${index}-${entry.name || 'cat'}`}
                    fill={entry.color || "var(--color-primary)"}
                    style={{
                      cursor: 'pointer',
                      filter: activeHoverIndex !== null && activeHoverIndex !== index
                        ? 'brightness(0.6) grayscale(0.2)'
                        : 'none',
                      transition: 'filter var(--transition-fast)'
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className={styles.centerHoleMetricsDisplay}>
            <span className={styles.centerMetaLabel}>{dynamicDisplayLabel}</span>
            <span className={styles.centerMainValue}>
              {formatAmount(dynamicDisplayValue, sourceCurrency)}
            </span>
            <span className={styles.centerPercentageIndicator}>
              {dynamicDisplayPercentage}%
            </span>
          </div>
        </div>

        <div className={styles.customLegendPanel}>
          <ul className={styles.legendListContainer}>
            {safeData.map((category, index) => {
              const val = Number(category.value) || 0;
              const percentage = activeTotalOutflow > 0
                ? ((val / activeTotalOutflow) * 100).toFixed(0)
                : "0";
              const isActive = activeHoverIndex === index;

              return (
                <li
                  key={`legend-${index}-${category.name || 'cat'}`}
                  className={`${styles.legendListItem} ${isActive ? styles.activeLegendRow : ''}`}
                  onMouseEnter={() => setActiveHoverIndex(index)}
                  onMouseLeave={handlePieSegmentHoverLeave}
                >
                  <div className={styles.legendLeftContent}>
                    <span
                      className={styles.colorIdentityBadge}
                      style={{ backgroundColor: category.color || "var(--color-primary)" }}
                    />
                    <span className={styles.categoryNameText}>{category.name || "Unassigned"}</span>
                  </div>
                  <div className={styles.legendRightContent}>
                    <span className={styles.absoluteCurrencyText}>
                      {formatAmount(val, sourceCurrency)}
                    </span>
                    <span className={styles.percentageSplitText}>{percentage}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
});
/* === SECTION 3 END === */