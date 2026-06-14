// src/components/transactions/TransactionFilterBar/TransactionFilterBar.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiSearch, FiSliders } from "react-icons/fi";
import styles from "./TransactionFilterBar.module.css";

/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export type TransactionTypeFilter = "all" | "income" | "expense";

interface TransactionFilterBarProps {
  // Current textual value matching our live data matrix query
  searchQuery: string;
  // Callback notification payload carrying keystroke changes upwards
  onSearchChange: (value: string) => void;
  // Current active segmented button value tracking cash types
  selectedType: TransactionTypeFilter;
  // Callback notification triggering type modifications
  onTypeChange: (type: TransactionTypeFilter) => void;
  // Unique list array used to populate category select tags
  availableCategories: string[];
  // Active string category code token
  selectedCategory: string;
  // Callback payload changing the system selection criteria
  onCategoryChange: (category: string) => void;
}

/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
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
  
  // Clean fallback guard loops to verify list arrays exist cleanly
  const validatedCategories = availableCategories || [];

  return (
    /* ==========================================================================
       === SECTION 4: RENDER (JSX) ===
       ========================================================================== */
    <div className={styles.unifiedControlRowContainer}>
      
      {/* FILTER SUB-SECTION A: MAGNIFYING SEARCH BOX ENGINE */}
      <div className={styles.searchBarDeckFrame}>
        <FiSearch className={styles.inputSearchVectorIcon} size={18} />
        <input
          type="text"
          className={styles.realtimeDataQueryInput}
          placeholder="Search by description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* FILTER SUB-SECTION B: INTERACTIVE CONTROLS WRAPPER PACK */}
      <div className={styles.rightAlignedFilterControlsPack}>
        
        {/* SEGMENTED BUTTON SWITCH COMPONENT BLOCK */}
        <div className={styles.segmentedToggleContainer}>
          <button
            type="button"
            className={`${styles.togglePillNode} ${selectedType === "all" ? styles.activePillNode : ""}`}
            onClick={() => onTypeChange("all")}
          >
            All Logs
          </button>
          
          <button
            type="button"
            className={`${styles.togglePillNode} ${selectedType === "income" ? styles.activePillNode : ""}`}
            onClick={() => onTypeChange("income")}
          >
            Income
          </button>
          
          <button
            type="button"
            className={`${styles.togglePillNode} ${selectedType === "expense" ? styles.activePillNode : ""}`}
            onClick={() => onTypeChange("expense")}
          >
            Expenses
          </button>
        </div>

        {/* CUSTOM SELECTION CATEGORY SELECTOR CHIP CONTAINER */}
        <div className={styles.dropdownPickerWrapper}>
          <FiSliders className={styles.dropdownContextIconPin} size={14} />
          <select
            className={styles.nativeSelectTagOverrider}
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
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
    /* === SECTION 4 END === */
  );
}