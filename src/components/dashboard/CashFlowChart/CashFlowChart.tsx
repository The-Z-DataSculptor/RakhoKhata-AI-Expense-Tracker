// src/components/dashboard/CashFlowChart/CashFlowChart.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS START ===
   ========================================================================== */
"use client"; // WHY: Tells Next.js App Router that this component executes entirely in the browser environment since Recharts utilizes client-side SVG rendering nodes.

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
import styles from './CashFlowChart.module.css';
/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: DATA STRUCTURES & INTERFACES START ===
   ========================================================================== */
interface ChartDataPoint {
  label: string;
  Income: number;
  Expenses: number;
}

// WHY: Custom interface mapping the exact props cascade incoming from the parent layout stage.
interface CashFlowChartProps {
  activePeriod: TimePeriod;
}

// WHY: Explicit type definitions for the custom Recharts tooltip parameters to satisfy strict TypeScript rules.
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
  }>;
  label?: string;
}

// WHY: Segmented map structure containing distinct historical metrics tailored to match every selectable dashboard timeline state toggle.
const cashFlowPeriodDataMap: Record<TimePeriod, ChartDataPoint[]> = {
  "7d": [
    { label: 'Mon', Income: 800, Expenses: 400 },
    { label: 'Tue', Income: 950, Expenses: 600 },
    { label: 'Wed', Income: 700, Expenses: 850 },
    { label: 'Thu', Income: 1200, Expenses: 500 },
    { label: 'Fri', Income: 1100, Expenses: 700 },
    { label: 'Sat', Income: 600, Expenses: 300 },
    { label: 'Sun', Income: 900, Expenses: 450 },
  ],
  "14d": [
    { label: 'Wk 1 Mon', Income: 2100, Expenses: 1400 },
    { label: 'Wk 1 Thu', Income: 2400, Expenses: 1800 },
    { label: 'Wk 2 Mon', Income: 2800, Expenses: 1900 },
    { label: 'Wk 2 Thu', Income: 3100, Expenses: 2200 },
  ],
  "30d": [
    { label: 'Days 1-5', Income: 3200, Expenses: 2100 },
    { label: 'Days 6-10', Income: 4100, Expenses: 2900 },
    { label: 'Days 11-15', Income: 3800, Expenses: 4300 },
    { label: 'Days 16-20', Income: 4900, Expenses: 3100 },
    { label: 'Days 21-25', Income: 5200, Expenses: 3400 },
    { label: 'Days 26-30', Income: 6100, Expenses: 3800 },
  ],
  "all": [
    { label: 'Jan', Income: 4200, Expenses: 2800 },
    { label: 'Feb', Income: 4900, Expenses: 3100 },
    { label: 'Mar', Income: 4600, Expenses: 4100 },
    { label: 'Apr', Income: 5800, Expenses: 3400 },
    { label: 'May', Income: 6100, Expenses: 3200 },
    { label: 'Jun', Income: 6800, Expenses: 3900 },
  ]
};
/* === SECTION 2 END === */


/* ==========================================================================
   === SECTION 3: SUB-COMPONENTS START ===
   ========================================================================== */
/**
 * WHY: Recharts custom component that displays a formatted floating info box over 
 * the interactive layer, styled to respect the global light/dark theme variables.
 */
const CustomChartTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  // WHY: Verify that the tooltip is active and contains a payload array before pulling values.
  if (active && payload && payload.length >= 2) {
    
    // WHY: Using optional chaining (?.) and structural fallbacks (|| 0) stops runtime null-pointer exceptions instantly.
    const incomeValue = payload[0]?.value || 0;
    const expenseValue = payload[1]?.value || 0;
    
    const netSavings = incomeValue - expenseValue;
    const isProfitable = netSavings >= 0;

    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        
        <div className={styles.tooltipItem} style={{ color: 'var(--color-success)' }}>
          <span>Inflow:</span>
          <strong>${incomeValue.toLocaleString()}</strong>
        </div>
        
        <div className={styles.tooltipItem} style={{ color: 'var(--color-danger)' }}>
          <span>Outflow:</span>
          <strong>${expenseValue.toLocaleString()}</strong>
        </div>
        
        <div 
          className={`${styles.tooltipItem} ${styles.netSavings}`}
          style={{ color: isProfitable ? 'var(--color-info)' : 'var(--color-warning)' }}
        >
          <span>Net Cushion:</span>
          <strong>${netSavings.toLocaleString()}</strong>
        </div>
      </div>
    );
  }
  
  return null;
};
/* === SECTION 3 END === */


/* ==========================================================================
   === SECTION 4: MAIN RENDER LAYOUT START ===
   ========================================================================== */
export default function CashFlowChart({ activePeriod }: CashFlowChartProps) {
  // WHY: Read matching period datasets safely using fallback default metrics array assignments to maximize code stability.
  const visualChartData = cashFlowPeriodDataMap[activePeriod] || cashFlowPeriodDataMap["30d"];

  return (
    <div className={styles.chartContainer}>
      
      {/* Header Info Block */}
      <div className={styles.chartHeader}>
        <div className={styles.titleGroup}>
          <h3>Cash Flow Dynamics</h3>
          <p>Real-time visual monitoring of absolute revenue versus operational expenditure margins.</p>
        </div>
      </div>

      {/* Interactive Graphic Workspace */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={visualChartData} 
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            {/* WHY: SVG Gradients mapping dynamically to local design tokens. 
              Using global CSS opacity filters preserves theme compatibility across light and dark variables.
            */}
            <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.00}/>
            </linearGradient>
            <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0.00}/>
            </linearGradient>
          </defs>

          {/* Background Structural Grid */}
          <CartesianGrid 
            strokeDasharray="4 4" 
            stroke="var(--border-color)" 
            vertical={false} 
          />

          {/* Axis Trackers */}
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
            style={{ fontSize: '12px', fontFamily: 'var(--font-navbar)' }}
            tickFormatter={(value) => `$${value}`}
          />

          {/* Interactive Tooltip Configuration */}
          <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }} />
          
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px', fontSize: '13px', fontFamily: 'var(--font-navbar)' }}
          />

          {/* Area Layer 1: Income Stream */}
          <Area 
            type="monotone" 
            name="Total Income"
            dataKey="Income" 
            stroke="var(--color-success)" 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#successGradient)" 
          />

          {/* Area Layer 2: Expense Stream */}
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
  );
}
/* === SECTION 4 END === */