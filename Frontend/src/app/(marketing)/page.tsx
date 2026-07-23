// src/app/(marketing)/page.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import Hero from "../../components/marketing/Hero";
import PainPointsQuiz from "../../components/marketing/PainPointsQuiz";
import FeatureCommandCenter from "../../components/marketing/FeatureCommandCenter";
import PricingSection from "../../components/marketing/PricingSection";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MAIN LANDING PAGE COMPONENT ===
   ========================================================================== */
/**
 * The root marketing / landing page.
 *
 * WHY a separate marketing layout?
 * The marketing pages (home, beta, contact) share a different design
 * than the authenticated dashboard. Using the (marketing) route group
 * allows us to apply a distinct Navbar/Footer combination without
 * affecting the dashboard UI.
 */
export default function Home() {
  return (
    <main className={styles.main}>
      {/* Hero section with call‑to‑action */}
      <Hero />

      {/* Interactive financial health quiz */}
      <PainPointsQuiz />

      {/* Product feature showcase */}
      <FeatureCommandCenter />

      {/* Pricing plans */}
      <PricingSection />
    </main>
  );
}
/* === SECTION 2 END === */