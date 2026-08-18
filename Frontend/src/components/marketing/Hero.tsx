/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import Link from "next/link";
import styles from "./Hero.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HERO COMPONENT (SERVER COMPONENT) ===
   ========================================================================== */
export default function Hero() {
  return (
    <section className={styles.heroContainer} aria-label="Daily Expense Tracker Overview">
      <div className={styles.heroContent}>
        
        {/* ==================== LEFT COLUMN: SEO HEADLINE & INTRO ==================== */}
        <div className={styles.leftCol}>
          <div className={styles.badge}>
            <span aria-hidden="true">✨</span> The Simple Daily Expense Tracker
          </div>
          
          <h1 className={styles.title}>
            Smart Money Tracking. <br />
            <span className={styles.gradientText}>Zero Headaches.</span>
          </h1>
          
          <p className={styles.subtitle}>
            Juggling rent, daily meals, and a growing side hustle? RakhoKhaata makes managing cash 
            effortless. Record transactions with a click, protect your private vault with a PIN, 
            and chat with an AI Buddy built to help you grow.
          </p>
          
          <div className={styles.buttonGroup}>
            <Link href="/signup" className={styles.primaryBtn}>
              Start Tracking Free <span className={styles.btnArrow} aria-hidden="true">→</span>
            </Link>

            <a 
              href="https://www.youtube.com/watch?v=v6bx9g-mqyo" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.secondaryBtn}
            >
              Watch 2-Min Demo
            </a>
          </div>

          <div className={styles.trustRow}>
            <span>✓ 100% Free to Start</span>
            <span>•</span>
            <span>✓ Multi-Currency (PKR, USD, EUR)</span>
            <span>•</span>
            <span>✓ No Accounting Jargon</span>
          </div>
        </div>
        {/* ==================== LEFT COLUMN END ==================== */}

        {/* ==================== RIGHT COLUMN: INTERACTIVE 3D DASHBOARD PREVIEW ==================== */}
        <div className={styles.rightCol} aria-hidden="true">
          <div className={styles.scene3D}>
            <div className={styles.mockupStack}>
              
              {/* Layer 1: Main Ledger Preview */}
              <div className={`${styles.card} ${styles.mainDashboard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Today&apos;s Daily Log</span>
                  <span className={styles.workspaceTag}>Personal Workspace</span>
                </div>
                
                <div className={styles.ledgerRow}>
                  <div className={styles.ledgerIcon}>🍔</div>
                  <div className={styles.ledgerInfo}>
                    <p className={styles.ledgerName}>Lunch at the Office</p>
                    <p className={styles.ledgerCategory}>Food & Dining</p>
                  </div>
                  <span className={`${styles.ledgerAmount} ${styles.negative}`}>-Rs 1,200</span>
                </div>

                <div className={styles.ledgerRow}>
                  <div className={styles.ledgerIcon}>🏠</div>
                  <div className={styles.ledgerInfo}>
                    <p className={styles.ledgerName}>Monthly Apartment Rent</p>
                    <p className={styles.ledgerCategory}>Fixed Housing</p>
                  </div>
                  <span className={`${styles.ledgerAmount} ${styles.negative}`}>-Rs 45,000</span>
                </div>

                <div className={styles.ledgerRow}>
                  <div className={styles.ledgerIcon}>💻</div>
                  <div className={styles.ledgerInfo}>
                    <p className={styles.ledgerName}>Side-Hustle Project</p>
                    <p className={styles.ledgerCategory}>Client Revenue (USD)</p>
                  </div>
                  <span className={`${styles.ledgerAmount} ${styles.positive}`}>+$450.00</span>
                </div>
              </div>

              {/* Layer 2: Floating AI Buddy Tip */}
              <div className={`${styles.card} ${styles.aiBuddyCard}`}>
                <div className={styles.aiHeader}>
                  <span className={styles.aiAvatar}>🤖</span>
                  <p className={styles.miniTitle}>AI Money Buddy</p>
                </div>
                <p className={styles.aiTipText}>
                  &ldquo;You saved 18% more this week on groceries! Safe to spend: <strong>Rs 8,500</strong>.&rdquo;
                </p>
              </div>

              {/* Layer 3: Floating Safe Vault Pill */}
              <div className={`${styles.card} ${styles.floatingAlert}`}>
                <span className={styles.lockIcon}>🔒</span>
                <span className={styles.alertText}>Investment Vault: Locked</span>
              </div>

            </div>
          </div>
        </div>
        {/* ==================== RIGHT COLUMN END ==================== */}

      </div>
    </section>
  );
}