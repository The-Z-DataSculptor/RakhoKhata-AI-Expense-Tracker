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
  isDataReady: boolean;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function AiChatConsole({
  activePersona,
  onQueryStart,
  isExternalLoading,
  isDataReady,
}: AiChatConsoleProps) {
  const [inputValue, setInputValue] = useState<string>("");

  const suggestions = [
    { id: "q1", label: "🔍 Where am I wasting money?", question: "Show me where I'm wasting money this month." },
    { id: "q2", label: "🛒 Can I buy a new desk?", question: "Can I afford a 50,000 PKR desk next month?" },
    { id: "q3", label: "📱 Check my bills", question: "Check my bills and subscriptions for price increases." },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isExternalLoading || !isDataReady) return;
    onQueryStart(inputValue.trim());
    setInputValue("");
  };

  const getPlaceholder = () => {
    if (!isDataReady) return "Loading database connection...";
    if (activePersona === "auditor") return "Ask the Auditor: 'Where did I overspend?'";
    if (activePersona === "coach") return "Ask the Coach: 'How can I save more?'";
    return "Ask the Minimalist: 'What bills can I cancel?'";
  };

  return (
    <section className={styles.consoleSectionFrame}>
      <div className={styles.consolePromptHeader}>
        <FiZap className={styles.sparkleIcon} size={18} />
        <h3 className={styles.consoleGroupTitle}>Ask Your AI</h3>
      </div>

      <form onSubmit={handleSubmit} className={styles.mainConsoleForm}>
        <div className={styles.inputFlexFieldBar}>
          <div className={styles.leftMessageIconBox}>
            <FiMessageSquare size={20} />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isExternalLoading || !isDataReady}
            className={styles.chatTextFieldInputElement}
            aria-label="Ask your AI assistant"
          />
          <button
            type="submit"
            disabled={isExternalLoading || !inputValue.trim() || !isDataReady}
            className={styles.submitExecuteButtonLauncher}
            aria-label="Submit query"
          >
            <span>{isExternalLoading ? "Thinking..." : "Ask"}</span>
            <FiArrowRight size={16} />
          </button>
        </div>
      </form>

      <div className={styles.suggestionsRowStack}>
        {suggestions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setInputValue(item.question)}
            disabled={isExternalLoading || !isDataReady}
            className={styles.suggestionClickablePillBadge}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
/* === SECTION 3 END === */