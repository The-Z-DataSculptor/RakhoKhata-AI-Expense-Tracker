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
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter"; 
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext"; // NEW: Connect to the global brain
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
// Defines the shape of the data needed for the Control Lever gauge
interface PeriodMetrics {
  bills: number;
  inflow: number;
  outflow: number;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function DashboardPage() {
  const { activeWorkspaceId } = useWorkspace(); // Grab the currently active mode

  // Keeps track of the active filter time (like 30 days or 7 days)
  const [activeTimeline, setActiveTimeline] = useState<TimePeriod>("30d");

  // Changes the timeframe when a user clicks a switcher button
  const handleTimelineChange = (selectedPeriod: TimePeriod) => {
    setActiveTimeline(selectedPeriod);
  };

  /**
   * STRUCTURED MULTI-TENANT MOCK DATABASE
   * We now store completely separate data sets based on the Workspace ID.
   */
  const MOCK_WORKSPACE_DATA: Record<string, Record<TimePeriod, PeriodMetrics>> = {
    "ws-personal-default": {
      "7d": { bills: 150, inflow: 625, outflow: 375 },
      "14d": { bills: 300, inflow: 1250, outflow: 750 },
      "30d": { bills: 600, inflow: 2710, outflow: 1960 },
      "all": { bills: 3240, inflow: 32400, outflow: 21500 },
    },
    "ws-business-default": {
      "7d": { bills: 400, inflow: 3200, outflow: 800 },
      "14d": { bills: 800, inflow: 6500, outflow: 1500 },
      "30d": { bills: 1600, inflow: 14200, outflow: 3200 },
      "all": { bills: 18500, inflow: 125000, outflow: 45000 },
    }
  };

  // --- DATA FILTERING ENGINE ---
  // 1. Get the data for the active workspace. 
  const activeWorkspaceData = MOCK_WORKSPACE_DATA[activeWorkspaceId];
  
  // 2. If it's a brand new workspace, default everything to 0. Otherwise, grab the specific timeline.
  const emptyStateMetrics: PeriodMetrics = { bills: 0, inflow: 0, outflow: 0 };
  const currentMetrics = activeWorkspaceData ? activeWorkspaceData[activeTimeline] : emptyStateMetrics;

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
        {/* FULLY CONNECTED: Passing dynamic data values based on the active workspace! */}
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

      {/* CLEAN & GENERIC SYSTEM FOOTER ANCHOR */}
      <DashboardFooter />

    </div>
    /* === SECTION 4 END === */
  );
}