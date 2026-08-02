// src/app/(dashboard)/dashboard/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FiActivity, FiArrowRight } from "react-icons/fi";
import TimeSwitcher, {
  TimePeriod,
} from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import MetricRow from "@/components/dashboard/MetricRow/MetricRow";
import ControlLever from "@/components/dashboard/ControlLever/ControlLever";
import CashFlowChart from "@/components/dashboard/CashFlowChart/CashFlowChart";
import ExpenseDonutChart from "@/components/dashboard/ExpenseDonutChart/ExpenseDonutChart";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import AiBuddyConsole from "@/components/dashboard/AiBuddyConsole/AiBuddyConsole";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
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
   === SECTION 2: DATA FETCHING & TRANSFORMATION ===
   ========================================================================== */
export default function DashboardPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const workspaceCurrency = activeWorkspace?.currency || "PKR";
  const { convertAmount } = useCurrency();

  const [activeTimeline, setActiveTimeline] = useState<TimePeriod>("30d");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTransactions = async () => {
      if (!activeWorkspaceId) {
        if (isMounted) setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await transactionService.getByWorkspace(
          activeWorkspaceId
        );
        if (!isMounted) return;

        const mapped = (response.transactions || []).map(
          (apiTx: ApiTransaction) => {
            const originalAmount = Number(
              apiTx.originalAmount ?? apiTx.amount ?? 0
            );
            const originalCurrency = apiTx.originalCurrency || "PKR";

            let baseAmountUSD: number;
            if (
              apiTx.baseAmountUSD === null ||
              apiTx.baseAmountUSD === undefined
            ) {
              baseAmountUSD = convertAmount(
                originalAmount,
                originalCurrency,
                "USD"
              );
            } else {
              baseAmountUSD = Number(apiTx.baseAmountUSD);
            }

            return {
              id: apiTx.id,
              amount: originalAmount, 
              originalAmount,
              originalCurrency,
              baseAmountUSD,
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
            } as Transaction;
          }
        );

        setTransactions(mapped);
      } catch (fetchError) {
        if (isMounted) {
          console.error("Failed to fetch transactions:", fetchError);
          setError("Could not load your transactions. Please try again.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTransactions();
    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, convertAmount]);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: DASHBOARD COMPUTATIONS ===
   ========================================================================== */
  const dashboardData = useMemo(() => {
    if (transactions.length === 0) {
      return {
        filteredTransactions: [] as Transaction[],
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

    const filtered = filterTransactionsByPeriod(
      transactions,
      activeTimeline
    );
    
    const metrics = computeMetrics(filtered, activeTimeline, workspaceCurrency, convertAmount);
    const categoryData = computeCategoryBreakdown(filtered, workspaceCurrency, convertAmount);
    const cashFlowData = computeCashFlowData(filtered, activeTimeline, workspaceCurrency, convertAmount);

    return {
      filteredTransactions: filtered,
      metrics,
      categoryData,
      cashFlowData,
      periodLabel: getPeriodLabel(activeTimeline),
    };
  }, [transactions, activeTimeline, workspaceCurrency, convertAmount]);

  const { metrics, categoryData, cashFlowData, periodLabel } =
    dashboardData;
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER ===
   ========================================================================== */
  return (
    <div className={styles.workspaceWrapper}>
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
        
        /* 🚀 NEW PREMIUM EMPTY STATE */
        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyStateGlassCard}>
            <div className={styles.emptyStateIconWrapper}>
              <FiActivity className={styles.emptyStateIcon} />
            </div>
            <h2 className={styles.emptyStateHeadline}>Dashboard Offline</h2>
            <p className={styles.emptyStateSubtext}>
              Select the right workspace and head over to the transactions section. Record your first entry and watch your financial overview come alive!
            </p>
            <Link href="/dashboard/transactions" className={styles.emptyStateCtaBtn}>
              Go to Transactions <FiArrowRight className={styles.ctaArrowIcon} />
            </Link>
          </div>
        </div>

      ) : (
        <>
          {/* AI Companion Console */}
          <section
            className={styles.metricsRowStage}
            aria-label="AI Guardian Companion"
          >
            <AiBuddyConsole activeWorkspaceId={activeWorkspaceId} />
          </section>

          {/* Header with period switcher */}
          <header className={styles.dashboardHeaderCardBox}>
            <div className={styles.headingBlock}>
              <div className={styles.titleWithBadgeRow}>
                <h1 className={styles.welcomeHeadline}>Overview Hub</h1>
                <span className={styles.liveAnalyticsBadgeElement}>
                  Live Analytics
                </span>
              </div>
              <p className={styles.welcomeSubtext}>
                Your financial health at a glance.
              </p>
            </div>
            <div className={styles.timeSwitcherActionFrame}>
              <TimeSwitcher
                activePeriod={activeTimeline}
                onPeriodChange={(period) => setActiveTimeline(period)}
              />
            </div>
          </header>

          {/* Summary metric cards */}
          <section
            className={styles.metricsRowStage}
            aria-label="Quick Summary"
          >
            <MetricRow
              metrics={metrics}
              periodLabel={periodLabel}
              activePeriod={activeTimeline}
              sourceCurrency={workspaceCurrency}
            />
          </section>

          {/* Spending allocation bar */}
          <section
            className={styles.gaugeRowStage}
            aria-label="Spending Control Guide"
          >
            <ControlLever
              totalIncome={metrics.totalIncome}
              fixedExpenses={metrics.fixedExpenses}
              flexibleExpenses={metrics.flexibleExpenses}
              activePeriod={activeTimeline}
              sourceCurrency={workspaceCurrency}
            />
          </section>

          {/* Charts */}
          <main className={styles.isolatedStage}>
            <div className={styles.chartWrapperNode}>
              <CashFlowChart
                data={cashFlowData}
                sourceCurrency={workspaceCurrency}
              />
            </div>
            <div className={styles.chartWrapperNode}>
              <ExpenseDonutChart
                data={categoryData}
                sourceCurrency={workspaceCurrency}
              />
            </div>
          </main>
        </>
      )}

      {/* Global footer */}
      <footer className={styles.footerContainerBlock}>
        <DashboardFooter />
      </footer>
    </div>
  );
}
/* === SECTION 4 END === */