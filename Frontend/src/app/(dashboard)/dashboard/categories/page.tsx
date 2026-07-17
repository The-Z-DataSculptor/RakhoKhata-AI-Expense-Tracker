"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect, useCallback } from "react";
import { FiAlertCircle, FiPlus } from "react-icons/fi";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { categoryService, transactionService, Category, Transaction } from "@/utils/api";
import { toast } from "sonner";

import CategoryStats, { CategoryStatData } from "@/components/categories/CategoryStats/CategoryStats";
import CategoryGrid from "@/components/categories/CategoryGrid/CategoryGrid";
import BulkDrawer, { TransactionRecord as DrawerTxRecord, CategoryOption } from "@/components/categories/BulkDrawer/BulkDrawer";
import { CategoryForm } from "@/components/forms/CategoryForm/CategoryForm";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface CategoryRecord {
  id: string;
  workspaceId: string;
  name: string;
  type: "income" | "expense" | "both";
  iconSlug: string;
  accentColor: string;
  transactionCount: number;
  isRecurring?: boolean;
  frequency?: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  dueDay?: number;
  reminderDays?: number;
}

type UnassignedTransactionRecord = DrawerTxRecord & {
  workspaceId: string;
};
/* === SECTION 2 END === */

export default function CategoriesPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const workspaceCurrency = activeWorkspace?.currency || "PKR";
  const { convertAmount } = useCurrency();

  // --- STATE MATRIX ---
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);

  /* ==========================================================================
     === LIFECYCLE SYNC CORE ENGINE ===
     ========================================================================== */
  const toFrequencyUnion = (value: string | null): CategoryRecord["frequency"] => {
    if (!value) return "MONTHLY";
    const allowed = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];
    return allowed.includes(value) ? (value as CategoryRecord["frequency"]) : "MONTHLY";
  };

  const refreshCategoryData = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try {
      const [catData, txData] = await Promise.all([
        categoryService.getByWorkspace(activeWorkspaceId),
        transactionService.getByWorkspace(activeWorkspaceId)
      ]);

      setTransactions(txData.transactions);

      const mappedCategories: CategoryRecord[] = catData.categories.map((dbCat: Category) => {
        const txCount = txData.transactions.filter(tx => tx.categoryId === dbCat.id).length;
        return {
          id: dbCat.id,
          workspaceId: dbCat.workspaceId,
          name: dbCat.name,
          type: dbCat.type.toLowerCase() as "income" | "expense" | "both",
          iconSlug: "FiFolder",
          accentColor: dbCat.color,
          transactionCount: txCount,
          isRecurring: dbCat.isRecurring ?? false,
          frequency: toFrequencyUnion(dbCat.frequency),
          dueDay: dbCat.dueDay ?? 1,
          reminderDays: dbCat.reminderDays ?? 3,
        };
      });

      setCategories(mappedCategories);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to refresh category dashboard.";
      toast.error(msg);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    const initialWorkspaceSync = async () => {
      setIsLoading(true);
      try {
        const [catData, txData] = await Promise.all([
          categoryService.getByWorkspace(activeWorkspaceId),
          transactionService.getByWorkspace(activeWorkspaceId)
        ]);

        setTransactions(txData.transactions);

        const mappedCategories: CategoryRecord[] = catData.categories.map((dbCat: Category) => {
          const txCount = txData.transactions.filter(tx => tx.categoryId === dbCat.id).length;
          return {
            id: dbCat.id,
            workspaceId: dbCat.workspaceId,
            name: dbCat.name,
            type: dbCat.type.toLowerCase() as "income" | "expense" | "both",
            iconSlug: "FiFolder",
            accentColor: dbCat.color,
            transactionCount: txCount,
            isRecurring: dbCat.isRecurring ?? false,
            frequency: toFrequencyUnion(dbCat.frequency),
            dueDay: dbCat.dueDay ?? 1,
            reminderDays: dbCat.reminderDays ?? 3,
          };
        });

        setCategories(mappedCategories);
      } catch (error: unknown) {
        console.error("Category Sync Failure:", error);
        const msg = error instanceof Error ? error.message : "Failed to load category dashboard.";
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };

    initialWorkspaceSync();
  }, [activeWorkspaceId]);

  /* ==========================================================================
     === ACTION HANDLERS ===
     ========================================================================== */
  const handleOpenBulkDrawer = () => setIsBulkDrawerOpen(true);
  const handleCloseBulkDrawer = () => setIsBulkDrawerOpen(false);

  const handleApplyCategory = async (categoryId: string, transactionIds: string[]) => {
    toast.success(`Successfully re-assigned ${transactionIds.length} transactions!`);
    setIsBulkDrawerOpen(false);
    await refreshCategoryData();
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleClosePopupModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleUpsertCategory = async (savedCategory: CategoryRecord) => {
    try {
      const payload = {
        name: savedCategory.name,
        type: savedCategory.type.toUpperCase(),
        color: savedCategory.accentColor,
        workspaceId: activeWorkspaceId,
        isFixed: false,
        isRecurring: savedCategory.isRecurring ?? false,
        frequency: savedCategory.frequency || "MONTHLY",
        dueDay: savedCategory.dueDay ?? 1,
        reminderDays: savedCategory.reminderDays ?? 3,
      };

      // 🚀 FIX: Handle pure updates separate from creation routines to retain historical links
      if (editingCategory && savedCategory.id && !savedCategory.id.startsWith("cat-")) {
        await categoryService.update(savedCategory.id, payload);
        toast.success("Category tracking rule updated successfully.");
      } else {
        await categoryService.create(payload);
        toast.success("Custom spending category added successfully.");
      }

      await refreshCategoryData();
      handleClosePopupModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to save category.";
      toast.error(msg);
    }
  };

  const handleEditCategory = (category: CategoryRecord) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Delete this category? Transactions using it will need to be reassigned.")) return;
    try {
      await categoryService.delete(id);
      toast.success("Category deleted.");
      setCategories((prev) => prev.filter((c) => c.id !== id));
      await refreshCategoryData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete category.";
      toast.error(msg);
    }
  };

  /* ==========================================================================
     === LIVE COMPUTED DATA MATRICES ===
     ========================================================================== */
  const filteredUnassigned: UnassignedTransactionRecord[] = [];

  const categoryOptions: CategoryOption[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name
  }));

  const calculateLiveStats = (): CategoryStatData => {
    let topExp = { name: "N/A", amountWorkspace: 0 };
    let topInc = { name: "N/A", amountWorkspace: 0 };
    let habit = { name: "N/A", count: 0 };
    let totalExpWorkspace = 0;
    let totalIncWorkspace = 0;

    const categorySums: Record<string, { amountWorkspace: number; count: number }> = {};

    transactions.forEach(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const catName = cat?.name || "Unknown";

      let txAmountWorkspace: number;
      if (tx.originalCurrency === workspaceCurrency) {
        txAmountWorkspace = Number(tx.originalAmount);
      } else {
        txAmountWorkspace = convertAmount(Number(tx.baseAmountUSD), "USD", workspaceCurrency);
      }

      if (!categorySums[catName]) categorySums[catName] = { amountWorkspace: 0, count: 0 };
      categorySums[catName].amountWorkspace += txAmountWorkspace;
      categorySums[catName].count += 1;

      if (tx.type === "EXPENSE") {
        totalExpWorkspace += txAmountWorkspace;
        if (categorySums[catName].amountWorkspace > topExp.amountWorkspace) {
          topExp = { name: catName, amountWorkspace: categorySums[catName].amountWorkspace };
        }
        if (categorySums[catName].count > habit.count) {
          habit = { name: catName, count: categorySums[catName].count };
        }
      } else {
        totalIncWorkspace += txAmountWorkspace;
        if (categorySums[catName].amountWorkspace > topInc.amountWorkspace) {
          topInc = { name: catName, amountWorkspace: categorySums[catName].amountWorkspace };
        }
      }
    });

    return {
      topExpenseName: topExp.name,
      topExpenseAmount: topExp.amountWorkspace,
      topExpensePercentage: totalExpWorkspace > 0 ? Math.round((topExp.amountWorkspace / totalExpWorkspace) * 100) : 0,
      topIncomeName: topInc.name,
      topIncomeAmount: topInc.amountWorkspace,
      topIncomePercentage: totalIncWorkspace > 0 ? Math.round((topInc.amountWorkspace / totalIncWorkspace) * 100) : 0,
      fastClimberName: topExp.name,
      fastClimberGrowthPercentage: 0,
      habitTrackerName: habit.name,
      habitTrackerCount: habit.count,
    };
  };

  /* ==========================================================================
     === RENDER UI ===
     ========================================================================== */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <p className="text-gray-400 font-medium tracking-wide animate-pulse text-sm">Syncing Category Analytics...</p>
      </div>
    );
  }

  return (
    <div className={styles.categoriesCanvasWrapper}>

      <header className={styles.pageHeaderDeck}>
        <div className={styles.titleGroup}>
          <h1 className={styles.mainTitleHeading}>Categories</h1>
          <p className={styles.subTitleDescription}>
            Create labels to group your transactions, choose custom colors, and see where your money goes.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.bulkActionButton} onClick={handleOpenBulkDrawer} type="button">
            <FiAlertCircle size={14} />
            <span>Unassigned Inbox</span>
            {filteredUnassigned.length > 0 && (
              <span className={styles.dynamicWarningBadgeCount}>{filteredUnassigned.length}</span>
            )}
          </button>

          <button className={styles.createCategoryButton} onClick={handleOpenCreateModal} type="button">
            <FiPlus size={15} />
            <span>Add New Category</span>
          </button>
        </div>
      </header>

      <div className={styles.statsWrapperDeck}>
        <CategoryStats
          statsData={calculateLiveStats()}
          sourceCurrency={workspaceCurrency}
        />
      </div>

      <main className={styles.mainContentStage}>
        <CategoryGrid
          categoriesList={categories}
          onEditClick={handleEditCategory}
          onDeleteClick={handleDeleteCategory}
        />
      </main>

      {isModalOpen && (
        <div className={styles.modalOverlayBackdrop} onClick={handleClosePopupModal}>
          <div className={styles.modalContentCard} onClick={(e) => e.stopPropagation()}>
            <CategoryForm
              onAddCategory={handleUpsertCategory}
              initialData={editingCategory}
              onCancel={handleClosePopupModal}
            />
          </div>
        </div>
      )}

      {isBulkDrawerOpen && (
        <BulkDrawer
          isOpen={isBulkDrawerOpen}
          onClose={handleCloseBulkDrawer}
          transactions={filteredUnassigned}
          categories={categoryOptions}
          onApplyCategory={handleApplyCategory}
        />
      )}

      <footer className={styles.footerContainerBlock}>
        <DashboardFooter />
      </footer>
    </div>
  );
}