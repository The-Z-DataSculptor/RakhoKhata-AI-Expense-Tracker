// src/app/(dashboard)/dashboard/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import TimeSwitcher, { TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import MetricRow from "@/components/dashboard/MetricRow/MetricRow";
import ControlLever from "@/components/dashboard/ControlLever/ControlLever";
import CashFlowChart from "@/components/dashboard/CashFlowChart/CashFlowChart";
import ExpenseDonutChart from "@/components/dashboard/ExpenseDonutChart/ExpenseDonutChart";
import styles from "./page.module.css";

/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
// No props needed for the main layout page component.

/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function DashboardPage() {
  // Keeps track of the active filter time (like 30 days or 7 days)
  const [activeTimeline, setActiveTimeline] = useState<TimePeriod>("30d");

  // Changes the timeframe when a user clicks a switcher button
  const handleTimelineChange = (selectedPeriod: TimePeriod) => {
    setActiveTimeline(selectedPeriod);
  };

  /**
   * STRUCTURED TIME PERIOD DATA MATRIX
   * Mirrored directly from MetricRow to guarantee dashboard balance synchronization.
   * Replace this object with your global state hook/API calls when connecting database records later.
   */
  const periodDataMap: Record<TimePeriod, { bills: number; inflow: number; outflow: number }> = {
    "7d": {
      bills: 150,
      inflow: 625,
      outflow: 375,
    },
    "14d": {
      bills: 300,
      inflow: 1250,
      outflow: 750,
    },
    "30d": {
      bills: 600,
      inflow: 2710,
      outflow: 1960,
    },
    "all": {
      bills: 3240,
      inflow: 32400,
      outflow: 21500,
    },
  };

  // Safely extract the live metrics bundle that corresponds to our active switcher state
  const currentMetrics = periodDataMap[activeTimeline] || periodDataMap["30d"];

  return (
    /* ==========================================================================
       === SECTION 4: RENDER (JSX) ===
       ========================================================================== */
    <div className={styles.workspaceWrapper}>
      
      {/* HEADER SECTION: Welcome text and Time selection buttons */}
      <header className={styles.dashboardHeader}>
        <div className={styles.headingBlock}>
          <h1 className={styles.welcomeHeadline}>Overview Hub</h1>
          <p className={styles.welcomeSubtext}>
            Your financial health at a glance.
          </p>
        </div>

        <TimeSwitcher 
          activePeriod={activeTimeline} 
          onPeriodChange={handleTimelineChange} 
        />
      </header>

      {/* QUICK STATS CARDS GRID */}
      <section className={styles.metricsRowStage} aria-label="Quick Summary">
        <MetricRow activePeriod={activeTimeline} />
      </section>

      {/* VISUAL CONTROL LEVER SPLIT BAR */}
      <section className={styles.gaugeRowStage} aria-label="Spending Control Guide">
        {/* FULLY CONNECTED: Passing dynamic data values and active period state */}
        <ControlLever 
          totalIncome={currentMetrics.inflow}
          fixedExpenses={currentMetrics.bills}
          flexibleExpenses={currentMetrics.outflow}
          activePeriod={activeTimeline}
        />
      </section>

      {/* BOTTOM ANALYTICS GRAPHS STAGE */}
      <main className={styles.isolatedStage}>
        
        {/* Main Line Trend Graph */}
        <div className={styles.chartWrapperNode}>
          <CashFlowChart activePeriod={activeTimeline} />
        </div>
        
        {/* Category Breakdown Donut Graph */}
        <div className={styles.chartWrapperNode}>
          <ExpenseDonutChart activePeriod={activeTimeline} />
        </div>

      </main>

    </div>
    /* === SECTION 4 END === */
  );
}