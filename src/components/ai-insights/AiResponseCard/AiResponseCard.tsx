// src/components/ai-insights/AiResponseCard/AiResponseCard.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiActivity, FiShield, FiTrendingUp } from "react-icons/fi";
import styles from "./AiResponseCard.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface AiResponseCardProps {
  isVisible: boolean;
  isLoading: boolean;
  activePersona: "auditor" | "coach" | "minimalist";
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function AiResponseCard({ isVisible, isLoading, activePersona }: AiResponseCardProps) {
  // Hide completely if not active
  if (!isVisible) return null;

  // Render different headers and icons depending on the persona chosen
  const renderHeaderContent = () => {
    if (activePersona === "auditor") {
      return (
        <>
          <FiShield className={styles.iconAuditor} size={16} />
          <span className={styles.personaTitleText}>Strict Auditor Assessment</span>
        </>
      );
    }
    if (activePersona === "coach") {
      return (
        <>
          <FiTrendingUp className={styles.iconCoach} size={16} />
          <span className={styles.personaTitleText}>Money Coach Suggestion</span>
        </>
      );
    }
    return (
      <>
        <FiActivity className={styles.iconMinimalist} size={16} />
        <span className={styles.personaTitleText}>Minimalist Review</span>
      </>
    );
  };

  // Simple and direct text answers for the frontend layout
  const getSummaryLine = (): string => {
    if (activePersona === "auditor") return "You are spending money too fast on non-essential things.";
    if (activePersona === "coach") return "Great job! You are on track to save more money this month.";
    return "We found 3 extra bills you can cancel right now to save space.";
  };

  const getDetailParagraph = (): string => {
    if (activePersona === "auditor") {
      return "Your ads and eating out categories went up sharply this week. You should lock your budget spending limits right now so you do not run out of cash before the month ends.";
    }
    if (activePersona === "coach") {
      return "Your saving habits look healthy this cycle. If you keep going at this speed, you will hit your savings goal 2 weeks early. Think about moving this extra money into your investment vault.";
    }
    return "You are paying for multiple online tools that do the same exact job. Trimming away the ones you do not use will easily save you 3,500 PKR every month.";
  };

  // Dynamic style selector class helper
  const getPersonaCardClass = (): string => {
    if (activePersona === "auditor") return styles.cardAuditor;
    if (activePersona === "coach") return styles.cardCoach;
    return styles.cardMinimalist;
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={`${styles.responseCardOuterBounds} ${getPersonaCardClass()}`}>
      
      {/* LOADING STATE DISPLAYED ON INPUT SUBMISSION LINKAGES */}
      {isLoading ? (
        <div className={styles.loadingPulseFrameContainer}>
          <div className={styles.animatedPulseDotElement} />
          <p className={styles.loadingStatusText}>Reading your workspace data logs...</p>
        </div>
      ) : (
        /* RENDER RESPONSIVE RESULTS MATRIX */
        <div className={styles.innerResultLayoutDeck}>
          
          {/* MICRO ZONE 1: ACTIVE PERSONA HEADER TITLE TAG */}
          <div className={styles.cardPersonaIdentityHeaderRow}>
            {renderHeaderContent()}
          </div>

          <div className={styles.textGroupingLayoutBlock}>
            {/* MICRO ZONE 2: BOLD HIGH CONTRAST QUICK SUMMARY STATEMENT */}
            <h4 className={styles.boldSummaryAlertBullet}>
              {getSummaryLine()}
            </h4>

            {/* MICRO ZONE 3: SIMPLE EXPLANATION STORY TEXT */}
            <p className={styles.cleanDetailParagraphDescription}>
              {getDetailParagraph()}
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
/* === SECTION 4 END === */