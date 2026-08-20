/* D:\Developer\Expense-Tracker\Frontend\src\components\marketing\features\ai-financial-companion\FeatureBenefits.tsx */
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
    <section className={styles.benefitsSection} aria-label="Traditional Spreadsheets vs AI Financial Intelligence">
      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <header className={styles.headerBlock}>
          <span className={styles.pillLabel}>Passive Charts vs. Active Intelligence</span>
          <h2 className={styles.title}>{sectionTitle}</h2>
          {sectionSubtitle && <p className={styles.subtitle}>{sectionSubtitle}</p>}
        </header>

        {/* 3-COLUMN COMPARISON GRID */}
        <div className={styles.cardsGrid}>
          {benefits.map((item, idx) => (
            <article key={idx} className={styles.comparisonCard}>
              {/* PROBLEM BLOCK */}
              <div className={styles.problemSide}>
                <div className={styles.badgeRow}>
                  <span className={styles.problemBadge}>
                    <FiAlertCircle className={styles.badgeIcon} size={14} aria-hidden="true" />
                    <span className={styles.badgeText}>Traditional App Pitfall</span>
                  </span>
                </div>
                <p className={styles.cardText}>{item.problem}</p>
              </div>

              {/* DIVIDER */}
              <div className={styles.cardDivider} aria-hidden="true" />

              {/* SOLUTION BLOCK */}
              <div className={styles.solutionSide}>
                <div className={styles.badgeRow}>
                  <span className={styles.solutionBadge}>
                    <FiCheckCircle className={styles.badgeIcon} size={14} aria-hidden="true" />
                    <span className={styles.badgeText}>RakhoKhaata AI Solution</span>
                  </span>
                </div>
                <p className={styles.cardTextHighlight}>{item.solution}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}