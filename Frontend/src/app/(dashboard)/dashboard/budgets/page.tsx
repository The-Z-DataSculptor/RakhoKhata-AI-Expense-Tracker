// src/app/(dashboard)/dashboard/budgets/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BudgetDonutGrid, type BudgetItem } from "@/components/budgets/BudgetDonutGrid/BudgetDonutGrid";
import { type TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import { CreateBudgetModal } from "@/components/forms/CreateBudgetModal/CreateBudgetModal";
import type { NewBudgetFormData } from "@/components/forms/CreateBudgetModal/CreateBudgetModal";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { budgetService, categoryService } from "@/utils/api";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { FiPlus, FiTarget, FiPlusCircle } from "react-icons/fi";
import { toast } from "sonner";
import styles from "./page.module.css";

import { Budget as ApiBudget, Category as ApiCategory } from "@/utils/api";

interface ExtendedBudget extends ApiBudget {
  spentAmount?: number;
}

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

const formatShortDisplay = (date: Date): string => {
  return isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });
};

export default function BudgetsPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const workspaceCurrency = activeWorkspace?.currency || "PKR";
  const { convertAmount } = useCurrency();

  const [activeRange, setActiveRange] = useState<TimePeriod>("30d");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<ExtendedBudget | null>(null);
  const [budgets, setBudgets] = useState<ExtendedBudget[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    if (!activeWorkspaceId) {
      return;
    }

    const fetchLiveBudgetData = async () => {
      try {
        if (isMounted) setIsLoading(true);
        const [budgetsData, categoriesData] = await Promise.all([
          budgetService.getByWorkspace(activeWorkspaceId),
          categoryService.getByWorkspace(activeWorkspaceId)
        ]);

        if (isMounted) {
          setBudgets((budgetsData.budgets as ExtendedBudget[]) || []);
          
          // ✅ Normalise category types to UPPERCASE so the expense filter works reliably
          const normalisedCategories = (categoriesData.categories || []).map((cat) => ({
            ...cat,
            type: cat.type?.toUpperCase() || "EXPENSE",
          }));
          setCategories(normalisedCategories);
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

  const handleSaveBudgetSubmit = async (formData: NewBudgetFormData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const matchedCategory = categories.find(
        (cat) => cat.name.toLowerCase() === formData.categoryName.toLowerCase()
      );

      if (!matchedCategory) {
        toast.error(`The category "${formData.categoryName}" could not be found in this workspace.`);
        return;
      }

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
        if (!activeWorkspaceId) {
          toast.error("Active workspace context missing.");
          return;
        }
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
    } finally {
      setIsSubmitting(false);
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

  // Convert spent from USD to workspace currency (spentAmount is now in USD)
  const computedBudgetItems: BudgetItem[] = useMemo(() => {
    const scale = getScalingFactor(activeRange);

    return budgets.map((budget) => {
      const originalLimit = Number(budget.originalAmount || 0);
      const limitCurrency = budget.originalCurrency || "USD";

      const limitInWorkspaceCurrency =
        limitCurrency === workspaceCurrency
          ? originalLimit
          : convertAmount(Number(budget.baseAmountUSD || 0), "USD", workspaceCurrency);

      const spentInWorkspaceCurrency = convertAmount(Number(budget.spentAmount || 0), "USD", workspaceCurrency);

      const scaledLimit = Math.round(limitInWorkspaceCurrency * scale * 100) / 100;
      const scaledSpent = Math.round(spentInWorkspaceCurrency * scale * 100) / 100;

      const startDateObj = budget.startDate ? new Date(budget.startDate) : new Date();
      const endDateObj = budget.endDate ? new Date(budget.endDate) : new Date();

      return {
        id: budget.id,
        categoryName: budget.category?.name || "Unknown Label",
        spentAmount: scaledSpent,
        limitAmount: scaledLimit,
        startDate: formatShortDisplay(startDateObj),
        endDate: formatShortDisplay(endDateObj),
      };
    });
  }, [budgets, activeRange, workspaceCurrency, convertAmount]);

  const openCreateModal = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

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
            onClick={openCreateModal}
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
          /* 🚀 NEW PREMIUM EMPTY STATE – Warm and Inviting */
          <div className={styles.emptyBudgetState}>
            <div className={styles.emptyBudgetGlassCard}>
              <div className={styles.emptyBudgetIconWrapper}>
                <FiTarget className={styles.emptyBudgetIcon} />
              </div>
              <h3 className={styles.emptyBudgetHeadline}>Start Budgeting Smarter</h3>
              <p className={styles.emptyBudgetSubtext}>
                Take control of your finances. Set monthly limits for categories and let us help you track spending effortlessly.
              </p>
              <button
                type="button"
                className={styles.emptyBudgetCtaBtn}
                onClick={openCreateModal}
              >
                <FiPlusCircle size={18} />
                <span>Create Your First Budget</span>
              </button>
            </div>
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
        categories={categories.filter(cat => cat.type === "EXPENSE")}
        initialData={
          editingBudget
            ? {
                id: editingBudget.id,
                categoryName: editingBudget.category?.name || "",
                limitAmount: Number(editingBudget.originalAmount || 0),
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