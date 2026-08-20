//D:\Developer\Expense-Tracker\Frontend\src\components\marketing\features\multi-currency-tracker\FeatureHero.tsx//
"use client";

import React from "react";
import Link from "next/link";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import styles from "./FeatureHero.module.css";

export interface FeatureHeroProps {
  badge: string;
  title: string;
  description: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

const TRUST_TAGS = [
  "40+ Global Currencies",
  "Real-Time Bank Rates",
  "Isolated Workspaces",
  "No Credit Card Required",
] as const;

export default function FeatureHero({
  badge,
  title,
  description,
  primaryCtaText = "Start Tracking Free",
  primaryCtaLink = "/signup",
  secondaryCtaText = "Explore Live Preview",
  secondaryCtaLink = "#preview",
}: FeatureHeroProps) {
  return (
    <section className={styles.heroSection} aria-label="Feature Introduction">
      <div className={styles.heroGlowBackground} aria-hidden="true" />

      <div className={styles.heroContainer}>
        {/* BADGE PILL */}
        <div className={styles.badgeWrapper}>
          <span className={styles.badgePill}>
            <span className={styles.badgePulseDot} />
            {badge}
          </span>
        </div>

        {/* HEADINGS */}
        <h1 className={styles.heroTitle}>{title}</h1>
        <p className={styles.heroDescription}>{description}</p>

        {/* CTA BUTTONS */}
        <div className={styles.ctaGroup}>
          <Link href={primaryCtaLink} className={styles.primaryCtaBtn}>
            <span>{primaryCtaText}</span>
            <FiArrowRight className={styles.arrowIcon} size={16} />
          </Link>

          {secondaryCtaText && (
            <a href={secondaryCtaLink} className={styles.secondaryCtaBtn}>
              {secondaryCtaText}
            </a>
          )}
        </div>

        {/* TRUST SIGNALS */}
        <div className={styles.trustBadgesRow}>
          {TRUST_TAGS.map((tag) => (
            <div key={tag} className={styles.trustBadgeItem}>
              <FiCheckCircle className={styles.checkIcon} size={14} />
              <span>{tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}