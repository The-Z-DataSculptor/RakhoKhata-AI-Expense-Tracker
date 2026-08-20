/* src/components/marketing/features/receipt-scanner/FeatureBenefits.tsx */

"use client";

import React from "react";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import styles from "./FeatureBenefits.module.css";

export interface BenefitItem {
  problem: string;
  solution: string;
}

export interface FeatureBenefitsProps {
  sectionTitle: string;
  sectionSubtitle?: string;
  benefits: BenefitItem[];
}

export default function FeatureBenefits({
  sectionTitle,
  sectionSubtitle,
  benefits,
}: FeatureBenefitsProps) {
  return (
    <section className={styles.benefitsSection} aria-label="Receipt Scanner Benefits">
      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <span className={styles.pillLabel}>Manual Typing vs. AI OCR</span>
          <h2 className={styles.title}>{sectionTitle}</h2>
          {sectionSubtitle && <p className={styles.subtitle}>{sectionSubtitle}</p>}
        </div>

        {/* 3-COLUMN COMPARISON CARDS */}
        <div className={styles.cardsGrid}>
          {benefits.map((item, idx) => (
            <div key={idx} className={styles.comparisonCard}>
              {/* PROBLEM BLOCK */}
              <div className={styles.problemSide}>
                <div className={styles.badgeRow}>
                  <span className={styles.problemBadge}>
                    <FiAlertCircle className={styles.badgeIcon} size={14} />
                    Manual Friction
                  </span>
                </div>
                <p className={styles.cardText}>{item.problem}</p>
              </div>

              {/* DIVIDER ACCENT */}
              <div className={styles.cardDivider} />

              {/* SOLUTION BLOCK */}
              <div className={styles.solutionSide}>
                <div className={styles.badgeRow}>
                  <span className={styles.solutionBadge}>
                    <FiCheckCircle className={styles.badgeIcon} size={14} />
                    How RakhoKhaata Fixes It
                  </span>
                </div>
                <p className={styles.cardTextHighlight}>{item.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}