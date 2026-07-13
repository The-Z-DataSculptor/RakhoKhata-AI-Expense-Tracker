// src/components/categories/BulkDrawer/BulkDrawer.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
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

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const resetSelection = () => {
    setSelectedIds([]);
    setSelectedCategory("");
  };

  const handleCloseDrawer = () => {
    resetSelection();
    onClose();
  };

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
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      const allIds = transactions.map((tx) => tx.id);
      setSelectedIds(allIds);
    }
  };

  if (!isOpen) return null;
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.overlay} onClick={handleCloseDrawer}>
      <aside className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>

        <header className={styles.drawerHeader}>
          <div>
            <h2 className={styles.title}>Unassigned Workspace</h2>
            <p className={styles.subtitle}>
              {transactions.length} transactions require matching tags
            </p>
          </div>
          <button className={styles.closeButton} onClick={handleCloseDrawer} aria-label="Close drawer">
            <FiX size={18} />
          </button>
        </header>

        {transactions.length > 0 && (
          <div className={styles.utilityControlBar}>
            <button className={styles.bulkSelectToggleBtn} onClick={toggleSelectAll} type="button">
              <FiCheckSquare size={14} />
              {selectedIds.length === transactions.length ? "Deselect All" : "Select All Items"}
            </button>
          </div>
        )}

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
                  <div className={`${styles.customCheckIndicator} ${isSelected ? styles.checkedIndicatorState : ""}`}>
                    {isSelected && <div className={styles.checkInnerCoreMark} />}
                  </div>
                  <div className={styles.metaDeck}>
                    <span className={styles.merchantLabel}>{tx.merchant}</span>
                    <span className={styles.dateStampText}>{tx.date}</span>
                  </div>
                  <div className={styles.amountDisplayBadge}>
                    {/* ✅ FIXED: Use "USD" as source (amounts are in base USD) */}
                    {formatAmount(tx.amount, "USD")}
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