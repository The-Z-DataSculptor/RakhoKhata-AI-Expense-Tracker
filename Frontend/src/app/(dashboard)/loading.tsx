// src/app/(dashboard)/loading.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React from "react";
import styles from "./loading.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SKELETON LOADING COMPONENT ===
   ========================================================================== */
/**
 * DashboardLoading
 *
 * WHY a skeleton screen is shown:
 * While the dashboard layout fetches the user profile and workspaces on the
 * server (layout.tsx), this component is displayed immediately.  It provides
 * a visual placeholder that mimics the final layout, so the transition from
 * loading to ready feels seamless for the user.
 */
export default function DashboardLoading() {
  // Four placeholder cards to match the metric row grid
  const skeletonCards = [
    { cardId: "skeleton-1" },
    { cardId: "skeleton-2" },
    { cardId: "skeleton-3" },
    { cardId: "skeleton-4" },
  ];

  return (
    <div className={styles.loadingContainer} aria-hidden="true">
      {/* 1. Header skeleton */}
      <header className={styles.dashboardHeaderCardBoxSkeleton}>
        <div className={styles.headingBlockSkeleton}>
          <div
            className={`${styles.skeletonBase} ${styles.titleSkeleton}`}
          ></div>
          <div
            className={`${styles.skeletonBase} ${styles.subtitleSkeleton}`}
          ></div>
        </div>

        <div
          className={`${styles.skeletonBase} ${styles.actionPanelControlSkeleton}`}
        ></div>
      </header>

      {/* 2. Metric cards grid */}
      <section className={styles.metricsGridSkeleton}>
        {skeletonCards.map((card) => (
          <div key={card.cardId} className={styles.skeletonCard}>
            <div
              className={`${styles.skeletonBase} ${styles.cardHeaderLine}`}
            ></div>
            <div
              className={`${styles.skeletonBase} ${styles.cardMainValue}`}
            ></div>
            <div
              className={`${styles.skeletonBase} ${styles.cardSubtextLine}`}
            ></div>
          </div>
        ))}
      </section>

      {/* 3. Graph placeholder */}
      <main className={styles.largeGraphBlockSkeleton}>
        <div
          className={`${styles.skeletonBase} ${styles.graphHeaderLine}`}
        ></div>
        <div
          className={`${styles.skeletonBase} ${styles.graphCanvasBody}`}
        ></div>
      </main>
    </div>
  );
}
/* === SECTION 2 END === */