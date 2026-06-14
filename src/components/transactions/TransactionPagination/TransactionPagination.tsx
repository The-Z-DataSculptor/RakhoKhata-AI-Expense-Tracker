// src/components/transactions/TransactionPagination/TransactionPagination.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import styles from "./TransactionPagination.module.css";

/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface TransactionPaginationProps {
  // Total number of records that matched your active filters
  totalItems: number;
  // Maximum capacity limit of records allowed per individual view index
  itemsPerPage: number;
  // The current active page number (1-indexed base)
  currentPage: number;
  // Callback trigger notifying parent state layout to switch page views
  onPageChange: (newPage: number) => void;
}

/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function TransactionPagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}: TransactionPaginationProps) {
  
  // Dynamic runtime arithmetic calculation parameters
  const validatedTotal = totalItems || 0;
  const validatedLimit = itemsPerPage || 5;
  const totalPagesCount = Math.ceil(validatedTotal / validatedLimit) || 1;

  // Calculate row boundaries currently displayed on client screen matrix positions
  const startingItemIndex = validatedTotal === 0 ? 0 : (currentPage - 1) * validatedLimit + 1;
  const endingItemIndex = Math.min(currentPage * validatedLimit, validatedTotal);

  // Beginner-friendly loop routine to populate a clean number array for index layout chips
  const dynamicPageNumbersArray: number[] = [];
  for (let pageIndex = 1; pageIndex <= totalPagesCount; pageIndex++) {
    dynamicPageNumbersArray.push(pageIndex);
  }

  return (
    /* ==========================================================================
       === SECTION 4: RENDER (JSX) ===
       ========================================================================== */
    <div className={styles.paginationFooterControlBelt}>
      
      {/* LEFT ASPECT: LOGGED DATA COMPLIANCE RANGE IDENTIFIER */}
      <div className={styles.rangeCounterTextLabel}>
        Showing <span className={styles.boldNumericFocusText}>{startingItemIndex}</span> to{" "}
        <span className={styles.boldNumericFocusText}>{endingItemIndex}</span> of{" "}
        <span className={styles.boldNumericFocusText}>{validatedTotal}</span> active logs
      </div>

      {/* RIGHT ASPECT: DIRECTIONAL NAVIGATION AND NUMERIC CONTROLLERS */}
      <div className={styles.interactivePageSwitcherDeck}>
        
        {/* PREVIOUS ACTION ACTION ICON */}
        <button
          type="button"
          className={styles.directionStepperPillNode}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Navigate to previous ledger data page"
        >
          <FiChevronLeft size={16} />
          <span>Previous</span>
        </button>

        {/* COMPACT NUMERIC CHIP SELECTION STACK LOOP */}
        <div className={styles.numericIndexChipCluster}>
          {dynamicPageNumbersArray.map((singlePageNum) => {
            const isTargetActivePage = singlePageNum === currentPage;
            
            return (
              <button
                key={singlePageNum}
                type="button"
                className={`${styles.numericIndexSelectionNode} ${isTargetActivePage ? styles.activePageChipNode : ""}`}
                onClick={() => onPageChange(singlePageNum)}
                aria-label={`Jump directly to ledger view index page ${singlePageNum}`}
                aria-current={isTargetActivePage ? "page" : undefined}
              >
                {singlePageNum}
              </button>
            );
          })}
        </div>

        {/* NEXT ACTION ICON BUTTON */}
        <button
          type="button"
          className={styles.directionStepperPillNode}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPagesCount}
          aria-label="Navigate to next ledger data page"
        >
          <span>Next</span>
          <FiChevronRight size={16} />
        </button>

      </div>

    </div>
    /* === SECTION 4 END === */
  );
}