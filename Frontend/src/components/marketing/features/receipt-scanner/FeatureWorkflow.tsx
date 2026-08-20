/* src/components/marketing/features/receipt-scanner/FeatureWorkflow.tsx */


"use client";

import React from "react";
import { FiCamera, FiCpu, FiCheckSquare } from "react-icons/fi";
import styles from "./FeatureWorkflow.module.css";

export interface WorkflowStep {
  step: string;
  title: string;
  description: string;
}

export interface FeatureWorkflowProps {
  sectionTitle: string;
  sectionSubtitle?: string;
  steps: WorkflowStep[];
}

const STEP_ICONS = [
  <FiCamera key="s-1" size={22} />,
  <FiCpu key="s-2" size={22} />,
  <FiCheckSquare key="s-3" size={22} />,
];

export default function FeatureWorkflow({
  sectionTitle,
  sectionSubtitle,
  steps,
}: FeatureWorkflowProps) {
  return (
    <section className={styles.workflowSection} aria-label="How AI Receipt Scanning Works in 3 Steps">
      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <span className={styles.pillLabel}>Effortless Flow</span>
          <h2 className={styles.title}>{sectionTitle}</h2>
          {sectionSubtitle && <p className={styles.subtitle}>{sectionSubtitle}</p>}
        </div>

        {/* 3 STEPS GRID */}
        <div className={styles.stepsGrid}>
          {steps.map((item, idx) => (
            <div key={idx} className={styles.stepCard}>
              {/* STEP TOP */}
              <div className={styles.stepCardTop}>
                <div className={styles.iconCircle}>
                  {STEP_ICONS[idx % STEP_ICONS.length]}
                </div>
                <span className={styles.stepNumberBadge}>{item.step}</span>
              </div>

              {/* STEP BODY */}
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDescription}>{item.description}</p>
              </div>

              {/* CARD ACCENT */}
              <div className={styles.cardFooterBar} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}