// src/components/transactions/BulkActionToolBelt/BulkActionToolBelt.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiTrash2, FiX, FiCheckSquare } from "react-icons/fi";
import styles from "./BulkActionToolBelt.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface BulkActionToolBeltProps {
  /** Count number of items currently checked inside the state array */
  selectedCount: number;
  /** Trigger callback resetting selected items tracking array back to zero */
  onClearSelection: () => void;
  /** Trigger callback firing mass batch record delete mutations */
  onBulkDelete: () => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & RENDER ===
   ========================================================================== */
export default function BulkActionToolBelt({
  selectedCount,
  onClearSelection,
  onBulkDelete,
}: BulkActionToolBeltProps) {
  
  // Guard clause: If nothing is checked or value is negative/NaN, hide component
  const safeCount = Math.max(0, Number(selectedCount) || 0);
  if (safeCount === 0) return null;

  return (
    <div className={styles.floatingToolBeltFixedAnchor} role="toolbar" aria-label="Bulk action tools">
      <div className={styles.toolBeltGlassBannerLayout}>
        
        {/* LEFT COUNTER AREA */}
        <div className={styles.selectionCounterCluster}>
          <FiCheckSquare size={16} className={styles.selectionIndicatorVector} />
          <p className={styles.counterStatusNotificationText}>
            <span className={styles.boldCounterDigit}>{safeCount}</span>{" "}
            {safeCount === 1 ? "transaction" : "transactions"} selected
          </p>
        </div>

        {/* RIGHT MASS ACTION RUNNERS */}
        <div className={styles.actionExecutionDockDeck}>
          <button
            type="button"
            className={styles.bulkActionButtonNode}
            onClick={onBulkDelete}
            title="Delete all selected line items permanently"
            aria-label={`Delete ${safeCount} selected transactions`}
          >
            <FiTrash2 size={14} />
            <span>Delete Selected</span>
          </button>
          
          <div className={styles.verticalDividerLineSplit} />

          {/* CLOSE / CANCEL TRIGGER */}
          <button
            type="button"
            className={styles.closeToolBeltCancelIconButton}
            onClick={onClearSelection}
            title="Deselect all rows"
            aria-label="Clear selection queue"
          >
            <FiX size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
/* === SECTION 3 END === */