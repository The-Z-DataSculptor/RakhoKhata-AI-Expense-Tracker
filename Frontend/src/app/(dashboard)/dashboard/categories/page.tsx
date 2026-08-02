"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DEPENDENCIES ===
   ========================================================================== */
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  isFixed?: boolean;
}

type UnassignedTransactionRecord = DrawerTxRecord & {
  workspaceId: string;
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: STATE MECHANICS & FETCH PIPELINES ===
   ========================================================================== */
export default function CategoriesPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const workspaceCurrency = activeWorkspace?.currency || "PKR";
  const { convertAmount } = useCurrency();

  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);

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

      const fetchedTxs = txData?.transactions || [];
      const fetchedCats = catData?.categories || [];

      setTransactions(fetchedTxs);

      const mappedCategories: CategoryRecord[] = fetchedCats.map((dbCat: Category) => {
        const txCount = fetchedTxs.filter(tx => tx.categoryId === dbCat.id).length;
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
          isFixed: dbCat.isFixed ?? false,
        };
      });

      setCategories(mappedCategories);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to refresh category dashboard.";
      toast.error(msg);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    let isMounted = true;
    if (!activeWorkspaceId) {
      return;
    }

    const initialWorkspaceSync = async () => {
      try {
        if (isMounted) setIsLoading(true);
        const [catData, txData] = await Promise.all([
          categoryService.getByWorkspace(activeWorkspaceId),
          transactionService.getByWorkspace(activeWorkspaceId)
        ]);

        if (isMounted) {
          const fetchedTxs = txData?.transactions || [];
          const fetchedCats = catData?.categories || [];

          setTransactions(fetchedTxs);

          const mappedCategories: CategoryRecord[] = fetchedCats.map((dbCat: Category) => {
            const txCount = fetchedTxs.filter(tx => tx.categoryId === dbCat.id).length;
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
              isFixed: dbCat.isFixed ?? false,
            };
          });

          setCategories(mappedCategories);
        }
      } catch (error: unknown) {
        console.error("Category Sync Failure:", error);
        if (isMounted) {
          const msg = error instanceof Error ? error.message : "Failed to load category dashboard.";
          toast.error(msg);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initialWorkspaceSync();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId]);
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: ACTION HANDLERS & COMPUTED DATA ===
     ========================================================================== */
  const handleOpenBulkDrawer = () => setIsBulkDrawerOpen(true);
  const handleCloseBulkDrawer = () => setIsBulkDrawerOpen(false);

  const handleApplyCategory = async (categoryId: string, transactionIds: string[]) => {
    if (!activeWorkspaceId) return;
    try {
      setIsLoading(true);
      const safeTransactionsList = transactions || [];
      await Promise.all(
        (transactionIds || []).map(async (id) => {
          const tx = safeTransactionsList.find(t => t.id === id);
          if (!tx) return;

          await transactionService.delete(id);
          await transactionService.create({
            originalAmount: Number(tx.originalAmount ?? 0),
            originalCurrency: tx.originalCurrency || "USD",
            baseAmountUSD: Number(tx.baseAmountUSD ?? 0),
            type: tx.type,
            description: tx.description || "Imported Ledger Record Entry",
            date: tx.date,
            workspaceId: activeWorkspaceId,
            categoryId: categoryId,
          });
        })
      );

      toast.success(`Successfully re-assigned ${transactionIds.length} transactions!`);
      setIsBulkDrawerOpen(false);
      await refreshCategoryData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to process mass tag allocation routines.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
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
        workspaceId: activeWorkspaceId!,
        isFixed: false,
        isRecurring: savedCategory.isRecurring ?? false,
        frequency: savedCategory.frequency || "MONTHLY",
        dueDay: savedCategory.dueDay ?? 1,
        reminderDays: savedCategory.reminderDays ?? 3,
      };

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
      setCategories((prev) => (prev || []).filter((c) => c.id !== id));
      await refreshCategoryData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete category.";
      toast.error(msg);
    }
  };

  const unassignedNode = (categories || []).find(c => c.name.toLowerCase().includes("unassigned"));
  const unassignedUUID = unassignedNode ? unassignedNode.id : "";

  const filteredUnassigned: UnassignedTransactionRecord[] = useMemo(() => {
    return (transactions || [])
      .filter(tx => tx.categoryId === unassignedUUID)
      .map(tx => {
        let safeDateStr = "";
        const rawDate = tx.date as unknown;
        if (typeof rawDate === "string") {
          safeDateStr = rawDate.substring(0, 10);
        } else if (rawDate instanceof Date) {
          safeDateStr = rawDate.toISOString().substring(0, 10);
        } else {
          safeDateStr = new Date().toISOString().substring(0, 10);
        }

        return {
          id: tx.id,
          date: safeDateStr,
          merchant: tx.description || "Imported Statement Entry",
          amount: Number(tx.baseAmountUSD ?? 0),
          workspaceId: tx.workspaceId
        };
      });
  }, [transactions, unassignedUUID]);

  const categoryOptions: CategoryOption[] = useMemo(() => {
    return (categories || [])
      .filter(cat => !cat.name.toLowerCase().includes("unassigned"))
      .map((cat) => ({
        id: cat.id,
        name: cat.name
      }));
  }, [categories]);

  const liveStatsData = useMemo((): CategoryStatData => {
    let topExp = { name: "N/A", amountWorkspace: 0 };
    let topInc = { name: "N/A", amountWorkspace: 0 };
    let habit = { name: "N/A", count: 0 };
    let totalExpWorkspace = 0;
    let totalIncWorkspace = 0;

    const categorySums: Record<string, { amountWorkspace: number; count: number }> = {};
    const safeTxs = transactions || [];
    const safeCats = categories || [];

    safeTxs.forEach(tx => {
      const cat = safeCats.find(c => c.id === tx.categoryId);
      const catName = cat?.name || "Unknown";

      let txAmountWorkspace: number;
      if (tx.originalCurrency === workspaceCurrency) {
        txAmountWorkspace = Number(tx.originalAmount || 0);
      } else {
        txAmountWorkspace = convertAmount(Number(tx.baseAmountUSD || 0), "USD", workspaceCurrency);
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
  }, [transactions, categories, workspaceCurrency, convertAmount]);

  const orderedCategories = useMemo(() => {
    return [...(categories || [])].sort((a, b) => {
      if (a.isFixed && !b.isFixed) return -1;
      if (!a.isFixed && b.isFixed) return 1;
      return 0;
    });
  }, [categories]);
  /* === SECTION 4 END === */

  /* ==========================================================================
     === SECTION 5: RENDER UI ===
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
          statsData={liveStatsData}
          sourceCurrency={workspaceCurrency}
        />
      </div>

      <main className={styles.mainContentStage}>
        <CategoryGrid
          categoriesList={orderedCategories}
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
/* === SECTION 5 END === */