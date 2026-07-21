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
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */
export type TransactionTypeFilter = "all" | "income" | "expense";

interface TransactionFilterBarProps {
  /** Live text query string used to search transactions */
  searchQuery: string;
  /** Callback triggered when search text changes */
  onSearchChange: (value: string) => void;
  /** Currently selected flow filter type ("all" | "income" | "expense") */
  selectedType: TransactionTypeFilter;
  /** Callback triggered when cash flow filter changes */
  onTypeChange: (type: TransactionTypeFilter) => void;
  /** Array of available category names in the current workspace */
  availableCategories: string[];
  /** Currently selected category filter string token */
  selectedCategory: string;
  /** Callback triggered when selected category changes */
  onCategoryChange: (category: string) => void;
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
  availableCategories,
  selectedCategory,
  onCategoryChange,
}: TransactionFilterBarProps) {
  
  // Guard fallback ensuring availableCategories is always a valid string array
  const validatedCategories = availableCategories || [];

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleClearSearchQuery = () => {
    onSearchChange("");
  };

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

        {/* EXPANDED CATEGORY DROPDOWN SELECTOR */}
        <div className={styles.dropdownPickerWrapper}>
          <FiSliders className={styles.dropdownContextIconPin} size={15} />
          <select
            className={styles.nativeSelectTagOverrider}
            value={selectedCategory}
            onChange={handleCategorySelectChange}
            aria-label="Filter ledger records by category value"
          >
            <option value="all">All Categories</option>
            {validatedCategories.map((categoryItem) => (
              <option key={categoryItem} value={categoryItem.toLowerCase()}>
                {categoryItem}
              </option>
            ))}
          </select>
        </div>

      </div>

    </div>
  );
}
/* === SECTION 4 END === */