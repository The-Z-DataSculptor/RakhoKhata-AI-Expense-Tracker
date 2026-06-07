// src/app/(marketing)/page.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import Hero from "../../components/marketing/Hero";
import PainPointsQuiz from "../../components/marketing/PainPointsQuiz"; 
import FeatureCommandCenter from "../../components/marketing/FeatureCommandCenter"; 
import PricingSection from "../../components/marketing/PricingSection"; 
import styles from "./page.module.css";
/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: MAIN HOME PAGE RENDER ===
   ========================================================================== */
export default function Home() {
  return (
    <main className={styles.main}>
      {/* Premium interactive Hero section */}
      <Hero />
      
      {/* Gamified financial checkup diagnostic widget */}
      <PainPointsQuiz />

      {/* Interactive workspace switcher, voice logging, and automation center */}
      <FeatureCommandCenter />

      {/* Asymmetric "Split Focus" Pricing Tier Section */}
      <PricingSection />
    </main>
  );
}
/* === SECTION 2 END === */