// src/components/Hero.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import Link from "next/link";
import styles from "./Hero.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
// WHY THIS FIX WAS MADE: Removed unnecessary "use client" directive. Converting this component
// to a Next.js Server Component eliminates hydration JS bundle overhead and optimizes LCP speeds.
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
/* Static Server Component - No internal state hooks needed */
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
export default function Hero() {
  return (
    <section className={styles.heroContainer} aria-label="Platform Hero Overview">
      <div className={styles.heroContent}>
        
        {/* ==================== LEFT COLUMN START ==================== */}
        <div className={styles.leftCol}>
          <div className={styles.badge}>
            <span aria-hidden="true">✨</span> Introducing RakhoKhaata v1.0
          </div>
          
          <h1 className={styles.title}>
            Smarter Expense Tracking <br />
            <span className={styles.gradientText}>Built for Growth.</span>
          </h1>
          
          <p className={styles.subtitle}>
            Upgrade your financial habits. Switch seamlessly between workspaces, lock down your investment vault, and let our AI auditor find wasted spending before it happens.
          </p>
          
          <div className={styles.buttonGroup}>
            <Link href="/signup" className={styles.primaryBtn}>
              Start Free Trial <span className={styles.btnArrow} aria-hidden="true">→</span>
            </Link>

            <a 
              href="https://www.youtube.com/watch?v=v6bx9g-mqyo" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.secondaryBtn}
            >
              Watch Live Demo
            </a>
          </div>
        </div>
        {/* ==================== LEFT COLUMN END ==================== */}


        {/* ==================== RIGHT COLUMN START ==================== */}
        <div className={styles.rightCol} aria-hidden="true">
          <div className={styles.scene3D}>
            <div className={styles.mockupStack}>
              
              {/* Layer 1: Main Dashboard Canvas */}
              <div className={`${styles.card} ${styles.mainDashboard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Recent Ledgers</span>
                  <span className={styles.cardAction}>View All</span>
                </div>
                
                <div className={styles.ledgerRow}>
                  <div className={styles.ledgerIcon}>💻</div>
                  <div className={styles.ledgerInfo}>
                    <p className={styles.ledgerName}>SaaS Subscription</p>
                    <p className={styles.ledgerCategory}>Fixed Expense</p>
                  </div>
                  <span className={`${styles.ledgerAmount} ${styles.negative}`}>-$49.00</span>
                </div>

                <div className={styles.ledgerRow}>
                  <div className={styles.ledgerIcon}>☕</div>
                  <div className={styles.ledgerInfo}>
                    <p className={styles.ledgerName}>Client Coffee Meetup</p>
                    <p className={styles.ledgerCategory}>Business Dining</p>
                  </div>
                  <span className={`${styles.ledgerAmount} ${styles.negative}`}>-$14.50</span>
                </div>

                <div className={styles.ledgerRow}>
                  <div className={styles.ledgerIcon}>🚀</div>
                  <div className={styles.ledgerInfo}>
                    <p className={styles.ledgerName}>Stripe Payout</p>
                    <p className={styles.ledgerCategory}>Project Revenue</p>
                  </div>
                  <span className={`${styles.ledgerAmount} ${styles.positive}`}>+$1,250.00</span>
                </div>
              </div>

              {/* Layer 2: Floating Expense Breakdown Chart */}
              <div className={`${styles.card} ${styles.breakdownCard}`}>
                <p className={styles.miniTitle}>Monthly Velocity</p>
                <div className={styles.chartPlaceholder}>
                  <div className={`${styles.bar} ${styles.bar1}`} style={{ height: "40%" }}></div>
                  <div className={`${styles.bar} ${styles.bar2}`} style={{ height: "75%" }}></div>
                  <div className={`${styles.bar} ${styles.bar3}`} style={{ height: "55%" }}></div>
                  <div className={`${styles.bar} ${styles.bar4}`} style={{ height: "90%" }}></div>
                </div>
                <div className={styles.chartLabel}>
                  <span>Optimized</span>
                  <span className={styles.positiveText}>✓ 92%</span>
                </div>
              </div>

              {/* Layer 3: Floating Success Alert Capsule */}
              <div className={`${styles.card} ${styles.floatingAlert}`}>
                <div className={styles.alertPulse}></div>
                <span className={styles.alertText}>Income Saved to Ledger!</span>
              </div>

            </div>
          </div>
        </div>
        {/* ==================== RIGHT COLUMN END ==================== */}

      </div>
    </section>
  );
}
/* === SECTION 4 END === */