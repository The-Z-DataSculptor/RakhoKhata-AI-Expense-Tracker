// src/app/(dashboard)/dashboard/ai-insights/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { AiChatConsole } from "@/components/ai-insights/AiChatConsole/AiChatConsole";
import { AiResponseCard } from "@/components/ai-insights/AiResponseCard/AiResponseCard";
import { AiLeakWarnings } from "@/components/ai-insights/AiLeakWarnings/AiLeakWarnings";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
type AdvisorPersona = "auditor" | "coach" | "minimalist";
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function AiInsightsPage() {
  // --- WORKSPACE TRACKING ENGINE ---
  const { activeWorkspaceId } = useWorkspace();

  // --- STATE PARAMETERS ---
  const [activePersona, setActivePersona] = useState<AdvisorPersona>("auditor");
  
  // States to control the response card loading and visibility loops
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCardVisible, setIsCardVisible] = useState<boolean>(false);

  // Callback triggered when a user submits an AI question
  const handleQuerySubmit = (queryText: string) => {
    setIsCardVisible(true);
    setIsLoading(true);
    
    // Passes the active workspace ID cleanly along with the question context
    console.log(`Querying Gemini for Workspace: ${activeWorkspaceId} | Question: "${queryText}"`);

    // Simulate Gemini API processing timeline
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.insightsPageContainer}>
      
      {/* MASTER HEADER SECTION AREA: Wrapped inside the consistent white container block */}
      <header className={styles.insightsMainHeaderCardBox}>
        <div className={styles.titleTextGroup}>
          
          {/* Unified horizontal row keeping the Live Analytics status token in front of the headline */}
          <div className={styles.titleWithBadgeRow}>
            <h1 className={styles.mainTitleHeading}>AI Money Insights</h1>
            <span className={styles.liveAnalyticsBadgeElement}>Live Analytics</span>            
          </div>
          
          <p className={styles.subtitleDescription}>
            The AI checks your spending to find wasted money, tell you if you can afford things, and help you save more.
          </p>
        </div>

        {/* AI COACH PERSONA SWITCHER */}
        <div className={styles.personaControlFrame}>
          <label className={styles.personaControlLabel}>AI Personality:</label>
          <div className={styles.personaPillsDeck}>
            <button 
              type="button" 
              className={`${styles.personaPillBtn} ${activePersona === "auditor" ? styles.personaActiveAuditor : ""}`}
              onClick={() => setActivePersona("auditor")}
            >
              Strict Auditor
            </button>
            <button 
              type="button" 
              className={`${styles.personaPillBtn} ${activePersona === "coach" ? styles.personaActiveCoach : ""}`}
              onClick={() => setActivePersona("coach")}
            >
              Money Coach
            </button>
            <button 
              type="button" 
              className={`${styles.personaPillBtn} ${activePersona === "minimalist" ? styles.personaActiveMinimalist : ""}`}
              onClick={() => setActivePersona("minimalist")}
            >
              Minimalist
            </button>
          </div>
        </div>
      </header>

      {/* INTERACTIVE CHAT AND QUESTION CONSOLE BLOCK */}
      <AiChatConsole 
        activePersona={activePersona} 
        onQueryStart={handleQuerySubmit}
        isExternalLoading={isLoading}
      />

      {/* DYNAMIC RESPONSE CARD GENERATOR */}
      <AiResponseCard 
        isVisible={isCardVisible}
        isLoading={isLoading}
        activePersona={activePersona}
      />

      {/* AUTOMATED CATEGORY OVERSPEND WARNING CARDS GRID */}
      <AiLeakWarnings />

      {/* SYSTEM REGULAR FOOTER ANCHOR WRAPPER */}
      <footer className={styles.footerContainerBlock}>
        <DashboardFooter />
      </footer>

    </div>
  );
}
/* === SECTION 4 END === */