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
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: MAIN COMPONENT RENDER ===
   ========================================================================== */
export default React.memo(function ExpenseDonutChart({ data }: ExpenseDonutChartProps) {
  const { formatAmount } = useCurrency();

  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
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

  const activeTotalOutflow = data.reduce((sum, item) => sum + item.value, 0);

  const handlePieSegmentHoverEnter = (_: unknown, index: number) => {
    setActiveHoverIndex(index);
  };

  const handlePieSegmentHoverLeave = () => {
    setActiveHoverIndex(null);
  };

  let dynamicDisplayLabel = "Total Spending";
  let dynamicDisplayValue = activeTotalOutflow;
  let dynamicDisplayPercentage = "100";

  if (activeHoverIndex !== null && data[activeHoverIndex]) {
    const hoveredItem = data[activeHoverIndex];
    dynamicDisplayLabel = hoveredItem.name;
    dynamicDisplayValue = hoveredItem.value;
    const percent = activeTotalOutflow > 0 ? (hoveredItem.value / activeTotalOutflow) * 100 : 0;
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
                data={data}
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
                {data.map((entry, index) => (
                  <Cell
                    key={`slice-${index}`}
                    fill={entry.color}
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
              {/* 👇 FIXED: Explicitly tell formatAmount the value is in USD */}
              {formatAmount(dynamicDisplayValue, "USD")}
            </span>
            <span className={styles.centerPercentageIndicator}>
              {dynamicDisplayPercentage}%
            </span>
          </div>
        </div>

        <div className={styles.customLegendPanel}>
          <ul className={styles.legendListContainer}>
            {data.map((category, index) => {
              const percentage = activeTotalOutflow > 0
                ? ((category.value / activeTotalOutflow) * 100).toFixed(0)
                : "0";
              const isActive = activeHoverIndex === index;

              return (
                <li
                  key={`legend-${index}`}
                  className={`${styles.legendListItem} ${isActive ? styles.activeLegendRow : ''}`}
                  onMouseEnter={() => setActiveHoverIndex(index)}
                  onMouseLeave={handlePieSegmentHoverLeave}
                >
                  <div className={styles.legendLeftContent}>
                    <span
                      className={styles.colorIdentityBadge}
                      style={{ backgroundColor: category.color }}
                    />
                    <span className={styles.categoryNameText}>{category.name}</span>
                  </div>
                  <div className={styles.legendRightContent}>
                    <span className={styles.absoluteCurrencyText}>
                      {/* 👇 FIXED: Explicitly tell formatAmount the value is in USD */}
                      {formatAmount(category.value, "USD")}
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