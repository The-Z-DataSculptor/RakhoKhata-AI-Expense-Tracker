// src/components/ai-insights/AiChatConsole/AiChatConsole.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { FiMessageSquare, FiArrowRight, FiZap } from "react-icons/fi";
import styles from "./AiChatConsole.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface AiChatConsoleProps {
  activePersona: "auditor" | "coach" | "minimalist";
  onQueryStart: (queryText: string) => void;
  isExternalLoading: boolean;
}

interface SuggestionQuestion {
  id: string;
  buttonText: string;
  fullQuestion: string;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function AiChatConsole({ activePersona, onQueryStart, isExternalLoading }: AiChatConsoleProps) {
  // FIXED: Cleared out the extra opening parenthesis from the initial state parameter allocation
  const [inputValue, setInputValue] = useState<string>("");

  const clearSuggestionsCollection: SuggestionQuestion[] = [
    { 
      id: "q1", 
      buttonText: "🔍 Where am I wasting cash?", 
      fullQuestion: "Look at my spending and show me where I am wasting the most money this month." 
    },
    { 
      id: "q2", 
      buttonText: "🛒 Can I buy a desk upgrade?", 
      fullQuestion: "Can I afford to buy a 50,000 PKR desk upgrade next month based on my current savings?" 
    },
    { 
      id: "q3", 
      buttonText: "📱 Check my bills", 
      fullQuestion: "Scan my recurring bills and subscriptions to see if any prices went up." 
    }
  ];

  const handleSuggestionClick = (questionText: string) => {
    setInputValue(questionText);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isExternalLoading) return;

    // Send the input up to the parent page state coordinator
    onQueryStart(inputValue);
    setInputValue("");
  };

  const getBoxPlaceholderText = (): string => {
    if (activePersona === "auditor") return "Ask the Auditor: 'Where did I spend too much this week?'";
    if (activePersona === "coach") return "Ask the Coach: 'How can I save an extra 10,000 PKR?'";
    return "Ask the Minimalist: 'What monthly bills can I cancel right now?'";
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <section className={styles.consoleSectionFrame}>
      
      <div className={styles.consolePromptHeader}>
        <FiZap className={styles.sparkleIcon} size={14} />
        <h3 className={styles.consoleGroupTitle}>Ask Your Money AI</h3>
      </div>

      <form onSubmit={handleFormSubmit} className={styles.mainConsoleForm}>
        <div className={styles.inputFlexFieldBar}>
          
          <div className={styles.leftMessageIconBox}>
            <FiMessageSquare size={18} />
          </div>

          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={getBoxPlaceholderText()}
            disabled={isExternalLoading}
            className={styles.chatTextFieldInputElement}
          />

          <button 
            type="submit" 
            disabled={isExternalLoading || !inputValue.trim()}
            className={styles.submitExecuteButtonLauncher}
          >
            <span>{isExternalLoading ? "Thinking..." : "Ask AI"}</span>
            <FiArrowRight size={14} />
          </button>

        </div>
      </form>

      <div className={styles.suggestionsRowStack}>
        {clearSuggestionsCollection.map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={() => handleSuggestionClick(pill.fullQuestion)}
            disabled={isExternalLoading}
            className={styles.suggestionClickablePillBadge}
          >
            {pill.buttonText}
          </button>
        ))}
      </div>

    </section>
  );
}
/* === SECTION 4 END === */