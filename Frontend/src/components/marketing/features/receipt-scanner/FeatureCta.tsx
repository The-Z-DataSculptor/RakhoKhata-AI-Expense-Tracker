/* D:\Developer\Expense-Tracker\Frontend\src\components\marketing\features\receipt-scanner\FeatureCta.tsx */

"use client";

import React from "react";
import Link from "next/link";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import styles from "./FeatureCta.module.css";

export interface FeatureCtaProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

const GUARANTEE_TAGS = [
  "Instant Camera & PDF Support",
  "No Credit Card Required",
  "Free Core Tier Forever",
] as const;

export default function FeatureCta({
  title,
  description,
  buttonText,
  buttonLink,
}: FeatureCtaProps) {
  return (
    <section className={styles.ctaSection} aria-label="Start Scanning Call To Action">
      <div className={styles.container}>
        <div className={styles.ctaCard}>
          <div className={styles.cardGlow} aria-hidden="true" />

          <div className={styles.cardContent}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>{description}</p>

            <div className={styles.actionGroup}>
              <Link href={buttonLink} className={styles.ctaButton}>
                <span>{buttonText}</span>
                <FiArrowRight className={styles.arrowIcon} size={18} />
              </Link>
            </div>

            <div className={styles.guaranteeRow}>
              {GUARANTEE_TAGS.map((tag) => (
                <div key={tag} className={styles.guaranteeItem}>
                  <FiCheckCircle className={styles.checkIcon} size={15} />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}