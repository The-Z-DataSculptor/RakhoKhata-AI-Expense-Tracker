/* ==========================================================================
   === FILEPATH: src/components/dashboard/MetricRow/MetricRow.tsx ===
   ========================================================================== */

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
  
  // Real or placeholder mock data allocations
  const mockData = {
    billsTotal: "Rs. 42,000",
    inflowTotal: "Rs. 125,000",
    outflowTotal: "Rs. 38,500",
    safeToSpend: "Rs. 44,500" 
  };

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
      title: billsTitle, // FIXED: Now dynamically alters title based on state
      value: mockData.billsTotal,
      subtext: `Total bills to pay ${periodLabel}`,
      iconType: "bill",
    },
    {
      title: "Total Income",
      value: mockData.inflowTotal,
      subtext: `Money that came in ${periodLabel}`,
      iconType: "inflow",
    },
    {
      title: "Daily Expenses",
      value: mockData.outflowTotal,
      subtext: `Day-to-day spending ${periodLabel}`,
      iconType: "outflow",
    },
    {
      title: "Safe To Spend",
      value: mockData.safeToSpend,
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