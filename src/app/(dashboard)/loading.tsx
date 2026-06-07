/* ==========================================================================
   === FILEPATH: src/app/(dashboard)/loading.tsx ===
   ========================================================================== */

import React from "react";
import styles from "./loading.module.css";

/* ==========================================================================
   === SECTION 1: MAIN COMPONENT RENDER ===
   ========================================================================== */
export default function DashboardLoading() {
  
  // WHY: Generating 4 explicit metrics cards to perfectly map and mimic the 
  // real dynamic MetricRow data configuration array slots while content loads.
  const skeletonCards = [
    { cardId: "skeleton-bill" },
    { cardId: "skeleton-inflow" },
    { cardId: "skeleton-outflow" },
    { cardId: "skeleton-safe" }
  ];

  return (
    <div className={styles.loadingContainer} aria-hidden="true">
      
      {/* 1. TOP HEADER SKELETON TRACK */}
      <header className={styles.headerSkeletonTracker}>
        <div className={styles.titleSkeleton}></div>
        <div className={styles.subtitleSkeleton}></div>
      </header>

      {/* 2. SUMMARY METRICS GRID SKELETON */}
      <section className={styles.metricsGridSkeleton} aria-label="Loading summary data">
        {skeletonCards.map((card) => (
          // FIXED: Utilizes an explicit, predictive string property instead of unsafe array indices
          <div key={card.cardId} className={styles.skeletonCard}>
            <div className={styles.cardHeaderLine}></div>
            <div className={styles.cardMainValue}></div>
            <div className={styles.cardSubtextLine}></div>
          </div>
        ))}
      </section>

      {/* 3. LARGESCALE DATA GRAPH PLACEHOLDER */}
      <main className={styles.largeGraphBlockSkeleton}>
        <div className={styles.graphHeaderLine}></div>
        <div className={styles.graphCanvasBody}></div>
      </main>

    </div>
  );
}
/* === SECTION 1 END === */