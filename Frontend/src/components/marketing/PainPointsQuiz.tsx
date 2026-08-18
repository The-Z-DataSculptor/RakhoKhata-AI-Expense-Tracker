// D:\Developer\Expense-Tracker\Frontend\src\components\marketing\PainPointsQuiz.tsx //

"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import styles from "./PainPointsQuiz.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & DATA CONTRACTS ===
   ========================================================================== */
type QuizOption = {
  id: "workspaces" | "budgets" | "ai-insights" | "vault";
  label: string;
  feature: string;
  badge: string;
  fix: string;
};

const QUIZ_OPTIONS: QuizOption[] = [
  {
    id: "workspaces",
    label: "My side-hustle money is completely mixed up with my home bills.",
    feature: "Dual Workspaces (Home & Hustle)",
    badge: "Total Separation",
    fix: "Keep personal groceries and rent strictly separate from client payments and business expenses. Switch between them in 1 click.",
  },
  {
    id: "budgets",
    label: "I eat out or buy coffee during work and overspend by mid-month.",
    feature: "Visual Safe-to-Spend Limits",
    badge: "Zero Overspending",
    fix: "Set a clear food and lunch budget. A simple green-to-red bar shows you exactly how much is safe to spend today.",
  },
  {
    id: "ai-insights",
    label: "Spreadsheets take too long and accounting terms confuse me.",
    feature: "AI Companion in Plain English",
    badge: "Instant Clarity",
    fix: "No formulas needed. Just ask your AI Buddy 'Where did my salary go this week?' and get simple, friendly answers.",
  },
  {
    id: "vault",
    label: "I want to track gold, savings, or crypto without family seeing it.",
    feature: "PIN-Locked Investment Vault",
    badge: "Bank-Grade Privacy",
    fix: "Protect your long-term assets, savings, and investments behind a private 4-digit security PIN on shared devices.",
  },
];
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function PainPointsQuizSection() {
  const [selectedOption, setSelectedOption] = useState<QuizOption | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const activeFocus = selectedOption?.id ?? hoveredOption ?? "workspaces";

  return (
    <section className={styles.sectionContainer} aria-label="Interactive Problem Solver">
      {/* SEO Section Header */}
      <div className={styles.sectionHeaderWrap}>
        <span className={styles.sectionPill}>Built for Real Life</span>
        <h2 className={styles.sectionTitle}>
          Everyday Money Headaches? <br />
          <span className={styles.accentText}>Solved in Seconds.</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          Select what frustrates you most about tracking cash to see how RakhoKhaata makes it effortless.
        </p>
      </div>

      <div className={styles.layoutGridContainer}>
        
        {/* LEFT COLUMN: INTERACTIVE QUIZ CARD */}
        <div className={styles.leftColumn}>
          <div className={`${styles.quizCard} ${selectedOption ? styles.quizCardActive : ""}`}>
            {!selectedOption ? (
              <>
                <div className={styles.metaRow}>
                  <span className={styles.badge}>Interactive Check</span>
                </div>
                <h3 className={styles.cardHeading}>What is your biggest spending challenge right now?</h3>
                <p className={styles.cardSubtext}>Click your biggest hurdle below to reveal the instant fix:</p>
                
                <div className={styles.optionsStack} role="group" aria-label="Money pain points list">
                  {QUIZ_OPTIONS.map((opt) => (
                    <button 
                      key={opt.id} 
                      type="button"
                      className={`${styles.optionButton} ${activeFocus === opt.id ? styles.optionButtonActive : ""}`}
                      onClick={() => setSelectedOption(opt)}
                      onMouseEnter={() => setHoveredOption(opt.id)}
                      onMouseLeave={() => setHoveredOption(null)}
                      aria-pressed={activeFocus === opt.id}
                    >
                      <span className={styles.bullet} aria-hidden="true">→</span>
                      <span className={styles.buttonText}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.resultView} role="region" aria-live="polite">
                <div className={styles.metaRow}>
                  <span className={styles.successBadge}>✓ {selectedOption.badge}</span>
                </div>
                <h3 className={styles.cardHeading}>How RakhoKhaata Solves It</h3>
                
                <div className={styles.solutionTextWrapper}>
                  <label className={styles.boxLabel}>Dashboard Superpower</label>
                  <h4 className={styles.featureTitle}>{selectedOption.feature}</h4>
                  <p className={styles.fixDescription}>{selectedOption.fix}</p>
                </div>

                <button 
                  type="button" 
                  className={styles.resetButtonBox} 
                  onClick={() => {
                    setSelectedOption(null);
                    setHoveredOption(null);
                  }}
                >
                  <span className={styles.resetBullet} aria-hidden="true">←</span> Check another problem
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: VISUAL FEATURE MATRIX PREVIEW */}
        <div className={styles.rightColumn} aria-hidden="true">
          <div className={styles.matrixBrowserWindow}>
            
            <div className={styles.browserHeaderToolbar}>
              <div className={styles.dotsControlCluster}>
                <span className={styles.dotRed}></span>
                <span className={styles.dotYellow}></span>
                <span className={styles.dotGreen}></span>
              </div>
              <div className={styles.appTitleText}>RakhoKhaata Live Visual Matrix</div>
            </div>

            <div className={styles.matrixGridContainer}>
              
              {/* QUADRANT 1: WORKSPACES */}
              <div className={`${styles.quadrantBox} ${activeFocus === "workspaces" ? styles.quadrantHighlighted : ""}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode}>✦</span>
                  <span className={styles.quadTitleLabel}>Multi-Workspaces</span>
                </div>
                
                <div className={styles.mockWorkspaceLayout}>
                  <div className={styles.mockWorkspaceActive}>
                    <span className={styles.mockWsDotBusiness}></span>
                    <span className={styles.mockWsName}>Side-Hustle (USD)</span>
                    <span className={styles.mockWsCheck}>✓ Active</span>
                  </div>
                  <div className={styles.mockWorkspaceInactive}>
                    <span className={styles.mockWsDotPersonal}></span>
                    <span className={styles.mockWsName}>Family Home (PKR)</span>
                  </div>
                </div>
              </div>

              {/* QUADRANT 2: BUDGETS */}
              <div className={`${styles.quadrantBox} ${activeFocus === "budgets" ? styles.quadrantHighlighted : ""}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode}>↻</span>
                  <span className={styles.quadTitleLabel}>Daily Budget Pacing</span>
                </div>
                
                <div className={styles.mockBudgetLayout}>
                  <div className={styles.mockBudgetRow}>
                    <span className={styles.mockBudgetName}>Office Lunches</span>
                    <span className={styles.mockBudgetAmount}>Rs 4.2k / Rs 10k</span>
                  </div>
                  <div className={styles.mockBudgetTrack}>
                    <div className={styles.mockBudgetFill} style={{ width: "42%" }}></div>
                  </div>
                  <span className={styles.mockBudgetStatus}>Safe To Spend: Rs 5,800</span>
                </div>
              </div>

              {/* QUADRANT 3: AI INSIGHTS */}
              <div className={`${styles.quadrantBox} ${activeFocus === "ai-insights" ? styles.quadrantHighlighted : ""}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode}>⚡</span>
                  <span className={styles.quadTitleLabel}>AI Buddy Advice</span>
                </div>
                
                <div className={styles.mockAiLayout}>
                  <div className={styles.mockAiPersona}>Supportive Money Coach</div>
                  <div className={styles.mockAiBubble}>
                    &ldquo;You spent 12% less on groceries this week. Great pace toward your savings goal!&rdquo;
                  </div>
                </div>
              </div>

              {/* QUADRANT 4: INVESTMENT VAULT */}
              <div className={`${styles.quadrantBox} ${activeFocus === "vault" ? styles.quadrantHighlighted : ""}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode}>⚿</span>
                  <span className={styles.quadTitleLabel}>Private Vault</span>
                </div>
                
                <div className={styles.mockVaultLayout}>
                  <div className={styles.mockVaultLockIcon}>🔒</div>
                  <span className={styles.mockVaultTitle}>Protected With 4-Digit PIN</span>
                  <div className={styles.mockPinDots}>
                    <span className={styles.mockPinDotFilled}></span>
                    <span className={styles.mockPinDotFilled}></span>
                    <span className={styles.mockPinDotFilled}></span>
                    <span className={styles.mockPinDotFilled}></span>
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