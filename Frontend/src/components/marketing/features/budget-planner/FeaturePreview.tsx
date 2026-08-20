"use client";

import React, { useState } from "react";
import { FiClock, FiEdit2, FiTrash2 } from "react-icons/fi";
import styles from "./FeaturePreview.module.css";

export interface FeaturePreviewProps {
  id?: string;
  headline?: string;
  subheadline?: string;
}

type TimeScale = "7d" | "14d" | "30d";

interface DemoBudgetItem {
  id: string;
  categoryName: string;
  spentAmount: number;
  limitAmount: number;
  startDate: string;
  endDate: string;
}

const DONUT_RADIUS = 36;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const BASE_DEMO_DATA: DemoBudgetItem[] = [
  {
    id: "b-1",
    categoryName: "Groceries & Supermarket",
    spentAmount: 480,
    limitAmount: 800,
    startDate: "Aug 01",
    endDate: "Aug 31",
  },
  {
    id: "b-2",
    categoryName: "Dining & Coffee",
    spentAmount: 340,
    limitAmount: 400,
    startDate: "Aug 01",
    endDate: "Aug 31",
  },
  {
    id: "b-3",
    categoryName: "Software & Subscriptions",
    spentAmount: 230,
    limitAmount: 200,
    startDate: "Aug 01",
    endDate: "Aug 31",
  },
];

