// src/components/ai-insights/AiChatConsole/AiChatConsole.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useCallback } from "react"; // OPTIMIZED: Added useCallback to insulate event side-effects for the React Compiler
import { FiMessageSquare, FiArrowRight, FiZap } from "react-icons/fi";
import { toast } from "sonner"; // NEW: Imported the global notification engine hook
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

  // OPTIMIZED: Memoized click behavior loop tracking parameter changes cleanly
  const handleSuggestionClick = useCallback((questionText: string) => {
    setInputValue(questionText);
  }, []);

  // Handle analytical toast text compilation safely
  const triggerTelemetryToast = useCallback((persona: "auditor" | "coach" | "minimalist") => {
    if (persona === "auditor") {
      toast.info("AI Auditor is scanning your accounting ledger history...");
    } else if (persona === "coach") {
      toast.info("AI Money Coach is auditing your cash flow models...");
    } else {
      toast.info("AI Minimalist is processing subscription pipelines...");
    }
  }, []);

  // Action: What happens when the user hits "Ask AI"
  // OPTIMIZED: Wrapped in useCallback to declare this safely as an event handler block to the compiler
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isExternalLoading) return;

    // 1. Fire up a descriptive contextual notification banner matching the current active model
    triggerTelemetryToast(activePersona);

    // 2. Send the input up to the parent page state coordinator
    onQueryStart(inputValue.trim());
    
    // 3. Clear the input container field
    setInputValue("");
  }, [inputValue, isExternalLoading, activePersona, onQueryStart, triggerTelemetryToast]);

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