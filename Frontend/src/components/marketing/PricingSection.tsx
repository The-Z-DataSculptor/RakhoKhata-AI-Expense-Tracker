"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & MODULE CONSTANTS ===
   ========================================================================== */
import React from "react";
import Link from "next/link";
import { useLocalizedPrice } from "@/hooks/useLocalizedPrice";
import styles from "./PricingSection.module.css";

const FREE_FEATURES = [
  "Up to 700 daily transaction entries every month",
  "Separate Personal & Business Workspaces",
  "Live multi-currency conversions (PKR, USD, EUR, etc.)",
  "PIN-Locked Private Investment Vault",
  "Safe-to-Spend visual daily & monthly budget bars",
  "100% Free forever — no credit card needed",
] as const;

const PRO_FEATURES = [
  "Everything in the Free plan, plus:",
  "Unlimited Workspaces & unlimited monthly transactions",
  "AI Receipt Scanner (Snap photos of paper bills to auto-log)",
  "Conversational AI Money Companion (Plain English financial advice)",
  "Recurring bill reminders & subscription leak alerts",
  "Export complete ledger history to Excel / CSV spreadsheets",
] as const;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: PRICING SECTION COMPONENT (CLIENT COMPONENT) ===
   ========================================================================== */
export default function PricingSection() {
  const { currencySymbol, currencyCode, proPrice, flag } = useLocalizedPrice(6);

  return (
    <section id="pricing" className={styles.pricingWrapper} aria-label="Transparent Pricing Plans">
      
      {/* HEADER ZONE */}
      <div className={styles.headerBlock}>
        <div className={styles.sectionBadge}>Honest & Transparent</div>
        <h2 className={styles.mainTitle}>Simple Pricing for Real People</h2>
        <p className={styles.subTitle}>
          Start building your daily money habit for free. Upgrade whenever you want instant AI receipt scanning and automated insights.
        </p>
      </div>

      {/* THE ASYMMETRIC GRID: Houses the 40% / 60% Split Layout cards */}
      <div className={styles.splitGridLayout}>
        
        {/* --- CARD A: FREE TIER --- */}
        <div className={styles.freeCard}>
          <div className={styles.cardHeader}>
            <span className={styles.tierBadgeFree}>
              <span aria-hidden="true">🟢</span> Always Free
            </span>
            <h3 className={styles.cardTitle}>Free Starter</h3>
            <div className={styles.priceContainer}>
              <span className={styles.currencySymbol}>{currencySymbol}</span>
              <span className={styles.priceValue}>0</span>
              <span className={styles.priceDuration}>/forever</span>
            </div>
            <p className={styles.cardDescription}>
              Everything you need to track daily meals, groceries, rent, and family cash flow without spending a penny.
            </p>
          </div>

          <hr className={styles.divider} />

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

        {/* --- CARD B: PRO AUTOMATION TIER --- */}
        <div className={styles.proCard}>
          
          <div className={styles.floatingBadge}>
            <span aria-hidden="true">⚡</span> Most Popular for Busy Pros
          </div>

          <div className={styles.cardHeader}>
            <span className={styles.tierBadgePro}>
              <span aria-hidden="true">🟣</span> AI Power Suite
            </span>
            <h3 className={styles.cardTitle}>RakhoKhaata Pro</h3>
            <div className={styles.priceContainer}>
              <span className={styles.currencySymbol}>{currencySymbol}</span>
              <span className={styles.priceValue}>{proPrice}</span>
              <span className={styles.priceDuration}>/month ({flag} {currencyCode})</span>
            </div>
            <p className={styles.cardDescription}>
              For remote workers, busy parents, and side-hustlers who want AI to scan receipts and find wasted money automatically.
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

          <Link href="/signup" className={styles.proButton}>
            Try Pro with 14-Day Free Trial
          </Link>
        </div>

      </div>
    </section>
  );
}
/* === SECTION 2 END === */