// src/app/(dashboard)/dashboard/ai-insights/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect, useMemo } from "react";
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

  // --- REAL DATA STATES ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  // Fetch real data when workspace changes
  useEffect(() => {
    if (!activeWorkspaceId) return;

    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        const [txData, budgetData] = await Promise.all([
          transactionService.getByWorkspace(activeWorkspaceId),
          budgetService.getByWorkspace(activeWorkspaceId),
        ]);
        setTransactions(txData.transactions || []);
        setBudgets(budgetData.budgets || []);
      } catch {
        toast.error("Could not load your data. Please try again.");
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [activeWorkspaceId]);

  // --- COMPUTE WARNINGS FROM REAL DATA (FIXED) ---
  const warnings = useMemo<WarningItem[]>(() => {
    if (!transactions.length || !budgets.length) return [];

    // Group expenses by category using original amounts converted to active currency
    const categorySpent: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type !== "EXPENSE") return;
      const catName = tx.category?.name || "Uncategorized";
      const amount = convertAmount(
        Number(tx.originalAmount),
        tx.originalCurrency || currency,
        currency
      );
      categorySpent[catName] = (categorySpent[catName] || 0) + amount;
    });

    const warningList: WarningItem[] = [];

    budgets.forEach((budget) => {
      const catName = budget.category?.name;
      if (!catName) return;
      const spent = categorySpent[catName] || 0;

      // Convert budget limit to active currency using originalCurrency (fallback to currency)
      const limit = convertAmount(
        Number(budget.originalAmount || budget.limitAmount),
        budget.originalCurrency || currency,
        currency
      );
      if (limit === 0) return;

      const overspend = spent - limit;
      if (overspend <= 0) return;

      const severity = overspend > limit * 0.3 ? "high" : "medium";
      // ✅ FIXED: Don't pass "USD" – overspend is already in the active currency
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

  // --- BUILD DATA PAYLOAD FOR AI ---
  const buildAIData = () => {
    const activeCurrency = currency;

    const totalIncome = transactions
      .filter((tx) => tx.type === "INCOME")
      .reduce((sum, tx) => sum + convertAmount(Number(tx.originalAmount), tx.originalCurrency || activeCurrency, activeCurrency), 0);

    const totalExpenses = transactions
      .filter((tx) => tx.type === "EXPENSE")
      .reduce((sum, tx) => sum + convertAmount(Number(tx.originalAmount), tx.originalCurrency || activeCurrency, activeCurrency), 0);

    const categoryMap: Record<string, number> = {};
    transactions
      .filter((tx) => tx.type === "EXPENSE")
      .forEach((tx) => {
        const name = tx.category?.name || "Uncategorized";
        const amount = convertAmount(Number(tx.originalAmount), tx.originalCurrency || activeCurrency, activeCurrency);
        categoryMap[name] = (categoryMap[name] || 0) + amount;
      });

    const topEntry = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topEntry ? topEntry[0] : "None";

    const budgetData = budgets.map((budget) => {
      const catName = budget.category?.name || "Unknown";
      const spent = categoryMap[catName] || 0;
      const limit = convertAmount(Number(budget.originalAmount || budget.limitAmount), budget.originalCurrency || activeCurrency, activeCurrency);
      return {
        categoryName: catName,
        limitAmount: Math.round(limit * 100) / 100,
        spentAmount: Math.round(spent * 100) / 100,
      };
    });

    return {
      income: Math.round(totalIncome * 100) / 100,
      expenses: Math.round(totalExpenses * 100) / 100,
      topCategory,
      budgets: budgetData,
      currency: activeCurrency,
    };
  };

  // --- HANDLE USER QUESTION ---
  const handleQuerySubmit = async (question: string) => {
    setIsCardVisible(true);
    setIsLoading(true);
    setAiResponse("");

    try {
      const data = buildAIData();
      const response = await aiService.ask(question, activePersona, data);
      setAiResponse(response.response);
    } catch (error: unknown) {
      console.error("AI Request Error:", error);
      let errorMessage = "Failed to get AI response.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setAiResponse(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
        isDataReady={!isDataLoading && transactions.length > 0}
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