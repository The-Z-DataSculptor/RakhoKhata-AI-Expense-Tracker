// src/components/dashboard/MetricRow/MetricRow.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import MetricCard, { MetricItem } from "@/components/dashboard/MetricCard/MetricCard";
import styles from "./MetricRow.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface MetricRowProps {
  metrics: {
    totalIncome: number;
    fixedExpenses: number;
    flexibleExpenses: number;
    safeToSpend: number;
    projected?: {
      totalIncome: number;
      fixedExpenses: number;
      flexibleExpenses: number;
      safeToSpend: number;
    };
  };
  periodLabel: string;
  activePeriod: TimePeriod;
  sourceCurrency: string;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & RENDER ===
   ========================================================================== */
export default function MetricRow({ metrics, periodLabel, activePeriod, sourceCurrency }: MetricRowProps) {
  
  // WHY THIS FIX WAS MADE: Defensively handles null/undefined metrics or projected objects
  // to avoid unhandled TypeError property access crashes.
  const safeMetrics = metrics || {
    totalIncome: 0,
    fixedExpenses: 0,
    flexibleExpenses: 0,
    safeToSpend: 0,
  };

  const safeProjected = safeMetrics.projected || {
    totalIncome: 0,
    fixedExpenses: 0,
    flexibleExpenses: 0,
    safeToSpend: 0,
  };

  const getBillsTitle = () => {
    switch (activePeriod) {
      case "7d": return "This Week's Bills";
      case "14d": return "Half-Month Bills";
      case "30d": return "This Month's Bills";
      default: return "All Time Bills";
    }
  };

  const getIncomeTitle = () => {
    switch (activePeriod) {
      case "7d": return "This Week's Income";
      case "14d": return "Half-Month Income";
      case "30d": return "This Month's Income";
      default: return "Total Income";
    }
  };

  const getExpenseTitle = () => {
    switch (activePeriod) {
      case "7d": return "This Week's Spending";
      case "14d": return "Half-Month Spending";
      case "30d": return "This Month's Spending";
      default: return "Total Spending";
    }
  };

  const getSafeTitle = () => {
    switch (activePeriod) {
      case "7d": return "This Week's Safe Amount";
      case "14d": return "Half-Month Safe Amount";
      case "30d": return "This Month's Safe Amount";
      default: return "Total Safe Amount";
    }
  };

  const financialMetricsCollection: MetricItem[] = [
    {
      title: getBillsTitle(),
      value: Number(safeMetrics.fixedExpenses) || 0,
      subtext: `Fixed costs ${periodLabel || 'overall'}`,
      iconType: "bill",
      projectedValue: Number(safeProjected.fixedExpenses) || 0,
    },
    {
      title: getIncomeTitle(),
      value: Number(safeMetrics.totalIncome) || 0,
      subtext: `Income ${periodLabel || 'overall'}`,
      iconType: "inflow",
      projectedValue: Number(safeProjected.totalIncome) || 0,
    },
    {
      title: getExpenseTitle(),
      value: Number(safeMetrics.flexibleExpenses) || 0,
      subtext: `Flexible spending ${periodLabel || 'overall'}`,
      iconType: "outflow",
      projectedValue: Number(safeProjected.flexibleExpenses) || 0,
    },
    {
      title: getSafeTitle(),
      value: Number(safeMetrics.safeToSpend) || 0,
      subtext: activePeriod === "all" ? "Remaining overall" : `Remaining ${periodLabel || 'overall'}`,
      iconType: "safe",
      projectedValue: Number(safeProjected.safeToSpend) || 0,
    },
  ];

  return (
    <div className={styles.rowGridContainer}>
      <MetricCard metrics={financialMetricsCollection} sourceCurrency={sourceCurrency} />
    </div>
  );
}
/* === SECTION 3 END === */