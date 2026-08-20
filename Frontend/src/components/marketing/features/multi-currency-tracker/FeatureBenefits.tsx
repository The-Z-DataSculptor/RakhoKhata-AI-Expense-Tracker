//D:\Developer\Expense-Tracker\Frontend\src\components\marketing\features\multi-currency-tracker\FeatureBenefits.tsx//

"use client";

import React from "react";
import { FiXCircle, FiCheckCircle } from "react-icons/fi";
import styles from "./FeatureBenefits.module.css";

export interface BenefitItem {
  tag?: string;
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
    <section className={styles.benefitsSection} aria-label="Why RakhoKhaata Works Better">
      <div className={styles.container}>
        
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <h2 className={styles.title}>{sectionTitle}</h2>
          {sectionSubtitle && <p className={styles.subtitle}>{sectionSubtitle}</p>}
        </div>

        {/* 3-COLUMN BENEFIT CARDS */}
        <div className={styles.cardsGrid}>
          {benefits.map((item, idx) => (
            <div key={idx} className={styles.benefitCard}>
              
              {/* PROBLEM BOX */}
              <div className={styles.problemBox}>
                <div className={styles.badgeHeader}>
                  <FiXCircle className={styles.iconProblem} size={17} />
                  <span className={styles.labelProblem}>The Common Problem</span>
                </div>
                <p className={styles.problemText}>{item.problem}</p>
              </div>

              {/* SOLUTION BOX */}
              <div className={styles.solutionBox}>
                <div className={styles.badgeHeader}>
                  <FiCheckCircle className={styles.iconSolution} size={17} />
                  <span className={styles.labelSolution}>How RakhoKhaata Solves It</span>
                </div>
                <p className={styles.solutionText}>{item.solution}</p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}