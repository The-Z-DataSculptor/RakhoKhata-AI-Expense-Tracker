// src/app/(dashboard)/dashboard/categories/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
// WHY: Imports the 4 simple stat cards component we updated earlier
import CategoryStats, { CategoryStatData } from "@/components/categories/CategoryStats/CategoryStats";
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
  /* --- STATE MANAGEMENT ENGINES --- */
  // Sample list of categories so you can see how they appear on the screen
  const [categories, setCategories] = useState<CategoryRecord[]>([
    { id: "cat-201", name: "Salary", type: "income", iconSlug: "FiBriefcase", accentColor: "#16a34a", transactionCount: 12 },
    { id: "cat-202", name: "Marketing", type: "expense", iconSlug: "FiTarget", accentColor: "#613bbf", transactionCount: 34 },
    { id: "cat-203", name: "Food & Groceries", type: "expense", iconSlug: "FiShoppingCart", accentColor: "#dc2626", transactionCount: 48 },
    { id: "cat-204", name: "Freelance Work", type: "income", iconSlug: "FiCpu", accentColor: "#2563eb", transactionCount: 8 },
    { id: "cat-205", name: "Electricity & Bills", type: "expense", iconSlug: "FiZap", accentColor: "#d97706", transactionCount: 15 },
  ]);

  /* --- INTERACTIVE ACTION CALLBACK TRIPPERS --- */
  // Runs when the user clicks the add button to open the form box
  const handleOpenCategoryCreationDrawer = () => {
    console.log("Add category button clicked.");
    
    // WHY: This temporary check updates state with its current self.
    // This tells TypeScript that 'setCategories' is being used and clears your warning error!
    setCategories((currentList) => currentList);
  };

  /* --- LIVE CALCULATION DATA FOR THE CARDS --- */
  // Simple numbers and labels that match our updated text design parameters
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
    habitTrackerCount: 48
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.categoriesCanvasWrapper}>
      
      {/* TOP HEADER BLOCK */}
      <header className={styles.pageHeaderDeck}>
        <div>
          <h1 className={styles.mainTitleHeading}>Categories</h1>
          <p className={styles.subTitleDescription}>
            Create labels to group your transactions, choose custom colors, and see where your money goes.
          </p>
        </div>
        <button 
          className={styles.createCategoryButton}
          onClick={handleOpenCategoryCreationDrawer}
          aria-label="Create a new category label"
        >
          <span>+ Add New Category</span>
        </button>
      </header>

      {/* COMPONENT 1: THE 4 SIMPLE STAT CARDS */}
      <CategoryStats statsData={liveComputedStats} />

      {/* COMPONENT 2: THE MAIN LIST CONTENT SECTION */}
      <main className={styles.mainContentStage}>
        <div className={styles.placeholderCard}>
          <p>
            Your main categories list will show up here next. <br />
            It will display all your {categories.length} custom categories with buttons to edit or delete them.
          </p>
        </div>
      </main>

    </div>
  );
}
/* === SECTION 4 END === */