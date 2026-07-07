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
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext"; 
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface PeriodMetrics {
  bills: number;
  inflow: number;
  outflow: number;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
// Static multi-workspace data grid parsed outside render lifecycle loop
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

const EMPTY_STATE_METRICS: PeriodMetrics = { bills: 0, inflow: 0, outflow: 0 };

export default function DashboardPage() {
  const { activeWorkspaceId } = useWorkspace(); 

  const [activeTimeline, setActiveTimeline] = useState<TimePeriod>("30d");

  const handleTimelineChange = (selectedPeriod: TimePeriod) => {
    setActiveTimeline(selectedPeriod);
  };

  const activeWorkspaceData = MOCK_WORKSPACE_DATA[activeWorkspaceId];
  const currentMetrics = activeWorkspaceData ? activeWorkspaceData[activeTimeline] : EMPTY_STATE_METRICS;
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.workspaceWrapper}>
      
      {/* HEADER SECTION: Standalone card box wrapper element */}
      <header className={styles.dashboardHeaderCardBox}>
        <div className={styles.headingBlock}>
          
          {/* Unified horizontal row containing the Live Analytics badge directly in front of the heading title */}
          <div className={styles.titleWithBadgeRow}>
            <h1 className={styles.welcomeHeadline}>Overview Hub</h1>
            <span className={styles.liveAnalyticsBadgeElement}>Live Analytics</span>            
          </div>

          <p className={styles.welcomeSubtext}>
            Your financial health at a glance.
          </p>
        </div>

        {/* Right aligned timeline selection panel frame context */}
        <div className={styles.timeSwitcherActionFrame}>
          <TimeSwitcher 
            activePeriod={activeTimeline} 
            onPeriodChange={handleTimelineChange} 
          />
        </div>
      </header>

      {/* QUICK STATS CARDS GRID */}
      <section className={styles.metricsRowStage} aria-label="Quick Summary">
        <MetricRow activePeriod={activeTimeline} />
      </section>

      {/* VISUAL CONTROL LEVER SPLIT BAR */}
      <section className={styles.gaugeRowStage} aria-label="Spending Control Guide">
        <ControlLever 
          totalIncome={currentMetrics.inflow}
          fixedExpenses={currentMetrics.bills}
          flexibleExpenses={currentMetrics.outflow}
          activePeriod={activeTimeline}
        />
      </section>

      {/* BOTTOM ANALYTICS GRAPHS STAGE */}
      <main className={styles.isolatedStage}>
        
        <div className={styles.chartWrapperNode}>
          <CashFlowChart activePeriod={activeTimeline} />
        </div>
        
        <div className={styles.chartWrapperNode}>
          <ExpenseDonutChart activePeriod={activeTimeline} />
        </div>

      </main>

      {/* CLEAN & GENERIC SYSTEM FOOTER ANCHOR */}
      <footer className={styles.footerContainerBlock}>
        <DashboardFooter />
      </footer>

    </div>
  );
}
/* === SECTION 4 END === */