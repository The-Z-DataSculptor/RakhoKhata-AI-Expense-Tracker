// src/app/(dashboard)/dashboard/ai-insights/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AiChatConsole } from "@/components/ai-insights/AiChatConsole/AiChatConsole";
import { AiResponseCard } from "@/components/ai-insights/AiResponseCard/AiResponseCard";
import { AiLeakWarnings } from "@/components/ai-insights/AiLeakWarnings/AiLeakWarnings";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { transactionService, budgetService, Transaction, Budget, aiService } from "@/utils/api";
import { toast } from "sonner";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
type AdvisorPersona = "auditor" | "coach" | "minimalist";

interface WarningItem {
  id: string;
  categoryName: string;
  severity: "high" | "medium";
  overspendAmount: string;
  simpleDescription: string;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function AiInsightsPage() {
  const { activeWorkspaceId } = useWorkspace();
  const { formatAmount, convertAmount, currency } = useCurrency();

  const [activePersona, setActivePersona] = useState<AdvisorPersona>("auditor");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCardVisible, setIsCardVisible] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string>("");

  // --- LOCAL DATA STATES (Used strictly for visual Warnings list) ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  // WHY THIS FIX WAS MADE: Initialized to false to eliminate synchronous setState calls inside effect guard bodies
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  // Maintains a ref to track the latest active request token, preventing race conditions
  const activeRequestRef = useRef<number>(0);

  // Fetch real data safely with unmount safeguards when workspace changes
  useEffect(() => {
    let isMounted = true;
    if (!activeWorkspaceId) {
      return;
    }

    const fetchData = async () => {
      if (isMounted) setIsDataLoading(true);
      try {
        const [txData, budgetData] = await Promise.all([
          transactionService.getByWorkspace(activeWorkspaceId),
          budgetService.getByWorkspace(activeWorkspaceId),
        ]);
        if (isMounted) {
          setTransactions(txData.transactions || []);
          setBudgets(budgetData.budgets || []);
        }
      } catch {
        if (isMounted) {
          toast.error("Could not load your data. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsDataLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId]);

  // --- COMPUTE WARNINGS FROM REAL DATA (Client UI decoration only) ---
  const warnings = useMemo<WarningItem[]>(() => {
    if (!transactions.length || !budgets.length) return [];

    const categorySpent: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type !== "EXPENSE") return;
      const catName = tx.category?.name || "Uncategorized";
      const amount = convertAmount(
        Number(tx.originalAmount || 0),
        tx.originalCurrency || "USD",
        currency
      );
      categorySpent[catName] = (categorySpent[catName] || 0) + amount;
    });

    const warningList: WarningItem[] = [];

    budgets.forEach((budget) => {
      const catName = budget.category?.name;
      if (!catName) return;
      const spent = categorySpent[catName] || 0;

      const limit = convertAmount(
        Number(budget.originalAmount || 0),
        budget.originalCurrency || "USD",
        currency
      );
      if (limit === 0) return;

      const overspend = spent - limit;
      if (overspend <= 0) return;

      const severity = overspend > limit * 0.3 ? "high" : "medium";
      const overspendFormatted = formatAmount(overspend);

      warningList.push({
        id: budget.id,
        categoryName: catName,
        severity,
        overspendAmount: `${overspendFormatted} over budget`,
        simpleDescription:
          severity === "high"
            ? `You have spent way too much on ${catName}. Try to cut back this week.`
            : `You are over budget on ${catName}. Consider reducing small purchases.`,
      });
    });

    return warningList;
  }, [transactions, budgets, convertAmount, currency, formatAmount]);

  // --- HANDLE USER QUESTION (100% backend driven with race condition protection) ---
  const handleQuerySubmit = useCallback(async (question: string) => {
    if (!activeWorkspaceId) return;
    
    const requestId = ++activeRequestRef.current;
    setIsCardVisible(true);
    setIsLoading(true);
    setAiResponse("");

    try {
      const response = await aiService.ask(question, activePersona, activeWorkspaceId);
      
      // Ensures stale out-of-order responses are discarded if a newer request was sent
      if (requestId === activeRequestRef.current) {
        setAiResponse(response.response);
      }
    } catch (error: unknown) {
      if (requestId === activeRequestRef.current) {
        console.error("AI Request Error:", error);
        let errorMessage = "Failed to get AI response.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setAiResponse(`Error: ${errorMessage}`);
        toast.error(errorMessage);
      }
    } finally {
      if (requestId === activeRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [activeWorkspaceId, activePersona]);

  // --- RENDER ---
  return (
    <div className={styles.insightsPageContainer}>
      <header className={styles.insightsMainHeaderCardBox}>
        <div className={styles.titleTextGroup}>
          <div className={styles.titleWithBadgeRow}>
            <h1 className={styles.mainTitleHeading}>AI Money Insights</h1>
            <span className={styles.liveAnalyticsBadgeElement}>Live</span>
          </div>
          <p className={styles.subtitleDescription}>
            Your AI checks your spending, finds waste, and helps you save.
          </p>
        </div>

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

      <AiChatConsole
        activePersona={activePersona}
        onQueryStart={handleQuerySubmit}
        isExternalLoading={isLoading}
        isDataReady={!!activeWorkspaceId && !isDataLoading}
      />

      <AiResponseCard
        isVisible={isCardVisible}
        isLoading={isLoading}
        activePersona={activePersona}
        response={aiResponse}
      />

      <AiLeakWarnings warnings={warnings} isLoading={isDataLoading} />

      <footer className={styles.footerContainerBlock}>
        <DashboardFooter />
      </footer>
    </div>
  );
}
/* === SECTION 3 END === */