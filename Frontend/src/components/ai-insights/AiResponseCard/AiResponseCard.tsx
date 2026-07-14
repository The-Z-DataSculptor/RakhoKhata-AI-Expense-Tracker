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
  response: string;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function AiResponseCard({
  isVisible,
  isLoading,
  activePersona,
  response,
}: AiResponseCardProps) {
  if (!isVisible) return null;

  // UPGRADED: Icons increased to size 24 to match the grander text
  const getIcon = () => {
    if (activePersona === "auditor") return <FiShield className={styles.iconAuditor} size={24} />;
    if (activePersona === "coach") return <FiTrendingUp className={styles.iconCoach} size={24} />;
    return <FiActivity className={styles.iconMinimalist} size={24} />;
  };

  const getPersonaName = () => {
    if (activePersona === "auditor") return "Auditor";
    if (activePersona === "coach") return "Coach";
    return "Minimalist";
  };

  const getCardThemeClass = () => {
    if (activePersona === "auditor") return styles.cardAuditor;
    if (activePersona === "coach") return styles.cardCoach;
    return styles.cardMinimalist;
  };

  return (
    <div className={`${styles.responseCardOuterBounds} ${getCardThemeClass()}`}>
      {isLoading ? (
        <div className={styles.loadingPulseFrameContainer}>
          <div className={styles.animatedPulseDotElement} />
          <p className={styles.loadingStatusText}>Thinking about your question...</p>
        </div>
      ) : (
        <div className={styles.innerResultLayoutDeck}>
          <div className={styles.cardPersonaIdentityHeaderRow}>
            {getIcon()}
            <span className={styles.personaTitleText}>{getPersonaName()} Says:</span>
          </div>
          <div className={styles.textGroupingLayoutBlock}>
            <p className={styles.cleanDetailParagraphDescription}>
              {response || "No response yet. Try asking a question!"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
/* === SECTION 4 END === */