export default function FeaturePreview({
  id = "preview",
  headline = "Interactive Budget Donut Simulator",
  subheadline = "Click the time switcher buttons below to see how RakhoKhaata dynamically scales and color-codes your category limits.",
}: FeaturePreviewProps) {
  const [activeRange, setActiveRange] = useState<TimeScale>("30d");

  const getScale = (range: TimeScale) => {
    switch (range) {
      case "7d":
        return 7 / 30;
      case "14d":
        return 14 / 30;
      case "30d":
      default:
        return 1;
    }
  };

  const currentScale = getScale(activeRange);

  return (
    <section id={id} className={styles.previewSection} aria-label="Interactive Budget Simulator">
      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <div className={styles.interactiveIndicator}>
            <FiClock className={styles.clockIcon} size={15} />
            <span>Interactive Donut Canvas</span>
          </div>
          <h2 className={styles.previewTitle}>{headline}</h2>
          <p className={styles.previewSubtitle}>{subheadline}</p>
        </div>

        {/* TIME SWITCHER CONTROLS */}
        <div className={styles.switcherBar}>
          <span className={styles.switchLabel}>Simulate Paced View:</span>
          <div className={styles.toggleGroup}>
            <button
              type="button"
              className={`${styles.timeBtn} ${activeRange === "7d" ? styles.timeBtnActive : ""}`}
              onClick={() => setActiveRange("7d")}
            >
              This Week (7d)
            </button>
            <button
              type="button"
              className={`${styles.timeBtn} ${activeRange === "14d" ? styles.timeBtnActive : ""}`}
              onClick={() => setActiveRange("14d")}
            >
              Half Month (14d)
            </button>
            <button
              type="button"
              className={`${styles.timeBtn} ${activeRange === "30d" ? styles.timeBtnActive : ""}`}
              onClick={() => setActiveRange("30d")}
            >
              This Month (30d)
            </button>
          </div>
        </div>

        {/* SIMULATED DASHBOARD CANVAS */}
        <div className={styles.mockupFrame}>
          {/* BROWSER TOP BAR */}
          <div className={styles.windowTopBar}>
            <div className={styles.windowControls}>
              <span className={`${styles.circleDot} ${styles.dotRed}`} />
              <span className={`${styles.circleDot} ${styles.dotYellow}`} />
              <span className={`${styles.circleDot} ${styles.dotGreen}`} />
            </div>
            <div className={styles.windowUrlField}>
              app.rakhokhata.com/dashboard/budgets • Scaling: <strong>{activeRange.toUpperCase()}</strong>
            </div>
          </div>

          {/* DONUT GRID DISPLAY */}
          <div className={styles.dashboardBody}>
            <div className={styles.gridContainer}>
              {BASE_DEMO_DATA.map((budget) => {
                const scaledSpent = Math.round(budget.spentAmount * currentScale);
                const scaledLimit = Math.round(budget.limitAmount * currentScale);
                const usageRatio = scaledLimit > 0 ? scaledSpent / scaledLimit : 0;
                const percent = Math.round(usageRatio * 100);
                const boundedPercent = Math.min(Math.max(0, percent), 100);
                const strokeDashoffset = DONUT_CIRCUMFERENCE - (boundedPercent / 100) * DONUT_CIRCUMFERENCE;

                const isDanger = usageRatio >= 1.0;
                const isWarning = usageRatio >= 0.8 && usageRatio < 1.0;

                const statusLevel = isDanger ? "DANGER" : isWarning ? "WARNING" : "SUCCESS";
                const remaining = scaledLimit - scaledSpent;

                const colorClass =
                  statusLevel === "DANGER"
                    ? styles.colorDanger
                    : statusLevel === "WARNING"
                    ? styles.colorWarning
                    : styles.colorSuccess;

                const badgeClass =
                  statusLevel === "DANGER"
                    ? styles.badgeDanger
                    : statusLevel === "WARNING"
                    ? styles.badgeWarning
                    : styles.badgeSuccess;

                return (
                  <div key={budget.id} className={styles.donutCard}>
                    {/* CARD HEADER */}
                    <div className={styles.cardHeaderTop}>
                      <div className={styles.titleAndDateMeta}>
                        <h4 className={styles.categoryTitle}>{budget.categoryName}</h4>
                        <span className={styles.durationTimelineSpan}>
                          🗓️ {budget.startDate} – {budget.endDate}
                        </span>
                      </div>

                      <div className={styles.headerActions}>
                        <span className={`${styles.statusBadge} ${badgeClass}`}>
                          {isDanger ? "Over Limit" : isWarning ? "80% Warning" : "On Track"}
                        </span>
                        <div className={styles.actionIconGroup}>
                          <button type="button" className={styles.iconBtn} aria-label="Edit budget">
                            <FiEdit2 size={13} />
                          </button>
                          <button type="button" className={`${styles.iconBtn} ${styles.deleteBtn}`} aria-label="Delete budget">
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CARD BODY: DONUT & METRICS */}
                    <div className={styles.cardMainSection}>
                      <div className={styles.visualDonutSide}>
                        <div className={styles.svgWrapperRelative}>
                          <svg className={styles.donutSvgObject} viewBox="0 0 80 80" aria-hidden="true">
                            <circle className={styles.donutTrackCircleLayer} cx="40" cy="40" r={DONUT_RADIUS} />
                            <circle
                              className={`${styles.donutProgressCircleLayer} ${colorClass}`}
                              cx="40"
                              cy="40"
                              r={DONUT_RADIUS}
                              strokeDasharray={DONUT_CIRCUMFERENCE}
                              strokeDashoffset={strokeDashoffset}
                            />
                          </svg>
                          <div className={styles.centerPercentageLabel}>
                            <span className={`${styles.percentNumberText} ${colorClass}`}>
                              {percent}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.textDetailsSide}>
                        <div className={styles.spentGroup}>
                          <span className={styles.metaLabelHeader}>Spent ({activeRange})</span>
                          <p className={styles.bigBoldAmount}>${scaledSpent}</p>
                        </div>

                        <div className={styles.limitGroup}>
                          <span className={styles.metaLabelHeader}>Target Limit</span>
                          <p className={styles.subAmountLabel}>${scaledLimit}</p>
                        </div>
                      </div>
                    </div>

                    {/* CARD FOOTER */}
                    <div className={styles.cardFooterNoticeLine}>
                      <span className={styles.remainingContextLabel}>Available Cash</span>
                      {isDanger ? (
                        <span className={styles.dangerNoticeText}>-${Math.abs(remaining)}</span>
                      ) : (
                        <span className={styles.successNoticeText}>+${remaining}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}