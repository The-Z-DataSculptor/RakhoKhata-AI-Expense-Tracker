// src/components/ai-insights/AiResponseCard/AiResponseCard.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiActivity, FiShield, FiTrendingUp, FiAlertCircle } from "react-icons/fi";
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
   === SECTION 3: COMPONENT LOGIC & RENDER ===
   ========================================================================== */
export function AiResponseCard({
  isVisible,
  isLoading,
  activePersona,
  response,
}: AiResponseCardProps) {
  if (!isVisible) return null;

  const isErrorResponse = typeof response === "string" && response.startsWith("Error:");

  const getIcon = () => {
    if (isErrorResponse) return <FiAlertCircle className={styles.iconAuditor} size={24} style={{ color: "#ef4444" }} />;
    if (activePersona === "auditor") return <FiShield className={styles.iconAuditor} size={24} />;
    if (activePersona === "coach") return <FiTrendingUp className={styles.iconCoach} size={24} />;
    return <FiActivity className={styles.iconMinimalist} size={24} />;
  };

  const getPersonaName = () => {
    if (isErrorResponse) return "System Alert";
    if (activePersona === "auditor") return "Auditor";
    if (activePersona === "coach") return "Coach";
    return "Minimalist";
  };

  const getCardThemeClass = () => {
    if (isErrorResponse) return styles.cardAuditor;
    if (activePersona === "auditor") return styles.cardAuditor;
    if (activePersona === "coach") return styles.cardCoach;
    return styles.cardMinimalist;
  };

  // WHY THIS FIX WAS MADE: Safely splits multi-line string responses by newlines to render formatted
  // paragraphs and list items cleanly without introducing risky innerHTML evaluation.
  const renderFormattedParagraphs = (rawText: string) => {
    if (!rawText) return "No response yet. Try asking a question!";

    const lines = rawText.split("\n").filter((line) => line.trim() !== "");
    return lines.map((paragraph, index) => (
      <p key={`resp-p-${index}`} className={styles.cleanDetailParagraphDescription}>
        {paragraph}
      </p>
    ));
  };

  return (
    <div className={`${styles.responseCardOuterBounds} ${getCardThemeClass()}`} role="region" aria-live="polite">
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
            {renderFormattedParagraphs(response)}
          </div>
        </div>
      )}
    </div>
  );
}
/* === SECTION 3 END === */