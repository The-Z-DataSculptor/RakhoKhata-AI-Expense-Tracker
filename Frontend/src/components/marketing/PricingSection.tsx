// src/components/PricingSection.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & MODULE CONSTANTS ===
   ========================================================================== */
import React from "react";
import Link from "next/link";
import styles from "./PricingSection.module.css";

// WHY THIS FIX WAS MADE: Defining static arrays outside the component scope prevents 
// re-allocating memory for feature lists on every render cycle.
const FREE_FEATURES = [
  "Up to 700 transaction entries every single month",
  "Up to 3 individual multi-purpose Workspaces",
  "Free Workspace sharing with family & co-workers",
  "Password-Locked Asset Vault (Hide balances from family)",
  "Automated Email Renewal alerts for subscriptions (Netflix)",
  "Live multi-currency conversion tools",
  "Basic read-only email snapshot links",
] as const;

const PRO_FEATURES = [
  "Everything in Free, plus:",
  "Unlimited Workspaces & transaction entries forever",
  "Smart OCR Receipt Scanner (Snap photos to auto-log)",
  "AI Hands-Free Voice Logging inputs",
  "Interactive Shared Split Ledgers (Read/Write via WhatsApp & Email)",
  "Advanced multi-day automated debt tracking pipelines",
] as const;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
// Static marketing component props
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: MAIN RENDERING LAYOUT COMPONENT ===
   ========================================================================== */
export default function PricingSection() {
  return (
    <section id="pricing" className={styles.pricingWrapper} aria-label="Pricing Plans">
      
      {/* HEADER ZONE */}
      <div className={styles.headerBlock}>
        <h1 className={styles.mainTitle}>Choose Your Financial Freedom Plan</h1>
        <p className={styles.subTitle}>
          Build an unbreakable tracking habit for free, or unlock automation engine upgrades.
        </p>
      </div>

      {/* THE ASYMMETRIC GRID: Houses the 40% / 60% Split Layout cards */}
      <div className={styles.splitGridLayout}>
        
        {/* --- CARD A: FREE TIER --- */}
        <div className={styles.freeCard}>
          <div className={styles.cardHeader}>
            <span className={styles.tierBadgeFree}>
              <span aria-hidden="true">🟢</span> Personal Habit
            </span>
            <h2 className={styles.cardTitle}>Free</h2>
            <div className={styles.priceContainer}>
              <span className={styles.currencySymbol}>$</span>
              <span className={styles.priceValue}>0</span>
              <span className={styles.priceDuration}>/month</span>
            </div>
            <p className={styles.cardDescription}>
              Perfect for casual, daily manual logging and personal budget tracking.
            </p>
          </div>

          <hr className={styles.divider} />

          {/* WHY THIS FIX WAS MADE: Uses string content as unique map keys instead of array indices
              to maintain proper React DOM reconciliation standards and adds aria-hidden to decorative icons. */}
          <ul className={styles.featureList}>
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className={styles.featureItem}>
                <span className={styles.checkmarkIconCheck} aria-hidden="true">✓</span>
                <span className={styles.featureText}>{feature}</span>
              </li>
            ))}
          </ul>

          <Link href="/signup" className={styles.freeButton}>
            Get Started Free
          </Link>
        </div>

        {/* --- CARD B: PRO TIER --- */}
        <div className={styles.proCard}>
          
          <div className={styles.floatingBadge}>
            <span aria-hidden="true">⚡</span> Power Automation Hub
          </div>

          <div className={styles.cardHeader}>
            <span className={styles.tierBadgePro}>
              <span aria-hidden="true">🟣</span> Automation Core
            </span>
            <h2 className={styles.cardTitle}>Pro Upgrade</h2>
            <div className={styles.priceContainer}>
              <span className={styles.currencySymbol}>$</span>
              <span className={styles.priceValue}>9</span>
              <span className={styles.priceDuration}>/month</span>
            </div>
            <p className={styles.cardDescription}>
              Designed for freelancers and power users who demand lightning-fast automation.
            </p>
          </div>

          <hr className={styles.divider} />

          <ul className={styles.featureListPro}>
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className={styles.featureItem}>
                <span className={styles.checkmarkIconPro} aria-hidden="true">✦</span>
                <span className={styles.featureTextPro}>{feature}</span>
              </li>
            ))}
          </ul>

          <Link href="/beta" className={styles.proButton}>
            Unlock Power Automation
          </Link>
        </div>

      </div>
    </section>
  );
}
/* === SECTION 3 END === */