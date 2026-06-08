// src/app/(dashboard)/dashboard/page.tsx

"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DEPENDENCIES START ===
   ========================================================================== */
import React, { useState } from "react";
import TimeSwitcher, { TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import MetricRow from "@/components/dashboard/MetricRow/MetricRow";
import CashFlowChart from "@/components/dashboard/CashFlowChart/CashFlowChart";
import ExpenseDonutChart from "@/components/dashboard/ExpenseDonutChart/ExpenseDonutChart";
import styles from "./page.module.css";
/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: MAIN COMPONENT RENDER START ===
   ========================================================================== */
export default function DashboardPage() {
  // WHY: Tracks state for dashboard timelines ("7d", "14d", "30d", or "all") 
  // to cascade reactive updates down to underlying data child components.
  const [activeTimeline, setActiveTimeline] = useState<TimePeriod>("30d");

  // WHY: Event handler passed to the switcher to capture calendar timeframe updates
  const handleTimelineChange = (selectedPeriod: TimePeriod) => {
    setActiveTimeline(selectedPeriod);
  };

  return (
    <div className={styles.workspaceWrapper}>
      
      {/* HEADER SECTION: Title and Date Filters */}
      <header className={styles.dashboardHeader}>
        <div className={styles.headingBlock}>
          <h1 className={styles.welcomeHeadline}>Overview Hub</h1>
          <p className={styles.welcomeSubtext}>
            Your financial health at a glance.
          </p>
        </div>

        {/* Date selection buttons toolbar */}
        <TimeSwitcher 
          activePeriod={activeTimeline} 
          onPeriodChange={handleTimelineChange} 
        />
      </header>

      {/* METRIC CARDS GRID (Displays Bills, Income, Expenses, and Safe-to-Spend slots) */}
      <section className={styles.metricsRowStage} aria-label="Quick Summary">
        <MetricRow activePeriod={activeTimeline} />
      </section>

      {/* LOWER ANALYTICS STAGE: Grid Area holding trend graphs and breakdown donuts */}
      <main className={styles.isolatedStage}>
        
        {/* Main Line/Area Trend Component */}
        <div className={styles.chartWrapperNode}>
          <CashFlowChart activePeriod={activeTimeline} />
        </div>
        
        {/* Category Breakdown Donut Component
            FIX / WHY: Bound the activePeriod attribute directly to the activeTimeline state variable
            to enable cascading timeline updates across both data visualizers simultaneously.
        */}
        <div className={styles.chartWrapperNode}>
          <ExpenseDonutChart activePeriod={activeTimeline} />
        </div>

      </main>

    </div>
  );
}
/* === SECTION 2 END === */