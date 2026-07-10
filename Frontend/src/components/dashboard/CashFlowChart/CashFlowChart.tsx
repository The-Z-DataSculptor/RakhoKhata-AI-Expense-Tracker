// src/components/dashboard/CashFlowChart/CashFlowChart.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
"use client"; // WHY: Recharts requires client-side rendering for SVG canvas support

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
import { TimePeriod } from '@/components/dashboard/TimeSwitcher/TimeSwitcher';
import { useCurrency } from '@/app/(dashboard)/context/CurrencyContext';
import styles from './CashFlowChart.module.css';
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface ChartDataPoint {
  label: string;
  Income: number;
  Expenses: number;
}

interface CashFlowChartProps {
  activePeriod: TimePeriod;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
  }>;
  label?: string;
  formatAmount: (amount: number, source?: "USD") => string;
}

// WHY: Scaled down base USD numbers to prevent large regional currencies (like PKR) 
// from overflowing and breaking out of visual dashboard containers.
const cashFlowPeriodDataMap: Record<TimePeriod, ChartDataPoint[]> = {
  "7d": [
    { label: 'Mon', Income: 80, Expenses: 40 },
    { label: 'Tue', Income: 95, Expenses: 60 },
    { label: 'Wed', Income: 70, Expenses: 85 },
    { label: 'Thu', Income: 120, Expenses: 50 },
    { label: 'Fri', Income: 110, Expenses: 70 },
    { label: 'Sat', Income: 60, Expenses: 30 },
    { label: 'Sun', Income: 90, Expenses: 45 },
  ],
  "14d": [
    { label: 'Wk 1 Mon', Income: 210, Expenses: 140 },
    { label: 'Wk 1 Thu', Income: 240, Expenses: 180 },
    { label: 'Wk 2 Mon', Income: 280, Expenses: 190 },
    { label: 'Wk 2 Thu', Income: 310, Expenses: 220 },
  ],
  "30d": [
    { label: 'Days 1-5',  Income: 320, Expenses: 210 },
    { label: 'Days 6-10', Income: 410, Expenses: 290 },
    { label: 'Days 11-15', Income: 380, Expenses: 430 },
    { label: 'Days 16-20', Income: 490, Expenses: 310 },
    { label: 'Days 21-25', Income: 520, Expenses: 340 },
    { label: 'Days 26-30', Income: 610, Expenses: 380 },
  ],
  "all": [
    { label: 'Jan', Income: 420, Expenses: 280 },
    { label: 'Feb', Income: 490, Expenses: 310 },
    { label: 'Mar', Income: 460, Expenses: 410 },
    { label: 'Apr', Income: 580, Expenses: 340 },
    { label: 'May', Income: 610, Expenses: 320 },
    { label: 'Jun', Income: 680, Expenses: 390 },
  ]
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
/**
 * CustomChartTooltip
 * WHY: Custom Recharts tooltip that displays formatted converted currency rows
 */
const CustomChartTooltip = ({ active, payload, label, formatAmount }: CustomTooltipProps) => {
  // WHY: Only show tooltip when active and payload contains items
  if (!active || !payload || payload.length < 2) {
    return null;
  }

  // WHY: Read values from the rendering chart dataset array node
  // These numbers are already converted by our parent mapping processing step
  const incomeValue = payload[0]?.value || 0;
  const expenseValue = payload[1]?.value || 0;
 

  const netSavings = incomeValue - expenseValue;
  const isProfitable = netSavings >= 0;

  return (
    <div className={styles.customTooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      
      <div className={styles.tooltipItem} style={{ color: 'var(--color-success)' }}>
        <span>Inflow:</span>
        {/* WHY: Pass source as USD because our mathematical pipeline converts calculations natively */}
        <strong>{formatAmount(incomeValue, "USD")}</strong>
      </div>
      
      <div className={styles.tooltipItem} style={{ color: 'var(--color-danger)' }}>
        <span>Outflow:</span>
        <strong>{formatAmount(expenseValue, "USD")}</strong>
      </div>
      
      <div 
        className={`${styles.tooltipItem} ${styles.netSavings}`}
        style={{ color: isProfitable ? 'var(--color-info)' : 'var(--color-warning)' }}
      >
        <span>Net Cushion:</span>
        <strong>{formatAmount(netSavings, "USD")}</strong>
      </div>
    </div>
  );
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
export default function CashFlowChart({ activePeriod }: CashFlowChartProps) {
  // WHY: Extract math conversion utilities directly from our global navigation context hook channel
  const { currency, formatAmount, convertAmount } = useCurrency();

  // WHY: Get raw chart mock data arrays for selected time selector key fallback
  const rawChartData = cashFlowPeriodDataMap[activePeriod] || cashFlowPeriodDataMap["30d"];

  // FIXED / WHY: Map over raw values to mathematically project data rows to match active system currencies
  const convertedChartData = rawChartData.map((dataPoint) => {
    return {
      label: dataPoint.label,
      // Convert raw mock data values from baseline USD into active dashboard selections
      Income: convertAmount(dataPoint.Income, "USD", currency),
      Expenses: convertAmount(dataPoint.Expenses, "USD", currency),
    };
  });

  return (
    <div className={styles.chartContainer}>
      
      {/* Header Section */}
      <div className={styles.chartHeader}>
        <div className={styles.titleGroup}>
          <h3>Cash Flow Dynamics</h3>
          <p>Real-time visual monitoring of revenue versus operational expenditure.</p>
        </div>
      </div>

      {/* Chart Container */}
      <div className={styles.responsiveWrapperContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={convertedChartData} 
            margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
          >
            {/* SVG Gradients */}
            <defs>
              {/* WHY: Income gradient - uses global --color-success with opacity fade */}
              <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
              </linearGradient>
              
              {/* WHY: Expense gradient - uses global --color-danger with opacity fade */}
              <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Grid Background */}
            <CartesianGrid 
              strokeDasharray="4 4" 
              stroke="var(--border-color)" 
              vertical={false} 
            />

            {/* X-Axis (Labels) */}
            <XAxis 
              dataKey="label" 
              stroke="var(--text-muted)" 
              tickLine={false}
              dy={10}
              style={{ fontSize: '12px', fontFamily: 'var(--font-navbar)' }}
            />

            {/* Y-Axis (Values) */}
            <YAxis 
              stroke="var(--text-muted)" 
              tickLine={false}
              dx={-5}
              width={85} // FIXED: Expanded width spacing gives long regional strings ample margin to display without cutting off
              style={{ fontSize: '12px', fontFamily: 'var(--font-navbar)' }}
              // WHY: Tells formatting pipeline numbers are converted to align layout strings cleanly
              tickFormatter={(value) => formatAmount(value, "USD")}
            />

            {/* Interactive Tooltip */}
            <Tooltip 
              content={<CustomChartTooltip formatAmount={formatAmount} />} 
              cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }} 
            />
            
            {/* Legend */}
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '13px', fontFamily: 'var(--font-navbar)' }}
            />

            {/* Income Area */}
            <Area 
              type="monotone" 
              name="Total Income"
              dataKey="Income" 
              stroke="var(--color-success)" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#successGradient)" 
            />

            {/* Expense Area */}
            <Area 
              type="monotone" 
              name="Total Expenses"
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
/* === SECTION 4 END === */