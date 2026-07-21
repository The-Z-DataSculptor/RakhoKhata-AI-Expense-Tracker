// src/app/(dashboard)/dashboard/budgets/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import { BudgetDonutGrid, type BudgetItem } from "@/components/budgets/BudgetDonutGrid/BudgetDonutGrid";
import { type TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import { CreateBudgetModal } from "@/components/forms/CreateBudgetModal/CreateBudgetModal";
import type { NewBudgetFormData } from "@/components/forms/CreateBudgetModal/CreateBudgetModal";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { budgetService, categoryService } from "@/utils/api";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { FiPlus } from "react-icons/fi";
import { toast } from "sonner";
import styles from "./page.module.css";

import { Budget as ApiBudget, Category as ApiCategory } from "@/utils/api";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface ExtendedBudget extends ApiBudget {
  spentAmount?: number;
}
/* === SECTION 2 END === */

export default function BudgetsPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const workspaceCurrency = activeWorkspace?.currency || "PKR";
  const { convertAmount } = useCurrency();

  // --- STATE MATRIX ---
  const [activeRange, setActiveRange] = useState<TimePeriod>("30d");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<ExtendedBudget | null>(null);
  const [budgets, setBudgets] = useState<ExtendedBudget[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const formatShortDisplay = (date: Date): string => {
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });
  };

  /* ==========================================================================
     === LIFECYCLE SYNC CORE ENGINE ===
     ========================================================================== */
  useEffect(() => {
    let isMounted = true;

    if (!activeWorkspaceId) return;

    const fetchLiveBudgetData = async () => {
      try {
        const [budgetsData, categoriesData] = await Promise.all([
          budgetService.getByWorkspace(activeWorkspaceId),
          categoryService.getByWorkspace(activeWorkspaceId)
        ]);

        if (isMounted) {
          setBudgets((budgetsData.budgets as ExtendedBudget[]) || []);
          setCategories(categoriesData.categories || []);
        }
      } catch (error: unknown) {
        if (isMounted) {
          const msg = error instanceof Error ? error.message : "Database fetch configuration failure.";
          toast.error(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLiveBudgetData();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, refreshKey]);

  /* ==========================================================================
     === ACTION HANDLERS ===
     ========================================================================== */
  const handleSaveBudgetSubmit = async (formData: NewBudgetFormData) => {
    try {
      const matchedCategory = categories.find(
        (cat) => cat.name.toLowerCase() === formData.categoryName.toLowerCase()
      );

      if (!matchedCategory) {
        toast.error(`The category "${formData.categoryName}" could not be found in this workspace.`);
        return;
      }

      // Only send enterprise fields
      const basePayload = {
        originalAmount: formData.originalAmount,
        originalCurrency: formData.originalCurrency,
        baseAmountUSD: formData.baseAmountUSD,
        startDate: formData.startDate,
        endDate: formData.endDate,
        categoryId: matchedCategory.id,
      };

      if (editingBudget) {
        await budgetService.update(editingBudget.id, basePayload);
        toast.success("Budget tracking rule updated successfully!");
      } else {
        await budgetService.create({
          ...basePayload,
          workspaceId: activeWorkspaceId,
        });
        toast.success("Spending watch rule deployed to cloud ledger successfully!");
      }

      setIsModalOpen(false);
      setEditingBudget(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Internal system crash saving metrics.";
      toast.error(msg);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this budget tracking limit?")) return;

    try {
      await budgetService.delete(id);
      toast.success("Budget limit permanently removed.");
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Teardown sequence error.";
      toast.error(msg);
    }
  };

  /* ==========================================================================
     === DATA RENDERING COMPILATION PASS ===
     ========================================================================== */
  const getMonthDays = (): number => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  };

  const getScalingFactor = (period: TimePeriod): number => {
    const monthDays = getMonthDays();
    switch (period) {
      case "7d": return 7 / monthDays;
      case "14d": return 14 / monthDays;
      case "30d": return 1;
      case "all": return 1;
      default: return 1;
    }
  };

  const computedBudgetItems: BudgetItem[] = budgets.map((budget) => {
    const originalLimit = Number(budget.originalAmount);
    const limitCurrency = budget.originalCurrency || "USD";

    // Use the original amount directly if the display currency matches, else convert from base USD
    const limitInWorkspaceCurrency =
      limitCurrency === workspaceCurrency
        ? originalLimit
        : convertAmount(Number(budget.baseAmountUSD), "USD", workspaceCurrency);

    const spentInWorkspaceCurrency = Number(budget.spentAmount || 0);

    const scale = getScalingFactor(activeRange);

    const scaledLimit = Math.round(limitInWorkspaceCurrency * scale * 100) / 100;
    const scaledSpent = Math.round(spentInWorkspaceCurrency * scale * 100) / 100;

    return {
      id: budget.id,
      categoryName: budget.category?.name || "Unknown Label",
      spentAmount: scaledSpent,
      limitAmount: scaledLimit,
      startDate: formatShortDisplay(new Date(budget.startDate)),
      endDate: formatShortDisplay(new Date(budget.endDate)),
    };
  });

  /* ==========================================================================
     === RENDER (JSX) ===
     ========================================================================== */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <p className="text-gray-400 font-medium tracking-wide animate-pulse text-sm">
          Syncing Live Wallet Spending Thresholds...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.pageViewport}>
      <header className={styles.dashboardHeaderCardBox}>
        <div className={styles.headingBlock}>
          <h1 className={styles.welcomeHeadline}>Budgets</h1>
          <p className={styles.welcomeSubtext}>
            Monitor and pace your spending thresholds per category.
          </p>
        </div>

        <div className={styles.actionControlsFlexDeck}>
          <div className={styles.rangePillsControlDeck}>
            {(["7d", "14d", "30d"] as TimePeriod[]).map((period) => (
              <button
                key={period}
                type="button"
                className={`${styles.timePeriodPillBtn} ${activeRange === period ? styles.timePeriodPillActive : ""}`}
                onClick={() => setActiveRange(period)}
              >
                {period === "7d" ? "This Week" : period === "14d" ? "Half Month" : "This Month"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.primaryCreateActionButton}
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
          >
            <FiPlus size={14} className={styles.plusIconDecoration} />
            <span>Add Budget</span>
          </button>
        </div>
      </header>

      <main className={styles.contentContainer}>
        {computedBudgetItems.length > 0 ? (
          <BudgetDonutGrid
            items={computedBudgetItems}
            sourceCurrency={workspaceCurrency}
            onEditClick={(id) => {
              const targetBudget = budgets.find((b) => b.id === id);
              if (targetBudget) {
                setEditingBudget(targetBudget);
                setIsModalOpen(true);
              }
            }}
            onDeleteClick={handleDeleteBudget}
          />
        ) : (
          <div className={styles.sectionFallback}>
            <p className={styles.fallbackText}>No active budgets found in this workspace.</p>
            <p className={styles.subFallbackText}>
              Create a new budget to track your spending limits specifically for{" "}
              {activeWorkspaceId?.includes("business") ? "your business" : "your personal"} expenses.
            </p>
          </div>
        )}
      </main>

      <CreateBudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSubmit={handleSaveBudgetSubmit}
        categories={categories}
        initialData={
          editingBudget
            ? {
                id: editingBudget.id,
                categoryName: editingBudget.category?.name || "",
                limitAmount: Number(editingBudget.originalAmount),
                startDate: editingBudget.startDate,
                endDate: editingBudget.endDate,
              }
            : null
        }
      />

      <footer className={styles.footerContainerBlock}>
        <DashboardFooter />
      </footer>
    </div>
  );
}