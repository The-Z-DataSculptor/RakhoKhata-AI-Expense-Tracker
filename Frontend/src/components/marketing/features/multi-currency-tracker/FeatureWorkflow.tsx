// D:\Developer\Expense-Tracker\Frontend\src\components\marketing\features\multi-currency-tracker\FeatureWorkflow.tsx //

"use client";

import React from "react";
import { FiFolderPlus, FiPlusCircle, FiBarChart2 } from "react-icons/fi";
import styles from "./FeatureWorkflow.module.css";

export interface WorkflowStep {
  step: string;
  title: string;
  description: string;
  badgeText?: string;
}

export interface FeatureWorkflowProps {
  sectionTitle: string;
  sectionSubtitle?: string;
  steps: WorkflowStep[];
}

const STEP_ICONS = [
  <FiFolderPlus key="step-1" size={22} />,
  <FiPlusCircle key="step-2" size={22} />,
  <FiBarChart2 key="step-3" size={22} />,
];

export default function FeatureWorkflow({
  sectionTitle,
  sectionSubtitle,
  steps,
}: FeatureWorkflowProps) {
  return (
    <section className={styles.workflowSection} aria-label="How It Works In 3 Steps">
      <div className={styles.container}>
        
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <span className={styles.pillLabel}>Simple 3-Step Process</span>
          <h2 className={styles.title}>{sectionTitle}</h2>
          {sectionSubtitle && <p className={styles.subtitle}>{sectionSubtitle}</p>}
        </div>

        {/* 3 STEPS GRID */}
        <div className={styles.stepsGrid}>
          {steps.map((item, idx) => (
            <div key={idx} className={styles.stepCard}>
              
              {/* STEP NUMBER & ICON HEADER */}
              <div className={styles.stepCardTop}>
                <div className={styles.iconCircle}>
                  {STEP_ICONS[idx % STEP_ICONS.length]}
                </div>
                <span className={styles.stepNumberBadge}>{item.step}</span>
              </div>

              {/* STEP CONTENT */}
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDescription}>{item.description}</p>
              </div>

              {/* CARD FOOTER ACCENT */}
              <div className={styles.cardFooterBar} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}