// src/components/dashboard/ExpenseDonutChart/ExpenseDonutChart.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
"use client";

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TimePeriod } from '@/components/dashboard/TimeSwitcher/TimeSwitcher';
import styles from './ExpenseDonutChart.module.css';
/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface ExpenseCategoryPoint {
  name: string;
  value: number;
  color: string;
}

interface ExpenseDonutChartProps {
  activePeriod: TimePeriod;
}
/* === SECTION 2 END === */


/* ==========================================================================
   === SECTION 3: DATA STRUCTURES & LOGIC ===
   ========================================================================== */
const categoryPeriodDataMap: Record<TimePeriod, ExpenseCategoryPoint[]> = {
  "7d": [
    { name: 'Online Shopping', value: 240, color: 'var(--color-danger)' },
    { name: 'Fixed Utilities', value: 150, color: 'var(--color-primary)' },
    { name: 'Living & Groceries', value: 180, color: 'var(--color-success)' },
    { name: 'Software Subs', value: 45, color: 'var(--color-info)' },
    { name: 'Entertainment', value: 90, color: 'var(--color-warning)' },
  ],
  "14d": [
    { name: 'Online Shopping', value: 520, color: 'var(--color-danger)' },
    { name: 'Fixed Utilities', value: 310, color: 'var(--color-primary)' },
    { name: 'Living & Groceries', value: 420, color: 'var(--color-success)' },
    { name: 'Software Subs', value: 115, color: 'var(--color-info)' },
    { name: 'Entertainment', value: 160, color: 'var(--color-warning)' },
  ],
  "30d": [
    { name: 'Online Shopping', value: 1140, color: 'var(--color-danger)' },
    { name: 'Fixed Utilities', value: 950, color: 'var(--color-primary)' },
    { name: 'Living & Groceries', value: 760, color: 'var(--color-success)' },
    { name: 'Software Subs', value: 570, color: 'var(--color-info)' },
    { name: 'Entertainment', value: 380, color: 'var(--color-warning)' },
  ],
  "all": [
    { name: 'Online Shopping', value: 6400, color: 'var(--color-danger)' },
    { name: 'Fixed Utilities', value: 5700, color: 'var(--color-primary)' },
    { name: 'Living & Groceries', value: 4300, color: 'var(--color-success)' },
    { name: 'Software Subs', value: 2900, color: 'var(--color-info)' },
    { name: 'Entertainment', value: 1200, color: 'var(--color-warning)' },
  ]
};

/* === SECTION 3: DATA STRUCTURES & LOGIC ===
   ========================================================================== */
/* === SECTION 3 END === */


/* ==========================================================================
   === SECTION 4: MAIN COMPONENT RENDER ===
   ========================================================================== */
export default React.memo(function ExpenseDonutChart({ activePeriod }: ExpenseDonutChartProps) {
  // State to track which slice is currently hovered
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  // Get the data for the currently selected time period
  const currentExpenseData = categoryPeriodDataMap[activePeriod] || categoryPeriodDataMap["30d"];

  // Calculate total spending for the current period
  const activeTotalOutflow = currentExpenseData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // Handlers for pie slice hover events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePieSegmentHoverEnter = (_: any, index: number) => {
    setActiveHoverIndex(index);
  };

  const handlePieSegmentHoverLeave = () => {
    setActiveHoverIndex(null);
  };

  // Determine what to display in the center of the donut
  let dynamicDisplayLabel = "Total Outflow";
  let dynamicDisplayValue = activeTotalOutflow;
  let dynamicDisplayPercentage = "100";

  if (activeHoverIndex !== null && currentExpenseData[activeHoverIndex]) {
    const hoveredItem = currentExpenseData[activeHoverIndex];
    dynamicDisplayLabel = hoveredItem.name;
    dynamicDisplayValue = hoveredItem.value;
    const percent = (hoveredItem.value / activeTotalOutflow) * 100;
    dynamicDisplayPercentage = percent.toFixed(0);
  }

  return (
    <div className={styles.focusCardContainer}>
      {/* Header Section */}
      <div className={styles.focusCardHeader}>
        <h3>Outflow Structure</h3>
        <p>Granular categorical context explaining where active funds are deployed.</p>
      </div>

      {/* Main Content Area */}
      <div className={styles.focusCardBody}>

        {/* Left Side: Donut Chart */}
        <div className={styles.chartViewportWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentExpenseData}
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
                {currentExpenseData.map((entry, index) => (
                  <Cell
                    key={`slice-${index}`}
                    fill={entry.color}
                    style={{
                      cursor: 'pointer',
                      // Dim other slices when one is hovered
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

          {/* Center Text Overlay */}
          <div className={styles.centerHoleMetricsDisplay}>
            <span className={styles.centerMetaLabel}>{dynamicDisplayLabel}</span>
            <span className={styles.centerMainValue}>
              ${dynamicDisplayValue.toLocaleString()}
            </span>
            <span className={styles.centerPercentageIndicator}>
              {dynamicDisplayPercentage}%
            </span>
          </div>
        </div>

        {/* Right Side: Legend List */}
        <div className={styles.customLegendPanel}>
          <ul className={styles.legendListContainer}>
            {currentExpenseData.map((category, index) => {
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
                      ${category.value.toLocaleString()}
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
/* === SECTION 4 END === */