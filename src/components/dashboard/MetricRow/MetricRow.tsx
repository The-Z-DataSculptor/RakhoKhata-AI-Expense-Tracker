// src/components/dashboard/MetricRow/MetricRow.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & DEPENDENCIES ===
   ========================================================================== */
import React from "react";
import { TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import MetricCard, { MetricItem } from "@/components/dashboard/MetricCard/MetricCard"; 
import styles from "./MetricRow.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPESCRIPT INTERFACES ===
   ========================================================================== */
interface MetricRowProps {
  activePeriod: TimePeriod;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: MAIN COMPONENT RENDER ===
   ========================================================================== */
export default function MetricRow({ activePeriod }: MetricRowProps) {
  
  // WHY: Converted mock data strings into structured raw base numbers grouped by period.
  // This allows the values to switch with the tabs and pass safely into MetricCard's number parser.
  const periodDataMap: Record<TimePeriod, { bills: number; inflow: number; outflow: number; safe: number }> = {
    "7d": {
      bills: 150,
      inflow: 625,
      outflow: 375,
      safe: 250,
    },
    "14d": {
      bills: 300,
      inflow: 1250,
      outflow: 750,
      safe: 500,
    },
    "30d": {
      bills: 600,
      inflow: 2710,
      outflow: 1960,
      safe: 750,
    },
    "all": {
      bills: 3240,
      inflow: 32400,
      outflow: 21500,
      safe: 10900,
    },
  };

  // Extract the active numbers bundle corresponding to our filter state
  const activeMetrics = periodDataMap[activePeriod] || periodDataMap["7d"];

  // WHY: Converts time codes into readable contextual lowercase snippets to fit our editorial text style.
  const getPeriodLabel = () => {
    if (activePeriod === "7d") return "this week";
    if (activePeriod === "14d") return "for 2 weeks";
    if (activePeriod === "30d") return "this month";
    return "overall till now";
  };

  // FIXED / WHY: Dynamically adjusts the card main heading context so it never conflicts with the timeline subtext label.
  const getBillsTitleLabel = () => {
    if (activePeriod === "7d") return "Weekly Bills";
    if (activePeriod === "14d") return "Bi-Weekly Bills";
    if (activePeriod === "30d") return "Monthly Bills";
    return "Total Bills";
  };

  const periodLabel = getPeriodLabel();
  const billsTitle = getBillsTitleLabel();

  /* THE "WHY" REFACTOR NOTE: 
     Compiling the data into a structured array to pass cleanly into the single Minimalist Typographic Slate canvas component.
  */
  const financialMetricsCollection: MetricItem[] = [
    {
      title: billsTitle, 
      value: activeMetrics.bills, // Pass numeric value safely
      subtext: `Total bills to pay ${periodLabel}`,
      iconType: "bill",
    },
    {
      title: "Total Income",
      value: activeMetrics.inflow, // Pass numeric value safely
      subtext: `Money that came in ${periodLabel}`,
      iconType: "inflow",
    },
    {
      title: "Daily Expenses",
      value: activeMetrics.outflow, // Pass numeric value safely
      subtext: `Day-to-day spending ${periodLabel}`,
      iconType: "outflow",
    },
    {
      title: "Safe To Spend",
      value: activeMetrics.safe, // Pass numeric value safely
      subtext: activePeriod === "all" ? "Total safe money remaining overall" : "Money left over that you can spend safely",
      iconType: "safe",
    },
  ];

  return (
    <div className={styles.rowGridContainer}>
      {/* Passing the collection directly to the Typographic Grid layout wrapper */}
      <MetricCard metrics={financialMetricsCollection} />
    </div>
  );
}
/* === SECTION 3 END === */