// src/components/dashboard/MetricRow/MetricRow.tsx
"use client";

import React from "react";
import { TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import MetricCard, { MetricItem } from "@/components/dashboard/MetricCard/MetricCard";
import styles from "./MetricRow.module.css";

interface MetricRowProps {
  metrics: {
    totalIncome: number;
    fixedExpenses: number;
    flexibleExpenses: number;
    safeToSpend: number;
    projected: {
      totalIncome: number;
      fixedExpenses: number;
      flexibleExpenses: number;
      safeToSpend: number;
    };
  };
  periodLabel: string;
  activePeriod: TimePeriod;
}

export default function MetricRow({ metrics, periodLabel, activePeriod }: MetricRowProps) {
  
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
      value: metrics.fixedExpenses,
      subtext: `Fixed costs ${periodLabel}`,
      iconType: "bill",
      projectedValue: metrics.projected.fixedExpenses,
    },
    {
      title: getIncomeTitle(),
      value: metrics.totalIncome,
      subtext: `Income ${periodLabel}`,
      iconType: "inflow",
      projectedValue: metrics.projected.totalIncome,
    },
    {
      title: getExpenseTitle(),
      value: metrics.flexibleExpenses,
      subtext: `Flexible spending ${periodLabel}`,
      iconType: "outflow",
      projectedValue: metrics.projected.flexibleExpenses,
    },
    {
      title: getSafeTitle(),
      value: metrics.safeToSpend,
      subtext: activePeriod === "all" ? "Remaining overall" : `Remaining ${periodLabel}`,
      iconType: "safe",
      projectedValue: metrics.projected.safeToSpend,
    },
  ];

  return (
    <div className={styles.rowGridContainer}>
      <MetricCard metrics={financialMetricsCollection} />
    </div>
  );
}