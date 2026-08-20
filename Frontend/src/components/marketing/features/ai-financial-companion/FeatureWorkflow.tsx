/* D:\Developer\Expense-Tracker\Frontend\src\components\marketing\features\ai-financial-companion\FeatureWorkflow.tsx */
"use client";

import React from "react";
import { FiSmile, FiActivity, FiMessageSquare } from "react-icons/fi";
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
  <FiSmile key="step-icon-1" size={22} />,
  <FiActivity key="step-icon-2" size={22} />,
  <FiMessageSquare key="step-icon-3" size={22} />,
];

export default function FeatureWorkflow({
  sectionTitle,
  sectionSubtitle,
  steps,
}: FeatureWorkflowProps) {
  return (
    <section className={styles.workflowSection} aria-label="3-Step AI Workflow Process">
      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <header className={styles.headerBlock}>
          <span className={styles.pillLabel}>Intelligent Advisory Cycle</span>
          <h2 className={styles.title}>{sectionTitle}</h2>
          {sectionSubtitle && <p className={styles.subtitle}>{sectionSubtitle}</p>}
        </header>

        {/* 3 STEPS ORDERED LIST */}
        <ol className={styles.stepsGrid} aria-label="Step by step setup instructions">
          {steps.map((item, idx) => (
            <li key={idx} className={styles.stepListItem}>
              <article className={styles.stepCard}>
                {/* STEP TOP */}
                <div className={styles.stepCardTop}>
                  <div className={styles.iconCircle} aria-hidden="true">
                    {STEP_ICONS[idx % STEP_ICONS.length]}
                  </div>
                  <span className={styles.stepNumberBadge} aria-hidden="true">
                    {item.step}
                  </span>
                </div>

                {/* STEP BODY */}
                <div className={styles.stepBody}>
                  <h3 className={styles.stepTitle}>{item.title}</h3>
                  <p className={styles.stepDescription}>{item.description}</p>
                </div>

                {/* CARD ACCENT */}
                <div className={styles.cardFooterBar} aria-hidden="true" />
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}