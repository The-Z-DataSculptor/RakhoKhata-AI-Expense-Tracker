// src/app/(dashboard)/dashboard/categories/page.tsx
"use client";

import React, { useState } from "react";
import { FiAlertCircle, FiPlus } from "react-icons/fi";

import CategoryStats, { CategoryStatData } from "@/components/categories/CategoryStats/CategoryStats";
import CategoryGrid from "@/components/categories/CategoryGrid/CategoryGrid";
import BulkDrawer, { TransactionRecord, CategoryOption } from "@/components/categories/BulkDrawer/BulkDrawer";
import { CategoryForm } from "./_components/CategoryForm";

import styles from "./page.module.css";

export interface CategoryRecord {
  id: string;
  name: string;
  type: "income" | "expense" | "both";
  iconSlug: string;
  accentColor: string;
  transactionCount: number;
}

export default function CategoriesPage() {
  /* --- STATES MATRIX --- */
  const [categories, setCategories] = useState<CategoryRecord[]>([
    { id: "cat-201", name: "Salary", type: "income", iconSlug: "FiBriefcase", accentColor: "#16a34a", transactionCount: 12 },
    { id: "cat-202", name: "Marketing", type: "expense", iconSlug: "FiTarget", accentColor: "#613bbf", transactionCount: 34 },
    { id: "cat-203", name: "Food & Groceries", type: "expense", iconSlug: "FiShoppingCart", accentColor: "#dc2626", transactionCount: 48 },
    { id: "cat-204", name: "Freelance Work", type: "income", iconSlug: "FiCpu", accentColor: "#2563eb", transactionCount: 8 },
    { id: "cat-205", name: "Electricity & Bills", type: "expense", iconSlug: "FiZap", accentColor: "#d97706", transactionCount: 15 },
  ]);

  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // FIXED: New state pointer tracking which data model is actively undergoing modifications
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);

  const [unassignedTransactions, setUnassignedTransactions] = useState<TransactionRecord[]>([
    { id: "tx-1", date: "2026-06-10", merchant: "Amazon Warehouse", amount: 4500 },
    { id: "tx-2", date: "2026-06-11", merchant: "Shell Fuel Station", amount: 3200 },
  ]);

  const categoryOptions: CategoryOption[] = categories.map((cat) => ({ id: cat.id, name: cat.name }));

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

  // FIXED: Open modal cleanly for a fresh brand new category
  const handleOpenCreateModal = () => {
    setEditingCategory(null); // Clear out old values context
    setIsModalOpen(true);
  };

  // FIXED: Closes modal overlay deck and flushes reference pointers
  const handleClosePopupModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  // FIXED: Handles both updates and creation saves within a unified processor function
  const handleUpsertCategory = (savedCategory: CategoryRecord) => {
    setCategories((prevList) => {
      const exists = prevList.some((c) => c.id === savedCategory.id);
      if (exists) {
        // Edit Mode path: map over array and swap out item
        return prevList.map((c) => (c.id === savedCategory.id ? savedCategory : c));
      }
      // Create Mode path: prepend new item to list array
      return [savedCategory, ...prevList];
    });
    
    handleClosePopupModal();
  };

  // FIXED: Captures target category payload data element directly from the grid card trigger click
  const handleEditCategory = (category: CategoryRecord) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (id: string) => setCategories((prev) => prev.filter((c) => c.id !== id));

  const liveComputedStats: CategoryStatData = {
    topExpenseName: "Marketing", topExpenseAmount: 32000, topExpensePercentage: 42,
    topIncomeName: "Salary", topIncomeAmount: 185000, topIncomePercentage: 75,
    fastClimberName: "Electricity & Bills", fastClimberGrowthPercentage: 45,
    habitTrackerName: "Food & Groceries", habitTrackerCount: 48,
  };

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
            {unassignedTransactions.length > 0 && <span className={styles.dynamicWarningBadgeCount}>{unassignedTransactions.length}</span>}
          </button>

          {/* FIXED: Swapped to explicit handler layout call */}
          <button className={styles.createCategoryButton} onClick={handleOpenCreateModal} type="button">
            <FiPlus size={15} />
            <span>Add New Category</span>
          </button>
        </div>
      </header>

      <CategoryStats statsData={liveComputedStats} />

      <main className={styles.mainContentStage}>
        {/* FIXED: Wire up our new trigger tracking function directly into the custom grid */}
        <CategoryGrid
          categoriesList={categories}
          onEditClick={handleEditCategory}
          onDeleteClick={handleDeleteCategory}
        />
      </main>

      {/* FIXED: Render popup overlay layer structure, passing data dependencies smoothly */}
      {isModalOpen && (
        <div className={styles.modalOverlayBackdrop} onClick={handleClosePopupModal}>
          <div className={styles.modalContentCard} onClick={(e) => e.stopPropagation()}>
            <CategoryForm 
              onAddCategory={handleUpsertCategory} 
              initialData={editingCategory}
              onCancel={handleClosePopupModal} /* Ready to hook up to your form internal triggers */
            />
          </div>
        </div>
      )}

      <BulkDrawer
        isOpen={isBulkDrawerOpen}
        onClose={handleCloseBulkDrawer}
        transactions={unassignedTransactions}
        categories={categoryOptions}
        onApplyCategory={handleApplyCategory}
      />
    </div>
  );
}