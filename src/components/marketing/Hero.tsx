// src/components/Hero.tsx
/* ==================== IMPORTS START ==================== */
import styles from "./Hero.module.css";
/* ==================== IMPORTS END ====================== */

export default function Hero() {
  return (
    <section className={styles.heroContainer}>
      <div className={styles.heroContent}>
        
        {/* ==================== LEFT COLUMN START ==================== */}
        {/* Contains the primary value proposition, branding badge, and core CTAs */}
        <div className={styles.leftCol}>
          <div className={styles.badge}>✨ Introducing Rakho Khata v1.0</div>
          <h1 className={styles.title}>
            Smart Expense Tracking <br />
            <span className={styles.gradientText}>Made Effortless.</span>
          </h1>
          
          <p className={styles.subtitle}>
            Take complete control of your cash flow. Track metrics, organize digital 
            ledgers, and optimize your budgets with an automated system built for speed.
          </p>
          
          <div className={styles.buttonGroup}>
            <button className={styles.primaryBtn}>
              Start Free Trial <span className={styles.btnArrow}>→</span>
            </button>
            <button className={styles.secondaryBtn}>
              Watch Live Demo
            </button>
          </div>
        </div>
        {/* ==================== LEFT COLUMN END ==================== */}


        {/* ==================== RIGHT COLUMN START ==================== */}
        {/* Renders the interactive 3D layering card deck mockup stack */}
        <div className={styles.rightCol}>
          <div className={styles.scene3D}>
            <div className={styles.mockupStack}>
              
              {/* Layer 1: The Main Dashboard Transaction Canvas */}
              <div className={`${styles.card} ${styles.mainDashboard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Recent Ledgers</span>
                  <span className={styles.cardAction}>View All</span>
                </div>
                
                <div className={styles.ledgerRow}>
                  <div className={styles.ledgerIcon}>💻</div>
                  <div className={styles.ledgerInfo}>
                    <p className={styles.ledgerName}>SaaS Subscription</p>
                    <p className={styles.ledgerDate}>Fixed Expense</p>
                  </div>
                  <span className={`${styles.ledgerAmount} ${styles.negative}`}>-$49.00</span>
                </div>

                <div className={styles.ledgerRow}>
                  <div className={styles.ledgerIcon}>☕</div>
                  <div className={styles.ledgerInfo}>
                    <p className={styles.ledgerName}>Client Coffee Meetup</p>
                    <p className={styles.ledgerDate}>Business Dining</p>
                  </div>
                  <span className={`${styles.ledgerAmount} ${styles.negative}`}>-$14.50</span>
                </div>

                <div className={styles.ledgerRow}>
                  <div className={styles.ledgerIcon}>🚀</div>
                  <div className={styles.ledgerInfo}>
                    <p className={styles.ledgerName}>Stripe Payout</p>
                    <p className={styles.ledgerDate}>Project Revenue</p>
                  </div>
                  <span className={`${styles.ledgerAmount} ${styles.positive}`}>+$1,250.00</span>
                </div>
              </div>

              {/* Layer 2: Floating Expense Breakdown Chart (Overlapping) */}
              <div className={`${styles.card} ${styles.breakdownCard}`}>
                <p className={styles.miniTitle}>Monthly Velocity</p>
                <div className={styles.chartPlaceholder}>
                  <div className={`${styles.bar} ${styles.bar1}`} style={{ height: '40%' }}></div>
                  <div className={`${styles.bar} ${styles.bar2}`} style={{ height: '75%' }}></div>
                  <div className={`${styles.bar} ${styles.bar3}`} style={{ height: '55%' }}></div>
                  <div className={`${styles.bar} ${styles.bar4}`} style={{ height: '90%' }}></div>
                </div>
                <div className={styles.chartLabel}>
                  <span>Optimized</span>
                  <span className={styles.positiveText}>✓ 92%</span>
                </div>
              </div>

              {/* Layer 3: Floating Interactive Success Alert Capsule */}
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