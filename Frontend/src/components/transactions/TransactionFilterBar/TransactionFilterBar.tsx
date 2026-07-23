// src/components/transactions/TransactionFilterBar/TransactionFilterBar.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React from "react";
import { FiSearch, FiSliders, FiX, FiLayers, FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";
import styles from "./TransactionFilterBar.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export type TransactionTypeFilter = "all" | "income" | "expense";

/**
 * A category item with its ID and display name.
 */
interface CategoryOption {
  id: string;
  name: string;
}

interface TransactionFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedType: TransactionTypeFilter;
  onTypeChange: (type: TransactionTypeFilter) => void;
  /** All available categories for filtering – now includes IDs */
  categories: CategoryOption[];
  selectedCategory: string;   // category ID or "all"
  /** Called with the selected category ID (or "all") */
  onCategoryChange: (categoryId: string) => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */
export default function TransactionFilterBar({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  categories,
  selectedCategory,
  onCategoryChange,
}: TransactionFilterBarProps) {
  
  // Ensure we always have a valid array
  const safeCategories = Array.isArray(categories) ? categories : [];

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleClearSearchQuery = () => {
    onSearchChange("");
  };

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // The value is now a category ID (or "all")
    onCategoryChange(e.target.value);
  };
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: EXPORTS / RENDER COMPONENT ===
     ========================================================================== */
  return (
    <div className={styles.unifiedControlRowContainer}>
      
      {/* FILTER SUB-SECTION A: SEARCH INPUT ENGINE */}
      <div className={styles.searchBarDeckFrame}>
        <FiSearch className={styles.inputSearchVectorIcon} size={18} />
        <input
          type="text"
          className={styles.realtimeDataQueryInput}
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={handleSearchInputChange}
          aria-label="Search ledger transactions by description text"
        />
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            className={styles.clearSearchBtn}
            onClick={handleClearSearchQuery}
            aria-label="Clear search input query"
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* FILTER SUB-SECTION B: INTERACTIVE CONTROLS PACK */}
      <div className={styles.rightAlignedFilterControlsPack}>
        
        {/* SEGMENTED FLOW TYPE TRACK */}
        <div className={styles.segmentedToggleContainer} role="tablist" aria-label="Transaction type filter tabs">
          <button
            type="button"
            role="tab"
            aria-selected={selectedType === "all"}
            className={`${styles.togglePillNode} ${selectedType === "all" ? styles.activePillNodeAll : ""}`}
            onClick={() => onTypeChange("all")}
          >
            <FiLayers size={15} className={styles.pillIcon} />
            <span>All</span>
          </button>
          
          <button
            type="button"
            role="tab"
            aria-selected={selectedType === "income"}
            className={`${styles.togglePillNode} ${selectedType === "income" ? styles.activePillNodeIncome : ""}`}
            onClick={() => onTypeChange("income")}
          >
            <FiArrowUpRight size={15} className={styles.pillIcon} />
            <span>Income</span>
          </button>
          
          <button
            type="button"
            role="tab"
            aria-selected={selectedType === "expense"}
            className={`${styles.togglePillNode} ${selectedType === "expense" ? styles.activePillNodeExpense : ""}`}
            onClick={() => onTypeChange("expense")}
          >
            <FiArrowDownRight size={15} className={styles.pillIcon} />
            <span>Expense</span>
          </button>
        </div>

        {/* CATEGORY DROPDOWN – now uses IDs as values */}
        <div className={styles.dropdownPickerWrapper}>
          <FiSliders className={styles.dropdownContextIconPin} size={15} />
          <select
            className={styles.nativeSelectTagOverrider}
            value={selectedCategory}
            onChange={handleCategorySelectChange}
            aria-label="Filter ledger records by category value"
          >
            <option value="all">All Categories</option>
            {safeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

      </div>

    </div>
  );
}
/* === SECTION 4 END === */