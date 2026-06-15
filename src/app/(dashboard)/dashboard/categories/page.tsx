// src/app/(dashboard)/dashboard/categories/page.tsx

"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { FiAlertCircle, FiPlus } from "react-icons/fi";

// WHY: Imports the structural stats ribbon overview
import CategoryStats, {
  CategoryStatData,
} from "@/components/categories/CategoryStats/CategoryStats";

// WHY: Imports interactive list grids representing available target tokens
import CategoryGrid from "@/components/categories/CategoryGrid/CategoryGrid";

// WHY: Multi-selection utility workspace sheet interface component 
import BulkDrawer, {
  TransactionRecord,
  CategoryOption,
} from "@/components/categories/BulkDrawer/BulkDrawer";

import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface CategoryRecord {
  id: string;
  name: string;
  type: "income" | "expense" | "both";
  iconSlug: string;
  accentColor: string;
  transactionCount: number;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function CategoriesPage() {
  /* --- CATEGORIES MATRIX STATE --- */
  const [categories, setCategories] = useState<CategoryRecord[]>([
    { id: "cat-201", name: "Salary", type: "income", iconSlug: "FiBriefcase", accentColor: "#16a34a", transactionCount: 12 },
    { id: "cat-202", name: "Marketing", type: "expense", iconSlug: "FiTarget", accentColor: "#613bbf", transactionCount: 34 },
    { id: "cat-203", name: "Food & Groceries", type: "expense", iconSlug: "FiShoppingCart", accentColor: "#dc2626", transactionCount: 48 },
    { id: "cat-204", name: "Freelance Work", type: "income", iconSlug: "FiCpu", accentColor: "#2563eb", transactionCount: 8 },
    { id: "cat-205", name: "Electricity & Bills", type: "expense", iconSlug: "FiZap", accentColor: "#d97706", transactionCount: 15 },
  ]);

  /* --- BULK DRAWER RENDER STATUS STATE --- */
  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState(false);

  /* --- MUTABLE UNASSIGNED DATA ARRAYS STREAMS --- */
  const [unassignedTransactions, setUnassignedTransactions] = useState<TransactionRecord[]>([
    { id: "tx-1", date: "2026-06-10", merchant: "Amazon Warehouse", amount: 4500 },
    { id: "tx-2", date: "2026-06-11", merchant: "Shell Fuel Station", amount: 3200 },
    { id: "tx-3", date: "2026-06-12", merchant: "Uber Ride Logistics", amount: 900 },
    { id: "tx-4", date: "2026-06-13", merchant: "McDonald's Store", amount: 1200 },
  ]);

  /* --- DATA FORMAT MAPPERS FOR SELECTOR DROPDOWNS --- */
  const categoryOptions: CategoryOption[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));

  /* --- ACTION HANDLERS --- */
  const handleOpenBulkDrawer = () => setIsBulkDrawerOpen(true);
  const handleCloseBulkDrawer = () => setIsBulkDrawerOpen(false);

  /** * Processes batch updates. Filters modified records from view and
   * updates the category's transaction count dynamically.
   */
  const handleApplyCategory = (categoryId: string, transactionIds: string[]) => {
    // 1. Remove targeted records from the unassigned transactions pool
    setUnassignedTransactions((prevTx) => 
      prevTx.filter((tx) => !transactionIds.includes(tx.id))
    );

    // 2. Increment transaction counts for the chosen target category token
    setCategories((prevCats) =>
      prevCats.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            transactionCount: cat.transactionCount + transactionIds.length,
          };
        }
        return cat;
      })
    );

    // 3. Close the workspace drawer smoothly
    setIsBulkDrawerOpen(false);
  };

  const handleOpenCategoryCreationDrawer = () => {
    console.log("Add category clicked");
  };

  const handleEditCategory = (category: CategoryRecord) => {
    console.log("Edit:", category.name);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  /* --- COMPUTED ANALYTICAL VALUE DICTIONARIES --- */
  const liveComputedStats: CategoryStatData = {
    topExpenseName: "Marketing",
    topExpenseAmount: 32000,
    topExpensePercentage: 42,
    topIncomeName: "Salary",
    topIncomeAmount: 185000,
    topIncomePercentage: 75,
    fastClimberName: "Electricity & Bills",
    fastClimberGrowthPercentage: 45,
    habitTrackerName: "Food & Groceries",
    habitTrackerCount: 48,
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.categoriesCanvasWrapper}>

      {/* HEADER SECTION PANEL */}
      <header className={styles.pageHeaderDeck}>
        <div>
          <h1 className={styles.mainTitleHeading}>Categories</h1>
          <p className={styles.subTitleDescription}>
            Create labels to group your transactions, choose custom colors, and see where your money goes.
          </p>
        </div>

        {/* PRIMARY CONTROLLER INTERACTION ACTIONS DECK */}
        <div className={styles.headerActions}>
          
          <button
            className={styles.bulkActionButton}
            onClick={handleOpenBulkDrawer}
            type="button"
          >
            <FiAlertCircle size={14} />
            <span>Unassigned Inbox</span>
            {unassignedTransactions.length > 0 && (
              <span className={styles.dynamicWarningBadgeCount}>
                {unassignedTransactions.length}
              </span>
            )}
          </button>

          <button
            className={styles.createCategoryButton}
            onClick={handleOpenCategoryCreationDrawer}
            type="button"
          >
            <FiPlus size={15} />
            <span>Add New Category</span>
          </button>

        </div>
      </header>

      {/* HORIZONTAL ANALYTICAL TRACK METRICS */}
      <CategoryStats statsData={liveComputedStats} />

      {/* CATEGORIES COLLECTION LIST DISPLAY GRID */}
      <main className={styles.mainContentStage}>
        <CategoryGrid
          categoriesList={categories}
          onEditClick={handleEditCategory}
          onDeleteClick={handleDeleteCategory}
        />
      </main>

      {/* BACKGROUND INTERACTION BULK RECATEGORIZATION WORKSPACE OVERLAY */}
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
/* === SECTION 4 END === */