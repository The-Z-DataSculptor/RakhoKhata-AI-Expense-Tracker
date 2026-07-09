// src/app/(dashboard)/loading.tsx
import React from "react";
import styles from "./loading.module.css";

/* ==========================================================================
   === SECTION 1: MAIN COMPONENT RENDER ===
   ========================================================================== */
export default function DashboardLoading() {
  
  // Generating 4 explicit metric cards to match the layout grid of your stats row
  const skeletonCards = [
    { cardId: "skeleton-1" },
    { cardId: "skeleton-2" },
    { cardId: "skeleton-3" },
    { cardId: "skeleton-4" }
  ];

  return (
    <div className={styles.loadingContainer} aria-hidden="true">
      
      {/* 1. TOP HEADER CONTAINER BOX */}
      <header className={styles.dashboardHeaderCardBoxSkeleton}>
        <div className={styles.headingBlockSkeleton}>
          {/* Combined standard skeleton base with layout sizing classes */}
          <div className={`${styles.skeletonBase} ${styles.titleSkeleton}`}></div>
          <div className={`${styles.skeletonBase} ${styles.subtitleSkeleton}`}></div>
        </div>
        
        {/* Simulates the right-aligned workspace/time control panel action buttons */}
        <div className={`${styles.skeletonBase} ${styles.actionPanelControlSkeleton}`}></div>
      </header>

      {/* 2. SUMMARY METRICS CARDS GRID */}
      <section className={styles.metricsGridSkeleton}>
        {skeletonCards.map((card) => (
          <div key={card.cardId} className={styles.skeletonCard}>
            <div className={`${styles.skeletonBase} ${styles.cardHeaderLine}`}></div>
            <div className={`${styles.skeletonBase} ${styles.cardMainValue}`}></div>
            <div className={`${styles.skeletonBase} ${styles.cardSubtextLine}`}></div>
          </div>
        ))}
      </section>

      {/* 3. LOWER LARGE-SCALE ANALYTICS BLOCK PLACEHOLDER */}
      <main className={styles.largeGraphBlockSkeleton}>
        <div className={`${styles.skeletonBase} ${styles.graphHeaderLine}`}></div>
        <div className={`${styles.skeletonBase} ${styles.graphCanvasBody}`}></div>
      </main>

    </div>
  );
}
/* === SECTION 1 END === */