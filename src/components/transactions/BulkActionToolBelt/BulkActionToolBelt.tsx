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
  // Count number of items currently checked inside the state array
  selectedCount: number;
  // Trigger callback resetting selected items tracking array back to zero
  onClearSelection: () => void;
  // Trigger callback firing mass batch record delete mutations
  onBulkDelete: () => void;
}

/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function BulkActionToolBelt({
  selectedCount,
  onClearSelection,
  onBulkDelete,
}: BulkActionToolBeltProps) {
  
  // Guard clause: If nothing is checked, keep the component out of the layout entirely
  if (selectedCount === 0) return null;

  return (
    /* ==========================================================================
       === SECTION 4: RENDER (JSX) ===
       ========================================================================== */
    <div className={styles.floatingToolBeltFixedAnchor}>
      <div className={styles.toolBeltGlassBannerLayout}>
        
        {/* LEFT COUNTER AREA */}
        <div className={styles.selectionCounterCluster}>
          <FiCheckSquare size={16} className={styles.selectionIndicatorVector} />
          <p className={styles.counterStatusNotificationText}>
            <span className={styles.boldCounterDigit}>{selectedCount}</span>{" "}
            {selectedCount === 1 ? "transaction" : "transactions"} selected
          </p>
        </div>

        {/* RIGHT MASS ACTION RUNNERS */}
        <div className={styles.actionExecutionDockDeck}>
          <button
            type="button"
            className={styles.bulkActionButtonNode}
            onClick={onBulkDelete}
            title="Delete all selected line items permanently"
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
            aria-label="Clear raw item checking queue"
          >
            <FiX size={16} />
          </button>
        </div>

      </div>
    </div>
    /* === SECTION 4 END === */
  );
}