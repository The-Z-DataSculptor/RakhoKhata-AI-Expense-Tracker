// src/app/(dashboard)/dashboard/categories/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { FiAlertCircle, FiPlus } from "react-icons/fi";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext"; 
import CategoryStats, { CategoryStatData } from "@/components/categories/CategoryStats/CategoryStats";
import CategoryGrid from "@/components/categories/CategoryGrid/CategoryGrid";
import BulkDrawer, { TransactionRecord, CategoryOption } from "@/components/categories/BulkDrawer/BulkDrawer";
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
}

type UnassignedTransactionRecord = TransactionRecord & { 
  workspaceId: string; 
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function CategoriesPage() {
  const { activeWorkspaceId } = useWorkspace(); 

  // --- STATE MATRIX ---
  const [categories, setCategories] = useState<CategoryRecord[]>([
    { id: "cat-201", workspaceId: "ws-personal-default", name: "Salary", type: "income", iconSlug: "FiBriefcase", accentColor: "#16a34a", transactionCount: 12 },
    { id: "cat-202", workspaceId: "ws-business-default", name: "Marketing", type: "expense", iconSlug: "FiTarget", accentColor: "#613bbf", transactionCount: 34 },
    { id: "cat-203", workspaceId: "ws-personal-default", name: "Food & Groceries", type: "expense", iconSlug: "FiShoppingCart", accentColor: "#dc2626", transactionCount: 48 },
    { id: "cat-204", workspaceId: "ws-business-default", name: "Freelance Work", type: "income", iconSlug: "FiCpu", accentColor: "#2563eb", transactionCount: 8 },
    { id: "cat-205", workspaceId: "ws-personal-default", name: "Electricity & Bills", type: "expense", iconSlug: "FiZap", accentColor: "#d97706", transactionCount: 15 },
  ]);

  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);

  const [unassignedTransactions, setUnassignedTransactions] = useState<UnassignedTransactionRecord[]>([
    { id: "tx-1", workspaceId: "ws-personal-default", date: "2026-06-10", merchant: "Amazon Warehouse", amount: 4500 },
    { id: "tx-2", workspaceId: "ws-personal-default", date: "2026-06-11", merchant: "Shell Fuel Station", amount: 3200 },
  ]);

  // --- ACTION HANDLERS ---
  const handleOpenBulkDrawer = () => setIsBulkDrawerOpen(true);
  const handleCloseBulkDrawer = () => setIsBulkDrawerOpen(false);

  const handleApplyCategory = (categoryId: string, transactionIds: string[]) => {
    setUnassignedTransactions((prevTx) => prevTx.filter((tx) => !transactionIds.includes(tx.id)));
    setCategories((prevCats) =>
      prevCats.map((cat) => 
        cat.id === categoryId 
          ? { ...cat, transactionCount: cat.transactionCount + transactionIds.length } 
          : cat
      )
    );
    setIsBulkDrawerOpen(false);
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null); 
    setIsModalOpen(true);
  };

  const handleClosePopupModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleUpsertCategory = (savedCategory: Omit<CategoryRecord, "workspaceId"> & { workspaceId?: string }) => {
    const categoryWithWorkspace: CategoryRecord = {
      ...savedCategory,
      workspaceId: savedCategory.workspaceId || (editingCategory ? editingCategory.workspaceId : activeWorkspaceId),
    };

    setCategories((prevList) => {
      const exists = prevList.some((c) => c.id === savedCategory.id);
      if (exists) {
        return prevList.map((c) => (c.id === savedCategory.id ? categoryWithWorkspace : c));
      }
      return [categoryWithWorkspace, ...prevList];
    });
    
    handleClosePopupModal();
  };

  const handleEditCategory = (category: CategoryRecord) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // --- LIVE COMPUTED DATA MATRICES ---
  const filteredCategories = categories.filter((cat) => cat.workspaceId === activeWorkspaceId);
  const filteredUnassigned = unassignedTransactions.filter((tx) => tx.workspaceId === activeWorkspaceId);

  const categoryOptions: CategoryOption[] = filteredCategories.map((cat) => ({ 
    id: cat.id, 
    name: cat.name 
  }));

  const liveComputedStats: CategoryStatData = {
    topExpenseName: "Marketing", topExpenseAmount: 32000, topExpensePercentage: 42,
    topIncomeName: "Salary", topIncomeAmount: 185000, topIncomePercentage: 75,
    fastClimberName: "Electricity & Bills", fastClimberGrowthPercentage: 45,
    habitTrackerName: "Food & Groceries", habitTrackerCount: 48,
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.categoriesCanvasWrapper}>
      
      {/* SECTION HEADER BAR BLOCK */}
      <header className={styles.pageHeaderDeck}>
        <div className={styles.titleGroup}>
          <h1 className={styles.mainTitleHeading}>Categories</h1>
          <p className={styles.subTitleDescription}>
            Create labels to group your transactions, choose custom colors, and see where your money goes.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            className={styles.bulkActionButton} 
            onClick={handleOpenBulkDrawer} 
            type="button"
          >
            <FiAlertCircle size={14} />
            <span>Unassigned Inbox</span>
            {filteredUnassigned.length > 0 && (
              <span className={styles.dynamicWarningBadgeCount}>{filteredUnassigned.length}</span>
            )}
          </button>

          <button 
            className={styles.createCategoryButton} 
            onClick={handleOpenCreateModal} 
            type="button"
          >
            <FiPlus size={15} />
            <span>Add New Category</span>
          </button>
        </div>
      </header>

      {/* METRIC SUMMARIES BREAKDOWN CARDS ROW */}
      <CategoryStats statsData={liveComputedStats} />

      {/* MAIN DENSE STORAGE ROW GRID PLATFORM */}
      <main className={styles.mainContentStage}>
        <CategoryGrid
          categoriesList={filteredCategories}
          onEditClick={handleEditCategory}
          onDeleteClick={handleDeleteCategory}
        />
      </main>

      {/* DYNAMIC BACKDROP ACCORDION POPUP LAYERS */}
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

      {/* RE-CLASSIFICATION SIDEBAR ORGANIZER OVERLAY DRAWER */}
      {isBulkDrawerOpen && (
        <BulkDrawer
          isOpen={isBulkDrawerOpen}
          onClose={handleCloseBulkDrawer}
          transactions={filteredUnassigned} 
          categories={categoryOptions}      
          onApplyCategory={handleApplyCategory}
        />
      )}

      {/* CLEAN & GENERIC SYSTEM FOOTER ANCHOR */}
      <footer className={styles.footerContainerBlock}>
        <DashboardFooter />
      </footer>
      
    </div>
  );
}
/* === SECTION 4 END === */