// src/components/marketing/PainPointsQuizSection.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import styles from "./PainPointsQuiz.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & CONSTANTS ===
   ========================================================================== */
type QuizOption = {
  id: string;
  label: string;
  feature: string;
  fix: string;
};

const QUIZ_OPTIONS: QuizOption[] = [
  {
    id: "workspaces",
    label: "Mixing personal expenses with my business spending is a mess.",
    feature: "Multi-Workspace Engine",
    fix: "Keep personal, freelance, and business transactions completely separate. Switch between them in one click.",
  },
  {
    id: "budgets",
    label: "I keep accidentally spending too much on certain categories.",
    feature: "Visual Budget Pacing",
    fix: "Set custom limits and instantly see if your spending is normal or pacing too fast for the month.",
  },
  {
    id: "ai-insights",
    label: "I do not have time to analyze where my money is leaking.",
    feature: "AI Money Coach",
    fix: "Your personal AI auditor scans your ledger to find wasted money and overspending automatically.",
  },
  {
    id: "vault",
    label: "I want to track investments, but keep them private on my phone.",
    feature: "Secure Investment Vault",
    fix: "Lock your sensitive crypto and stock details behind a secure, custom 4-digit PIN screen.",
  },
];
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function PainPointsQuizSection() {
  const [selectedOption, setSelectedOption] = useState<QuizOption | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const activeFocus = selectedOption?.id ?? hoveredOption;

  const handleSelect = (option: QuizOption) => {
    setSelectedOption(option);
  };

  const handleHoverStart = (optionId: string) => {
    setHoveredOption(optionId);
  };

  const handleHoverEnd = () => {
    setHoveredOption(null);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setHoveredOption(null);
  };
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <section className={styles.sectionContainer} aria-label="Interactive Problem Solver">
      <div className={styles.layoutGridContainer}>
        
        {/* LEFT COLUMN: INTERACTIVE QUIZ CARD */}
        <div className={styles.leftColumn}>
          <div className={`${styles.quizCard} ${selectedOption ? styles.quizCardActive : ""}`}>
            {!selectedOption ? (
              <>
                <div className={styles.metaRow}>
                  <span className={styles.badge}>Quick Platform Check</span>
                </div>
                <h3 className={styles.cardHeading}>What is your biggest money headache right now?</h3>
                <p className={styles.cardSubtext}>Pick a problem below to see how the RakhoKhata dashboard solves it.</p>
                
                {/* WHY THIS FIX WAS MADE: Added ARIA attributes for screen reader accessibility */}
                <div className={styles.optionsStack} role="group" aria-label="Money pain points list">
                  {QUIZ_OPTIONS.map((opt) => (
                    <button 
                      key={opt.id} 
                      type="button"
                      className={`${styles.optionButton} ${activeFocus === opt.id ? styles.optionButtonActive : ""}`}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => handleHoverStart(opt.id)}
                      onMouseLeave={handleHoverEnd}
                      aria-pressed={activeFocus === opt.id}
                    >
                      <span className={styles.bullet} aria-hidden="true">→</span>
                      <span className={styles.buttonText}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className={styles.resultView} role="region" aria-live="polite">
                  <div className={styles.metaRow}>
                    <span className={styles.successBadge}>Solution Found</span>
                  </div>
                  <h3 className={styles.cardHeading}>Your Feature Solution</h3>
                  
                  <div className={styles.solutionTextWrapper}>
                    <label className={styles.boxLabel}>Dashboard Tool</label>
                    <h4 className={styles.featureTitle}>{selectedOption.feature}</h4>
                    <p className={styles.fixDescription}>{selectedOption.fix}</p>
                  </div>

                  <button type="button" className={styles.resetButtonBox} onClick={handleReset}>
                    <span className={styles.resetBullet} aria-hidden="true">←</span> Look at other problems
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: VISUAL FEATURE MATRIX */}
        <div className={styles.rightColumn}>
          <div className={styles.matrixBrowserWindow}>
            
            <div className={styles.browserHeaderToolbar}>
              <div className={styles.dotsControlCluster}>
                <span className={styles.dotRed}></span>
                <span className={styles.dotYellow}></span>
                <span className={styles.dotGreen}></span>
              </div>
              <div className={styles.appTitleText}>Live Feature Preview</div>
            </div>

            <div className={styles.matrixGridContainer}>
              
              {/* QUADRANT 1: WORKSPACES */}
              <div className={`${styles.quadrantBox} ${activeFocus === "workspaces" ? styles.quadrantHighlighted : ""}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode} aria-hidden="true">✦</span>
                  <span className={styles.quadTitleLabel}>Q1 // Workspaces</span>
                </div>
                
                <div className={styles.mockWorkspaceLayout}>
                  <div className={styles.mockWorkspaceActive}>
                    <span className={styles.mockWsDotBusiness}></span>
                    <span className={styles.mockWsName}>Business Profile</span>
                    <span className={styles.mockWsCheck} aria-hidden="true">✓</span>
                  </div>
                  <div className={styles.mockWorkspaceInactive}>
                    <span className={styles.mockWsDotPersonal}></span>
                    <span className={styles.mockWsName}>Personal Finances</span>
                  </div>
                </div>
              </div>

              {/* QUADRANT 2: BUDGETS */}
              <div className={`${styles.quadrantBox} ${activeFocus === "budgets" ? styles.quadrantHighlighted : ""}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode} aria-hidden="true">↻</span>
                  <span className={styles.quadTitleLabel}>Q2 // Budget Pacing</span>
                </div>
                
                <div className={styles.mockBudgetLayout}>
                  <div className={styles.mockBudgetRow}>
                    <span className={styles.mockBudgetName}>Marketing Ads</span>
                    <span className={styles.mockBudgetAmount}>$12k / $30k</span>
                  </div>
                  <div className={styles.mockBudgetTrack}>
                    <div className={styles.mockBudgetFill} style={{ width: "40%" }}></div>
                  </div>
                  <span className={styles.mockBudgetStatus}>Pacing Normal</span>
                </div>
              </div>

              {/* QUADRANT 3: AI INSIGHTS */}
              <div className={`${styles.quadrantBox} ${activeFocus === "ai-insights" ? styles.quadrantHighlighted : ""}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode} aria-hidden="true">⚡</span>
                  <span className={styles.quadTitleLabel}>Q3 // AI Insights</span>
                </div>
                
                <div className={styles.mockAiLayout}>
                  <div className={styles.mockAiPersona}>Strict Auditor</div>
                  <div className={styles.mockAiBubble}>
                    Warning: You have spent 15% more on food subscriptions this week. Do you want me to list them?
                  </div>
                </div>
              </div>

              {/* QUADRANT 4: INVESTMENT VAULT */}
              <div className={`${styles.quadrantBox} ${activeFocus === "vault" ? styles.quadrantHighlighted : ""}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode} aria-hidden="true">⚿</span>
                  <span className={styles.quadTitleLabel}>Q4 // Secure Vault</span>
                </div>
                
                <div className={styles.mockVaultLayout}>
                  <div className={styles.mockVaultLockIcon} aria-hidden="true">🔒</div>
                  <span className={styles.mockVaultTitle}>Vault Locked</span>
                  <div className={styles.mockPinDots}>
                    <span className={styles.mockPinDotFilled}></span>
                    <span className={styles.mockPinDotFilled}></span>
                    <span className={styles.mockPinDotEmpty}></span>
                    <span className={styles.mockPinDotEmpty}></span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
/* === SECTION 4 END === */