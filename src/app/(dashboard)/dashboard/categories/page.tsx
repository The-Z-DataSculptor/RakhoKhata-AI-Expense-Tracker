// src/app/(dashboard)/dashboard/categories/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { FiAlertCircle, FiPlus } from "react-icons/fi";

// Connect to the global Workspace Brain
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext"; 

import CategoryStats, { CategoryStatData } from "@/components/categories/CategoryStats/CategoryStats";
import CategoryGrid from "@/components/categories/CategoryGrid/CategoryGrid";
import BulkDrawer, { TransactionRecord, CategoryOption } from "@/components/categories/BulkDrawer/BulkDrawer";

// Updated path targeting your new centralized forms layout
import { CategoryForm } from "@/components/forms/CategoryForm/CategoryForm";

import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface CategoryRecord {
  id: string;
  workspaceId: string; // Every category now belongs to a specific workspace
  name: string;
  type: "income" | "expense" | "both";
  iconSlug: string;
  accentColor: string;
  transactionCount: number;
}

// We extend the BulkDrawer transaction type locally so we can attach a workspace ID to dummy data
type UnassignedTransactionRecord = TransactionRecord & { workspaceId: string };
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function CategoriesPage() {
  // --- WORKSPACE CONTEXT ---
  const { activeWorkspaceId } = useWorkspace(); // Grab the currently active mode

  /* --- STATES MATRIX --- */
  const [categories, setCategories] = useState<CategoryRecord[]>([
    { id: "cat-201", workspaceId: "ws-personal-default", name: "Salary", type: "income", iconSlug: "FiBriefcase", accentColor: "#16a34a", transactionCount: 12 },
    { id: "cat-202", workspaceId: "ws-business-default", name: "Marketing", type: "expense", iconSlug: "FiTarget", accentColor: "#613bbf", transactionCount: 34 },
    { id: "cat-203", workspaceId: "ws-personal-default", name: "Food & Groceries", type: "expense", iconSlug: "FiShoppingCart", accentColor: "#dc2626", transactionCount: 48 },
    { id: "cat-204", workspaceId: "ws-business-default", name: "Freelance Work", type: "income", iconSlug: "FiCpu", accentColor: "#2563eb", transactionCount: 8 },
    { id: "cat-205", workspaceId: "ws-personal-default", name: "Electricity & Bills", type: "expense", iconSlug: "FiZap", accentColor: "#d97706", transactionCount: 15 },
  ]);

  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State pointer tracking which data model is actively undergoing modifications
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);

  const [unassignedTransactions, setUnassignedTransactions] = useState<UnassignedTransactionRecord[]>([
    { id: "tx-1", workspaceId: "ws-personal-default", date: "2026-06-10", merchant: "Amazon Warehouse", amount: 4500 },
    { id: "tx-2", workspaceId: "ws-personal-default", date: "2026-06-11", merchant: "Shell Fuel Station", amount: 3200 },
  ]);

  /* --- HANDLERS --- */
  const handleOpenBulkDrawer = () => setIsBulkDrawerOpen(true);
  const handleCloseBulkDrawer = () => setIsBulkDrawerOpen(false);

  const handleApplyCategory = (categoryId: string, transactionIds: string[]) => {
    setUnassignedTransactions((prevTx) => prevTx.filter((tx) => !transactionIds.includes(tx.id)));
    setCategories((prevCats) =>
      prevCats.map((cat) => cat.id === categoryId ? { ...cat, transactionCount: cat.transactionCount + transactionIds.length } : cat)
    );
    setIsBulkDrawerOpen(false);
  };

  // Open modal cleanly for a fresh brand new category
  const handleOpenCreateModal = () => {
    setEditingCategory(null); // Clear out old values context
    setIsModalOpen(true);
  };

  // Closes modal overlay deck and flushes reference pointers
  const handleClosePopupModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  // FIX: Removed 'any'. Using Omit to tell TypeScript we have everything except workspaceId, 
  // plus making workspaceId optional just in case the form passes it back during an edit.
  const handleUpsertCategory = (savedCategory: Omit<CategoryRecord, "workspaceId"> & { workspaceId?: string }) => {
    const categoryWithWorkspace: CategoryRecord = {
      ...savedCategory,
      workspaceId: savedCategory.workspaceId || (editingCategory ? editingCategory.workspaceId : activeWorkspaceId),
    };

    setCategories((prevList) => {
      const exists = prevList.some((c) => c.id === savedCategory.id);
      if (exists) {
        // Edit Mode path: map over array and swap out item
        return prevList.map((c) => (c.id === savedCategory.id ? categoryWithWorkspace : c));
      }
      // Create Mode path: prepend new item to list array
      return [categoryWithWorkspace, ...prevList];
    });
    
    handleClosePopupModal();
  };

  // Captures target category payload data element directly from the grid card trigger click
  const handleEditCategory = (category: CategoryRecord) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (id: string) => setCategories((prev) => prev.filter((c) => c.id !== id));

  /* --- DATA ENGINE CONVERSION: CLIENT SIDE LIVE COMPUTED FILTER MATRIX --- */
  // THE MAGIC FILTER: Only show records that belong to the active workspace
  const filteredCategories = categories.filter(cat => cat.workspaceId === activeWorkspaceId);
  const filteredUnassigned = unassignedTransactions.filter(tx => tx.workspaceId === activeWorkspaceId);

  // We only show category options in the bulk drawer for the active workspace
  const categoryOptions: CategoryOption[] = filteredCategories.map((cat) => ({ id: cat.id, name: cat.name }));

  // Note: These are hardcoded mock stats. In a production backend, this would calculate from filteredCategories dynamically.
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
      <header className={styles.pageHeaderDeck}>
        <div>
          <h1 className={styles.mainTitleHeading}>Categories</h1>
          <p className={styles.subTitleDescription}>Create labels to group your transactions, choose custom colors, and see where your money goes.</p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.bulkActionButton} onClick={handleOpenBulkDrawer} type="button">
            <FiAlertCircle size={14} />
            <span>Unassigned Inbox</span>
            {filteredUnassigned.length > 0 && <span className={styles.dynamicWarningBadgeCount}>{filteredUnassigned.length}</span>}
          </button>

          <button className={styles.createCategoryButton} onClick={handleOpenCreateModal} type="button">
            <FiPlus size={15} />
            <span>Add New Category</span>
          </button>
        </div>
      </header>

      <CategoryStats statsData={liveComputedStats} />

      <main className={styles.mainContentStage}>
        {/* WE PASS THE FILTERED CATEGORIES HERE INSTEAD OF THE RAW ONES */}
        <CategoryGrid
          categoriesList={filteredCategories}
          onEditClick={handleEditCategory}
          onDeleteClick={handleDeleteCategory}
        />
      </main>

      {/* Render popup overlay layer structure */}
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

      <BulkDrawer
        isOpen={isBulkDrawerOpen}
        onClose={handleCloseBulkDrawer}
        transactions={filteredUnassigned} // Only pass unassigned from this workspace
        categories={categoryOptions}      // Only pass options from this workspace
        onApplyCategory={handleApplyCategory}
      />
    </div>
  );
}
/* === SECTION 4 END === */