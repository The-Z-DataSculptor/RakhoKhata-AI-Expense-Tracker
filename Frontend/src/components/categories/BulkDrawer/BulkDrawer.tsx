// src/components/categories/BulkDrawer/BulkDrawer.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect, useCallback } from "react";
import { FiX, FiCheckSquare, FiLayers } from "react-icons/fi";
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
  amount: number; // in base USD
}

export interface CategoryOption {
  id: string;
  name: string;
}

interface BulkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionRecord[];
  categories: CategoryOption[];
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
  const { formatAmount } = useCurrency();

  // Defensive array sanitization
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const resetSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectedCategory("");
  }, []);

  const handleCloseDrawer = useCallback(() => {
    resetSelection();
    onClose();
  }, [resetSelection, onClose]);

  // WHY THIS FIX WAS MADE: Listens for keydown events to allow closing the drawer via 'Escape',
  // maintaining accessibility compliance for keyboard users.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCloseDrawer();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleCloseDrawer]);

  const handleOpenSafeApply = () => {
    if (!selectedCategory || selectedIds.length === 0) return;
    onApplyCategory(selectedCategory, selectedIds);
    resetSelection();
    onClose();
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === safeTransactions.length) {
      setSelectedIds([]);
    } else {
      const allIds = safeTransactions.map((tx) => tx.id);
      setSelectedIds(allIds);
    }
  };

  if (!isOpen) return null;
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.overlay} onClick={handleCloseDrawer} role="dialog" aria-modal="true" aria-label="Unassigned Workspace Drawer">
      <aside className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>

        {/* Mobile visual drag handle for native sheet appearance */}
        <div className={styles.mobileDragHandle} />

        <header className={styles.drawerHeader}>
          <div className={styles.headerTextGroup}>
            <h2 className={styles.title}>Unassigned Workspace</h2>
            <p className={styles.subtitle}>
              {safeTransactions.length} transactions require matching tags
            </p>
          </div>
          <button type="button" className={styles.closeButton} onClick={handleCloseDrawer} aria-label="Close drawer">
            <FiX size={18} />
          </button>
        </header>

        {safeTransactions.length > 0 && (
          <div className={styles.utilityControlBar}>
            <button className={styles.bulkSelectToggleBtn} onClick={toggleSelectAll} type="button">
              <FiCheckSquare size={16} />
              <span>{selectedIds.length === safeTransactions.length ? "Deselect All" : "Select All Items"}</span>
            </button>
          </div>
        )}

        <div className={styles.listContainer}>
          {safeTransactions.length === 0 ? (
            <div className={styles.emptyStateDeck}>
              <div className={styles.emptyIconPill}>
                <FiLayers size={24} />
              </div>
              <h4>All Cleaned Up!</h4>
              <p>No unassigned statement transactions found pending assignment parameters.</p>
            </div>
          ) : (
            safeTransactions.map((tx, idx) => {
              const uniqueTxKey = tx.id || `unassigned-tx-${idx}`;
              const isSelected = selectedIds.includes(tx.id);
              return (
                <div
                  key={uniqueTxKey}
                  className={`${styles.rowCard} ${isSelected ? styles.activeRowCard : ""}`}
                  onClick={() => toggleSelection(tx.id)}
                >
                  <div className={`${styles.customCheckIndicator} ${isSelected ? styles.checkedIndicatorState : ""}`}>
                    {isSelected && <div className={styles.checkInnerCoreMark} />}
                  </div>
                  <div className={styles.metaDeck}>
                    <span className={styles.merchantLabel}>{tx.merchant || "Imported Entry"}</span>
                    <span className={styles.dateStampText}>{tx.date || "N/A"}</span>
                  </div>
                  <div className={styles.amountDisplayBadge}>
                    {formatAmount(Number(tx.amount) || 0, "USD")}
                  </div>
                </div>
              );
            })
          )}
        </div>

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
                aria-label="Select Destination Category Tag"
              >
                <option value="">Choose Destination Tag...</option>
                {safeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
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