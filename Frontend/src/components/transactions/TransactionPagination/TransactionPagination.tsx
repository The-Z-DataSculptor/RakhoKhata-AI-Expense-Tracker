// src/components/transactions/TransactionPagination/TransactionPagination.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useMemo } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import styles from "./TransactionPagination.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface TransactionPaginationProps {
  /** Total number of records that matched active filters */
  totalItems: number;
  /** Maximum capacity limit of records allowed per individual view index */
  itemsPerPage: number;
  /** The current active page number (1-indexed base) */
  currentPage: number;
  /** Callback trigger notifying parent state layout to switch page views */
  onPageChange: (newPage: number) => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & HELPERS ===
   ========================================================================== */
export default function TransactionPagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}: TransactionPaginationProps) {
  // WHY THIS FIX WAS MADE: Defensively bounds numeric inputs to prevent division-by-zero
  // or negative page index calculations.
  const safeTotal = Math.max(0, Number(totalItems) || 0);
  const safeLimit = Math.max(1, Number(itemsPerPage) || 10);
  const totalPagesCount = Math.max(1, Math.ceil(safeTotal / safeLimit));
  const safeCurrentPage = Math.min(Math.max(1, Number(currentPage) || 1), totalPagesCount);

  // Calculate row boundaries currently displayed on client screen positions
  const startingItemIndex = safeTotal === 0 ? 0 : (safeCurrentPage - 1) * safeLimit + 1;
  const endingItemIndex = Math.min(safeCurrentPage * safeLimit, safeTotal);

  // WHY THIS FIX WAS MADE: Uses a windowed page number range (max 5 visible buttons)
  // instead of rendering all pages to prevent browser DOM freezing on large datasets.
  const visiblePageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisibleButtons = 5;

    let startPage = Math.max(1, safeCurrentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = startPage + maxVisibleButtons - 1;

    if (endPage > totalPagesCount) {
      endPage = totalPagesCount;
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }, [safeCurrentPage, totalPagesCount]);
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.paginationFooterControlBelt} role="navigation" aria-label="Transaction Pagination">
      
      {/* LEFT ASPECT: LOGGED DATA COMPLIANCE RANGE IDENTIFIER */}
      <div className={styles.rangeCounterTextLabel}>
        Showing <span className={styles.boldNumericFocusText}>{startingItemIndex}</span> to{" "}
        <span className={styles.boldNumericFocusText}>{endingItemIndex}</span> of{" "}
        <span className={styles.boldNumericFocusText}>{safeTotal}</span> active logs
      </div>

      {/* RIGHT ASPECT: DIRECTIONAL NAVIGATION AND NUMERIC CONTROLLERS */}
      <div className={styles.interactivePageSwitcherDeck}>
        
        {/* PREVIOUS ACTION BUTTON */}
        <button
          type="button"
          className={styles.directionStepperPillNode}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          aria-label="Navigate to previous ledger data page"
        >
          <FiChevronLeft size={16} />
          <span>Previous</span>
        </button>

        {/* COMPACT NUMERIC CHIP SELECTION STACK */}
        <div className={styles.numericIndexChipCluster}>
          {visiblePageNumbers.map((singlePageNum) => {
            const isTargetActivePage = singlePageNum === safeCurrentPage;
            
            return (
              <button
                key={`page-node-${singlePageNum}`}
                type="button"
                className={`${styles.numericIndexSelectionNode} ${isTargetActivePage ? styles.activePageChipNode : ""}`}
                onClick={() => onPageChange(singlePageNum)}
                aria-label={`Jump directly to page ${singlePageNum}`}
                aria-current={isTargetActivePage ? "page" : undefined}
              >
                {singlePageNum}
              </button>
            );
          })}
        </div>

        {/* NEXT ACTION BUTTON */}
        <button
          type="button"
          className={styles.directionStepperPillNode}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPagesCount}
          aria-label="Navigate to next ledger data page"
        >
          <span>Next</span>
          <FiChevronRight size={16} />
        </button>

      </div>

    </div>
  );
}
/* === SECTION 4 END === */