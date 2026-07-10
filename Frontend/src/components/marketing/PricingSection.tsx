/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
// Import the CSS module for local scoped styling
import styles from "./PricingSection.module.css";

/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: DATA STRUCTURES (THE FEATURE LISTS) ===
   ========================================================================== */
// This section houses the raw data arrays for our features. 
// Keeping this out of the JSX layout makes the code much cleaner and easier to maintain later!

const freeFeatures = [
  "Up to 700 transaction entries every single month",
  "Up to 3 individual multi-purpose Workspaces",
  "Free Workspace sharing with family & co-workers",
  "Password-Locked Asset Vault (Hide balances from family)",
  "Automated Email Renewal alerts for subscriptions (Netflix)",
  "Live multi-currency conversion tools",
  "Basic read-only email snapshot links"
];

const proFeatures = [
  "Everything in Free, plus:",
  "Unlimited Workspaces & transaction entries forever",
  "Smart OCR Receipt Scanner (Snap photos to auto-log)",
  "AI Hands-Free Voice Logging inputs",
  "Interactive Shared Split Ledgers (Read/Write via WhatsApp & Email)",
  "Advanced multi-day automated debt tracking pipelines"
];

/* === SECTION 2 END === */


/* ==========================================================================
   === SECTION 3: MAIN RENDERING LAYOUT COMPONENT ===
   ========================================================================== */
export default function PricingSection() {
  return (
    // Added id="pricing" for smooth scroll navigation
    <section id="pricing" className={styles.pricingWrapper}>
      
      {/* HEADER ZONE: Holds the main titles guiding the client */}
      <div className={styles.headerBlock}>
        <h1 className={styles.mainTitle}>Choose Your Financial Freedom Plan</h1>
        <p className={styles.subTitle}>
          Build an unbreakable tracking habit for free, or unlock automation engine upgrades.
        </p>
      </div>

      {/* THE ASYMMETRIC GRID: Houses the 40% / 60% Split Layout cards */}
      <div className={styles.splitGridLayout}>
        
        {/* --- CARD A START: FREE TIER (40% Width) --- */}
        {/* Educational Note: This card acts as the structural baseline anchors */}
        <div className={styles.freeCard}>
          <div className={styles.cardHeader}>
            <span className={styles.tierBadgeFree}>🟢 Personal Habit</span>
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

          {/* Feature List Rendering Loop */}
          <ul className={styles.featureList}>
            {freeFeatures.map((feature, index) => (
              <li key={index} className={styles.featureItem}>
                {/* Clean, descriptive inline text checkmarks */}
                <span className={styles.checkmarkIconCheck}>✓</span>
                <span className={styles.featureText}>{feature}</span>
              </li>
            ))}
          </ul>

          <button className={styles.freeButton}>
            Get Started Free
          </button>
        </div>
        {/* --- CARD A END: FREE TIER --- */}


        {/* --- CARD B START: PRO TIER (60% Width & Elevated Status) --- */}
        {/* Educational Note: This card uses premium gradient shadows and extra space to look powerful */}
        <div className={styles.proCard}>
          
          {/* Floating Premium Badge Action */}
          <div className={styles.floatingBadge}>
            ⚡ Power Automation Hub
          </div>

          <div className={styles.cardHeader}>
            <span className={styles.tierBadgePro}>🟣 Automation Core</span>
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

          {/* Feature List Rendering Loop */}
          <ul className={styles.featureListPro}>
            {proFeatures.map((feature, index) => (
              <li key={index} className={styles.featureItem}>
                {/* Dynamic visual distinction: Pro bullet point matches the primary accent */}
                <span className={styles.checkmarkIconPro}>✦</span>
                <span className={styles.featureTextPro}>{feature}</span>
              </li>
            ))}
          </ul>

          <button className={styles.proButton}>
            Unlock Power Automation
          </button>
        </div>
        {/* --- CARD B END: PRO TIER --- */}

      </div>
    </section>
  );
}
/* === SECTION 3 END === */