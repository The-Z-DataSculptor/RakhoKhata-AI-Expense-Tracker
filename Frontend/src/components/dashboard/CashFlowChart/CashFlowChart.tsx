// src/components/dashboard/CashFlowChart/CashFlowChart.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useCurrency } from '@/app/(dashboard)/context/CurrencyContext';
import { CashFlowDataPoint } from '@/utils/dashboardHelpers';
import styles from './CashFlowChart.module.css';
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface CashFlowChartProps {
  data: CashFlowDataPoint[];
  sourceCurrency: string;   // <-- NEW
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
  }>;
  label?: string;
  formatAmount: (amount: number, sourceCurrency?: string) => string;
  sourceCurrency: string;   // <-- NEW
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
const CustomChartTooltip = ({ active, payload, label, formatAmount, sourceCurrency }: CustomTooltipProps) => {
  if (!active || !payload || payload.length < 2) {
    return null;
  }

  const incomeValue = payload[0]?.value || 0;
  const expenseValue = payload[1]?.value || 0;
  const netSavings = incomeValue - expenseValue;
  const isProfitable = netSavings >= 0;

  return (
    <div className={styles.customTooltip}>
      <p className={styles.tooltipLabel}>{label}</p>

      <div className={styles.tooltipItem} style={{ color: 'var(--color-success)' }}>
        <span>Income:</span>
        <strong>{formatAmount(incomeValue, sourceCurrency)}</strong>
      </div>

      <div className={styles.tooltipItem} style={{ color: 'var(--color-danger)' }}>
        <span>Expenses:</span>
        <strong>{formatAmount(expenseValue, sourceCurrency)}</strong>
      </div>

      <div
        className={`${styles.tooltipItem} ${styles.netSavings}`}
        style={{ color: isProfitable ? 'var(--color-info)' : 'var(--color-warning)' }}
      >
        <span>Net Result:</span>
        <strong>{formatAmount(netSavings, sourceCurrency)}</strong>
      </div>
    </div>
  );
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
export default function CashFlowChart({ data, sourceCurrency }: CashFlowChartProps) {
  const { formatAmount } = useCurrency();

  if (!data || data.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <div className={styles.titleGroup}>
            <h3>Cash Flow Overview</h3>
            <p>Track your income and expenses over time.</p>
          </div>
        </div>
        <div className={styles.emptyStateContainer}>
          <p className={styles.emptyStateText}>Add transactions to see your cash flow pattern.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>

      <div className={styles.chartHeader}>
        <div className={styles.titleGroup}>
          <h3>Cash Flow Overview</h3>
          <p>See how your income and expenses compare over time.</p>
        </div>
      </div>

      <div className={styles.responsiveWrapperContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--border-color)"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              stroke="var(--text-muted)"
              tickLine={false}
              dy={10}
              style={{ fontSize: '12px', fontFamily: 'var(--font-navbar)' }}
            />

            <YAxis
              stroke="var(--text-muted)"
              tickLine={false}
              dx={-5}
              width={85}
              style={{ fontSize: '12px', fontFamily: 'var(--font-navbar)' }}
              tickFormatter={(value) => formatAmount(value, sourceCurrency)}
            />

            <Tooltip
              content={<CustomChartTooltip formatAmount={formatAmount} sourceCurrency={sourceCurrency} />}
              cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '13px', fontFamily: 'var(--font-navbar)' }}
            />

            <Area
              type="monotone"
              name="Income"
              dataKey="Income"
              stroke="var(--color-success)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#successGradient)"
            />

            <Area
              type="monotone"
              name="Expenses"
              dataKey="Expenses"
              stroke="var(--color-danger)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#dangerGradient)"
            />

          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}