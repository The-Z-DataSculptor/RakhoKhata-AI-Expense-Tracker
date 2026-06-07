/* ==========================================================================
   === FILEPATH: src/app/(dashboard)/dashboard/overview/page.tsx ===
   ========================================================================== */

"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES ===
   ========================================================================== */
import React, { useState } from "react";
import TimeSwitcher, { TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import MetricRow from "@/components/dashboard/MetricRow/MetricRow";
import styles from "./page.module.css";
/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: MAIN PAGE WORKSPACE ===
   ========================================================================== */
export default function OverviewHubPage() {
  
  // WHY: Holds the central timeframe filter state, initialized to "30d" by default.
  const [activeTimeline, setActiveTimeline] = useState<TimePeriod>("30d");

  // Updates the state whenever a new timeline option button is clicked
  const handleTimelineChange = (selectedPeriod: TimePeriod) => {
    setActiveTimeline(selectedPeriod);
  };

  return (
    <div className={styles.pageWorkspaceWrapper}>
      
      {/* MAIN SCREEN HEADER BLOCK */}
      <header className={styles.dashboardHeaderDeck}>
        <div className={styles.headlineGroup}>
          <h1 className={styles.mainGreetingTitle}>Overview Hub</h1>
          <p className={styles.subTextLabel}>
            See a simple breakdown of your money and spending.
          </p>
        </div>

        {/* TIME SWITCH CONTAINER INTERACTIVE TOOLBAR */}
        <TimeSwitcher 
          activePeriod={activeTimeline} 
          onPeriodChange={handleTimelineChange} 
        />
      </header>

      {/* RENDER ZONE: THE 4 FINANCIAL DATA CARDS */}
      <section className={styles.metricsSectionRow} aria-label="Financial Summary Cards">
        <MetricRow activePeriod={activeTimeline} />
      </section>

      {/* GRAPH CONTAINER ASSIGNMENT STAGE */}
      <section className={styles.futureVisualAnalyticsStage}>
        <div className={styles.placeholderChartWireframe}>
          <p className={styles.placeholderNotificationText}>
            Graphs and charts will show up here soon
          </p>
        </div>
      </section>

    </div>
  );
}
/* === SECTION 2 END === */