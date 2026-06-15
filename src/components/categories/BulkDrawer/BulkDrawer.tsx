// src/components/categories/BulkDrawer/BulkDrawer.tsx

"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { FiX, FiCheckSquare, FiLayers } from "react-icons/fi";
// FIXED / WHY: Hook dependency to wire currency format actions directly to the active state channel
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./BulkDrawer.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface TransactionRecord {
  id: string;
  date: string;
  merchant: string;
  amount: number;
}

export interface CategoryOption {
  id: string;
  name: string;
}

interface BulkDrawerProps {
  /** Flag defining whether the sidebar overlay structural pane is rendered */
  isOpen: boolean;
  /** Action event tracking closure back to the parent component level */
  onClose: () => void;
  /** Group collection of all historical entries missing explicit relational hooks */
  transactions: TransactionRecord[];
  /** System dictionary options currently mapped for user assignments */
  categories: CategoryOption[];
  /** Data routing function updating records across database arrays simultaneously */
  onApplyCategory: (categoryId: string, transactionIds: string[]) => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function BulkDrawer({
  isOpen,
  onClose,
  transactions,
  categories,
  onApplyCategory,
}: BulkDrawerProps) {
  // FIXED / WHY: Consume the global format context to handle structural currency prefix and standard formatting values
  const { formatAmount } = useCurrency();

  // Track array collection of all user check selections across data matrices
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Store reference to target category update key option selected from input selectors
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Clean selections back out when operations finish or cancel hooks invoke
  const resetSelection = () => {
    setSelectedIds([]);
    setSelectedCategory("");
  };

  // Safe wrapper clearing active parameters prior to tracking panel exit triggers
  const handleCloseDrawer = () => {
    resetSelection();
    onClose();
  };

  // Safe verification processing loop verifying conditions pass bounds logic
  const handleOpenSafeApply = () => {
    if (!selectedCategory || selectedIds.length === 0) return;

    // Dispatches parameters upward to root controllers
    onApplyCategory(selectedCategory, selectedIds);

    // Flushes local layout scopes instantly for next interaction sequence
    resetSelection();
    onClose();
  };

  // Multi-select conditional validation checking presence against track collections
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);

      if (exists) {
        return prev.filter((item) => item !== id);
      }

      return [...prev, id];
    });
  };

  // Global toggle to select all or deselect all transactions at once
  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      const allIds = transactions.map((tx) => tx.id);
      setSelectedIds(allIds);
    }
  };

  // Halts element tracing tree generation early when layout is marked closed
  if (!isOpen) return null;
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.overlay} onClick={handleCloseDrawer}>
      <aside className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>

        {/* HEADER AREA */}
        <header className={styles.drawerHeader}>
          <div>
            <h2 className={styles.title}>Unassigned Workspace</h2>
            <p className={styles.subtitle}>
              {transactions.length} transactions require matching tags
            </p>
          </div>

          <button
            className={styles.closeButton}
            onClick={handleCloseDrawer}
            aria-label="Close drawer workspace"
          >
            <FiX size={18} />
          </button>
        </header>

        {/* BULK ACTION CONTROL UTILITY BAR */}
        {transactions.length > 0 && (
          <div className={styles.utilityControlBar}>
            <button 
              className={styles.bulkSelectToggleBtn} 
              onClick={toggleSelectAll}
              type="button"
            >
              <FiCheckSquare size={14} />
              {selectedIds.length === transactions.length ? "Deselect All" : "Select All Items"}
            </button>
          </div>
        )}

        {/* TRANSACTIONS SCROLLABLE PAN STREAM LIST */}
        <div className={styles.listContainer}>
          {transactions.length === 0 ? (
            <div className={styles.emptyStateDeck}>
              <div className={styles.emptyIconPill}>
                <FiLayers size={24} />
              </div>
              <h4>All Cleaned Up!</h4>
              <p>No unassigned statement transactions found pending assignment parameters.</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const isSelected = selectedIds.includes(tx.id);

              return (
                <div
                  key={tx.id}
                  className={`${styles.rowCard} ${isSelected ? styles.activeRowCard : ""}`}
                  onClick={() => toggleSelection(tx.id)}
                >
                  {/* Custom Styled Checklist Tracker Interface Bubble Node Component */}
                  <div className={`${styles.customCheckIndicator} ${isSelected ? styles.checkedIndicatorState : ""}`}>
                    {isSelected && <div className={styles.checkInnerCoreMark} />}
                  </div>

                  <div className={styles.metaDeck}>
                    <span className={styles.merchantLabel}>{tx.merchant}</span>
                    <span className={styles.dateStampText}>{tx.date}</span>
                  </div>

                  {/* FIXED / WHY: Replaced hardcoded Rs prefix token text layout with dynamic currency context formatting engine output */}
                  <div className={styles.amountDisplayBadge}>
                    {formatAmount(tx.amount, "PKR")}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PERSISTENT ELEVATED ACTION WORK BAR PANELS */}
        {selectedIds.length > 0 && (
          <footer className={styles.actionBarStage}>
            <div className={styles.actionBarTopRow}>
              <div className={styles.selectionCountBadge}>
                {selectedIds.length} Selected
              </div>
            </div>

            <div className={styles.actionExecutionRow}>
              <select
                className={styles.workspaceDropdownSelect}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Choose Destination Tag...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <button
                className={styles.workspaceApplyExecuteBtn}
                onClick={handleOpenSafeApply}
                disabled={!selectedCategory}
              >
                Apply Tag
              </button>
            </div>
          </footer>
        )}

      </aside>
    </div>
  );
}
/* === SECTION 4 END === */