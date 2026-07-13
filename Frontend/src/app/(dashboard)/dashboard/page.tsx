// src/app/(dashboard)/dashboard/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect, useMemo } from "react";
import TimeSwitcher, { TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import MetricRow from "@/components/dashboard/MetricRow/MetricRow";
import ControlLever from "@/components/dashboard/ControlLever/ControlLever";
import CashFlowChart from "@/components/dashboard/CashFlowChart/CashFlowChart";
import ExpenseDonutChart from "@/components/dashboard/ExpenseDonutChart/ExpenseDonutChart";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { transactionService } from "@/utils/api";
import {
  filterTransactionsByPeriod,
  computeMetrics,
  computeCategoryBreakdown,
  computeCashFlowData,
  getPeriodLabel,
  type Transaction,
} from "@/utils/dashboardHelpers";
import type { Transaction as ApiTransaction } from "@/utils/api";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: COMPONENT LOGIC ===
   ========================================================================== */
export default function DashboardPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [activeTimeline, setActiveTimeline] = useState<TimePeriod>("30d");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!activeWorkspaceId) {
        if (isMounted) setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await transactionService.getByWorkspace(activeWorkspaceId);
        if (!isMounted) return;

        const mappedTransactions: Transaction[] = (response.transactions || []).map((apiTx: ApiTransaction) => ({
          id: apiTx.id,
          amount: Number(apiTx.amount),
          originalAmount: Number(apiTx.originalAmount ?? apiTx.amount),
          originalCurrency: apiTx.originalCurrency ?? "USD",
          baseAmountUSD: Number(apiTx.baseAmountUSD ?? apiTx.amount),
          type: apiTx.type as "INCOME" | "EXPENSE",
          description: apiTx.description || "",
          date: apiTx.date,
          workspaceId: apiTx.workspaceId,
          categoryId: apiTx.categoryId,
          category: {
            id: apiTx.category?.id || "",
            name: apiTx.category?.name || "",
            type: apiTx.category?.type || "",
            color: apiTx.category?.color || "",
            isFixed: apiTx.category?.isFixed || false,
            isRecurring: apiTx.category?.isRecurring || false,
            frequency: apiTx.category?.frequency ?? undefined,
            dueDay: apiTx.category?.dueDay ?? undefined,
            reminderDays: apiTx.category?.reminderDays ?? undefined,
          },
        }));
        setTransactions(mappedTransactions);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch transactions:", err);
        setError("Could not load your transactions. Please try again.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId]);

  const dashboardData = useMemo(() => {
    if (transactions.length === 0) {
      return {
        filteredTransactions: [],
        metrics: {
          totalIncome: 0,
          totalExpenses: 0,
          fixedExpenses: 0,
          flexibleExpenses: 0,
          safeToSpend: 0,
          projected: {
            totalIncome: 0,
            totalExpenses: 0,
            fixedExpenses: 0,
            flexibleExpenses: 0,
            safeToSpend: 0,
          },
        },
        categoryData: [],
        cashFlowData: [],
        periodLabel: getPeriodLabel(activeTimeline),
      };
    }

    const filtered = filterTransactionsByPeriod(transactions, activeTimeline);
    // 👇 Removed the third argument (allTransactions) – no longer needed
    const metrics = computeMetrics(filtered, activeTimeline);
    const categoryData = computeCategoryBreakdown(filtered);
    const cashFlowData = computeCashFlowData(filtered, activeTimeline);

    return {
      filteredTransactions: filtered,
      metrics,
      categoryData,
      cashFlowData,
      periodLabel: getPeriodLabel(activeTimeline),
    };
  }, [transactions, activeTimeline]);

  const { metrics, categoryData, cashFlowData, periodLabel } = dashboardData;

  const handleTimelineChange = (selectedPeriod: TimePeriod) => {
    setActiveTimeline(selectedPeriod);
  };

  return (
    <div className={styles.workspaceWrapper}>
      <header className={styles.dashboardHeaderCardBox}>
        <div className={styles.headingBlock}>
          <div className={styles.titleWithBadgeRow}>
            <h1 className={styles.welcomeHeadline}>Overview Hub</h1>
            <span className={styles.liveAnalyticsBadgeElement}>
              {isLoading ? "Loading..." : "Live Analytics"}
            </span>
          </div>
          <p className={styles.welcomeSubtext}>Your financial health at a glance.</p>
        </div>
        <div className={styles.timeSwitcherActionFrame}>
          <TimeSwitcher
            activePeriod={activeTimeline}
            onPeriodChange={handleTimelineChange}
          />
        </div>
      </header>

      {isLoading ? (
        <div className={styles.loadingState}>
          <p>Loading your financial data...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : transactions.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No transactions yet. Start adding your expenses and income!</p>
        </div>
      ) : (
        <>
          <section className={styles.metricsRowStage} aria-label="Quick Summary">
            <MetricRow
              metrics={metrics}
              periodLabel={periodLabel}
              activePeriod={activeTimeline}
            />
          </section>

          <section className={styles.gaugeRowStage} aria-label="Spending Control Guide">
            <ControlLever
              totalIncome={metrics.totalIncome}
              fixedExpenses={metrics.fixedExpenses}
              flexibleExpenses={metrics.flexibleExpenses}
              activePeriod={activeTimeline}
            />
          </section>

          <main className={styles.isolatedStage}>
            <div className={styles.chartWrapperNode}>
              <CashFlowChart data={cashFlowData} />
            </div>
            <div className={styles.chartWrapperNode}>
              <ExpenseDonutChart data={categoryData} />
            </div>
          </main>
        </>
      )}

      <footer className={styles.footerContainerBlock}>
        <DashboardFooter />
      </footer>
    </div>
  );
}
/* === SECTION 3 END === */