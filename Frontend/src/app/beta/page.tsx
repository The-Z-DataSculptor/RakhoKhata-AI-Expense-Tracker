// src/app/beta/page.tsx
import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Early Access | RakhoKhata",
  description: "RakhoKhata is currently in Open Beta. Create your free account today!",
};

/* ==========================================================================
   === INLINE SVG VECTOR ICONS (Zero external package dependencies) ===
   ========================================================================== */
const Icons = {
  Sparkles: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
    </svg>
  ),
  Folder: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L8.6 3.3A2 2 0 0 0 7.1 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10"/>
      <line x1="18" x2="18" y1="20" y2="4"/>
      <line x1="6" x2="6" y1="20" y2="16"/>
    </svg>
  ),
  Globe: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
      <path d="M2 12h20"/>
    </svg>
  ),
  Cpu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2"/>
    </svg>
  ),
  SunMoon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  ),
};

export default function BetaPage() {
  return (
    <main className={styles.pageContainer}>
      <div className={styles.contentCard}>
        
        {/* Top Badge */}
        <div className={styles.badge}>
          <Icons.Sparkles /> RakhoKhata Early Access
        </div>

        {/* Headline */}
        <h1 className={styles.title}>
          You&apos;re Early! <br />
          <span className={styles.gradientText}>RakhoKhata is Free During Beta.</span>
        </h1>

        {/* Clear, simple subtext */}
        <p className={styles.subtitle}>
          We are putting the final touches on this page right now. In the meantime, our entire application is <strong>100% free</strong> for early users. Create an account today and start organizing your money in seconds.
        </p>

        {/* 6 Core Features List */}
        <div className={styles.featureGrid}>
          
          <div className={styles.featureItem}>
            <div className={styles.iconContainer}>
              <Icons.Folder />
            </div>
            <div>
              <strong>Multiple Workspaces</strong>
              <p>Keep personal and business money neatly separated.</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.iconContainer}>
              <Icons.ShieldCheck />
            </div>
            <div>
              <strong>Private Vaults</strong>
              <p>Keep your financial history safe and locked down.</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.iconContainer}>
              <Icons.BarChart />
            </div>
            <div>
              <strong>Easy Charts</strong>
              <p>See exactly where your money goes every month.</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.iconContainer}>
              <Icons.Globe />
            </div>
            <div>
              <strong>Multi-Currency</strong>
              <p>Track expenses in USD, PKR, EUR, and more.</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.iconContainer}>
              <Icons.Cpu />
            </div>
            <div>
              <strong>Smart AI Helper</strong>
              <p>Automatically spot wasted spending before it happens.</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.iconContainer}>
              <Icons.SunMoon />
            </div>
            <div>
              <strong>Dark & Light Theme</strong>
              <p>Looks smooth and feels fast on every device.</p>
            </div>
          </div>

        </div>

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <Link href="/signup" className={styles.primaryBtn}>
            Get Free Account <span className={styles.btnArrow}>→</span>
          </Link>

          <Link href="/" className={styles.secondaryBtn}>
            ← Back to Home
          </Link>
        </div>

      </div>
    </main>
  );
}