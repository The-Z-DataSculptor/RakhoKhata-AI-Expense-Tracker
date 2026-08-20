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
  "4 Adaptive Personalities",
  "Real-Time Ledger Telemetry",
  "Timeframe Audit Reports",
  "Free Core Tier",
] as const;

export default function FeatureHero({
  badge,
  title,
  description,
  primaryCtaText = "Meet Your AI Buddy Free",
  primaryCtaLink = "/signup",
  secondaryCtaText = "Test Personas Live",
  secondaryCtaLink = "#preview",
}: FeatureHeroProps) {
  return (
    <header className={styles.heroSection} aria-label="AI Financial Companion Overview">
      <div className={styles.heroGlowBackground} aria-hidden="true" />

      <div className={styles.heroContainer}>
        {/* BADGE PILL */}
        <div className={styles.badgeWrapper}>
          <span className={styles.badgePill}>
            <span className={styles.badgePulseDot} aria-hidden="true" />
            {badge}
          </span>
        </div>

        {/* HEADINGS */}
        <h1 className={styles.heroTitle}>{title}</h1>
        <p className={styles.heroDescription}>{description}</p>

        {/* CTA ACTIONS */}
        <nav className={styles.ctaGroup} aria-label="Hero Actions">
          <Link 
            href={primaryCtaLink} 
            className={styles.primaryCtaBtn}
            aria-label={`${primaryCtaText} - Create free account`}
          >
            <span>{primaryCtaText}</span>
            <FiArrowRight className={styles.arrowIcon} size={16} aria-hidden="true" />
          </Link>

          {secondaryCtaText && (
            <Link 
              href={secondaryCtaLink} 
              className={styles.secondaryCtaBtn}
              aria-label={`${secondaryCtaText} - Scroll to interactive demo`}
            >
              {secondaryCtaText}
            </Link>
          )}
        </nav>

        {/* TRUST SIGNALS - Structured List for Indexing */}
        <ul className={styles.trustBadgesRow} aria-label="Key Product Highlights">
          {TRUST_TAGS.map((tag) => (
            <li key={tag} className={styles.trustBadgeItem}>
              <FiCheckCircle className={styles.checkIcon} size={14} aria-hidden="true" />
              <span>{tag}</span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}