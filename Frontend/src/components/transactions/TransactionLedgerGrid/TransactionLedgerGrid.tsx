// src/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { 
  FiArrowUpRight, 
  FiArrowDownLeft, 
  FiTrash2, 
  FiEdit2, 
  FiBell, 
  FiCheckSquare,
  FiBookOpen // 🚀 Added for the premium empty state
} from "react-icons/fi";
import styles from "./TransactionLedgerGrid.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface TransactionRecord {
  id: string;
  date: string;
  description: string;
  category: string;
  originalAmount: number;
  originalCurrency: string;
  amount?: number;
  type: "income" | "expense";
}

interface TransactionLedgerGridProps {
  records: TransactionRecord[];
  onEditRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onSendReminder?: (record: TransactionRecord) => void;
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAllOnPage: (pageRecordIds: string[]) => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & HELPERS ===
   ========================================================================== */
const formatOriginalCurrency = (amount: unknown, currency?: string): string => {
  const numericVal = Number(amount);
  const safeAmount = isNaN(numericVal) ? 0 : numericVal;
  const safeCurrency = currency ? currency.trim().toUpperCase() : "USD";
  return `${safeAmount.toFixed(2)} ${safeCurrency}`;
};

const checkIsDebtCategory = (catName?: string): boolean => {
  if (!catName) return false;
  const lowercase = catName.toLowerCase();
  return lowercase.includes("owed") || lowercase.includes("debts");
};

export default function TransactionLedgerGrid({
  records,
  onEditRecord,
  onDeleteRecord,
  onSendReminder,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAllOnPage,
}: TransactionLedgerGridProps) {
  // Defensive array verification
  const validatedRecords = Array.isArray(records) ? records : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  const isAllOnPageSelected = 
    validatedRecords.length > 0 && 
    validatedRecords.every((row) => safeSelectedIds.includes(row.id));

  const currentPageIds = validatedRecords.map((row) => row.id);
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.ledgerTableViewportWrapper}>
      {validatedRecords.length === 0 ? (
        
        /* 🚀 NEW PREMIUM EMPTY STATE */
        <div className={styles.emptyStateContainerBlock} role="status">
          <div className={styles.emptyStateGlassCard}>
            <div className={styles.emptyStateIconWrapper}>
              <FiBookOpen className={styles.emptyStateIcon} />
            </div>
            <h3 className={styles.emptyStateHeadline}>Welcome to Your Ledger!</h3>
            <p className={styles.emptyStateNoticeText}>
              Select the right workspace above, record your first transaction, and watch your dashboard come alive. Let's get tracking!
            </p>
          </div>
        </div>

      ) : (
        <>
          {/* DESKTOP HIGH-DENSITY TABLE */}
          <div className={styles.desktopTableFrameContainer}>
            <table className={styles.nativeHighDensityTableElement}>
              <thead>
                <tr>
                  <th style={{ width: "50px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      className={styles.rowSelectionCheckboxInput}
                      checked={isAllOnPageSelected}
                      onChange={() => onToggleSelectAllOnPage(currentPageIds)}
                      aria-label="Select all transactions on current page"
                    />
                  </th>
                  <th style={{ width: "120px" }}>Date</th>
                  <th>Description</th>
                  <th style={{ width: "160px" }}>Category</th>
                  <th style={{ width: "180px", textAlign: "right" }}>Amount (Original)</th>
                  <th style={{ width: "140px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {validatedRecords.map((singleRowItem, index) => {
                  const isIncomeType = singleRowItem.type === "income";
                  const isRowChecked = safeSelectedIds.includes(singleRowItem.id);
                  const isDebt = checkIsDebtCategory(singleRowItem.category);
                  const uniqueKey = singleRowItem.id || `row-${index}`;

                  return (
                    <tr 
                      key={uniqueKey} 
                      className={`${styles.zebraStripeRowNode} ${isRowChecked ? styles.selectedRowHighlightNode : ""}`}
                    >
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          className={styles.rowSelectionCheckboxInput}
                          checked={isRowChecked}
                          onChange={() => onToggleSelectRow(singleRowItem.id)}
                          aria-label={`Select transaction ${singleRowItem.description || ""}`}
                        />
                      </td>
                      <td className={styles.calendarDateCellText}>{singleRowItem.date || "N/A"}</td>
                      <td className={styles.descriptiveDetailsCellText} title={singleRowItem.description}>
                        {singleRowItem.description || "Untitled Transaction"}
                      </td>
                      <td>
                        <span className={styles.categoryLabelBadgeToken}>
                          {singleRowItem.category || "Unassigned"}
                        </span>
                      </td>
                      <td className={styles.numericAmountCellTextPositioner}>
                        <div className={`${styles.inlineAmountFlexCluster} ${isIncomeType ? styles.incomeColorAccentNode : styles.expenseColorAccentNode}`}>
                          {isIncomeType ? <FiArrowDownLeft size={14} /> : <FiArrowUpRight size={14} />}
                          <span>{formatOriginalCurrency(singleRowItem.originalAmount, singleRowItem.originalCurrency)}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionUtilitesButtonDock}>
                          {isDebt && onSendReminder ? (
                            <button
                              type="button"
                              className={styles.rowUtilityIconButtonNode}
                              style={{ color: "var(--color-primary, #6366f1)" }}
                              onClick={() => onSendReminder(singleRowItem)}
                              title="Send debt reminder link"
                              aria-label={`Send debt reminder for ${singleRowItem.description}`}
                            >
                              <FiBell size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={`${styles.rowUtilityIconButtonNode} ${styles.invisibleLayoutSlot}`}
                              disabled
                              tabIndex={-1}
                              aria-hidden="true"
                            />
                          )}
                          <button
                            type="button"
                            className={styles.rowUtilityIconButtonNode}
                            onClick={() => onEditRecord(singleRowItem.id)}
                            title="Edit record"
                            aria-label={`Edit ${singleRowItem.description}`}
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.rowUtilityIconButtonNode} ${styles.dangerHoverPillNode}`}
                            onClick={() => onDeleteRecord(singleRowItem.id)}
                            title="Delete record"
                            aria-label={`Delete ${singleRowItem.description}`}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* HIGH-DENSITY MOBILE COMPACT LIST */}
          <div className={styles.mobileCardsStackViewportFrame}>
            
            {/* MOBILE BULK SELECT TOOLBAR */}
            <div className={styles.mobileSelectAllHeaderBar}>
              <label className={styles.mobileSelectAllLabel}>
                <input
                  type="checkbox"
                  className={styles.rowSelectionCheckboxInput}
                  checked={isAllOnPageSelected}
                  onChange={() => onToggleSelectAllOnPage(currentPageIds)}
                />
                <span className={styles.mobileSelectAllText}>
                  <FiCheckSquare size={14} /> Select All Page ({validatedRecords.length})
                </span>
              </label>
            </div>

            {/* COMPACT LIST CONTAINER */}
            <div className={styles.mobileCompactListWrapper}>
              {validatedRecords.map((singleRowItem, index) => {
                const isIncomeType = singleRowItem.type === "income";
                const isRowChecked = safeSelectedIds.includes(singleRowItem.id);
                const isDebt = checkIsDebtCategory(singleRowItem.category);
                const uniqueKey = singleRowItem.id || `mobile-row-${index}`;

                return (
                  <div 
                    key={uniqueKey} 
                    className={`${styles.mobileCompactRowItem} ${isRowChecked ? styles.mobileRowChecked : ""}`}
                  >
                    {/* LEFT SECTION: CHECKBOX & FLOW ICON */}
                    <div className={styles.mobileRowLeft}>
                      <input
                        type="checkbox"
                        className={styles.rowSelectionCheckboxInput}
                        checked={isRowChecked}
                        onChange={() => onToggleSelectRow(singleRowItem.id)}
                      />
                      <div className={`${styles.mobileIconBadge} ${isIncomeType ? styles.incomeIconBg : styles.expenseIconBg}`}>
                        {isIncomeType ? <FiArrowDownLeft size={14} /> : <FiArrowUpRight size={14} />}
                      </div>
                    </div>

                    {/* MIDDLE SECTION: DESCRIPTION & CATEGORY/DATE */}
                    <div className={styles.mobileRowMiddle}>
                      <h4 className={styles.mobileRowTitle} title={singleRowItem.description}>
                        {singleRowItem.description || "Untitled Transaction"}
                      </h4>
                      <div className={styles.mobileRowMetaLine}>
                        <span className={styles.mobileCategoryTag}>{singleRowItem.category || "Unassigned"}</span>
                        <span className={styles.mobileDotDivider}>•</span>
                        <span className={styles.mobileRowDate}>{singleRowItem.date || "N/A"}</span>
                      </div>
                    </div>

                    {/* RIGHT SECTION: AMOUNT & COMPACT ACTIONS */}
                    <div className={styles.mobileRowRight}>
                      <span className={`${styles.mobileRowAmount} ${isIncomeType ? styles.incomeColorAccentNode : styles.expenseColorAccentNode}`}>
                        {isIncomeType ? "+" : "-"}{formatOriginalCurrency(singleRowItem.originalAmount, singleRowItem.originalCurrency)}
                      </span>

                      <div className={styles.mobileRowActions}>
                        {isDebt && onSendReminder && (
                          <button
                            type="button"
                            className={styles.mobileMiniActionBtn}
                            onClick={() => onSendReminder(singleRowItem)}
                            title="Send reminder"
                            aria-label={`Send debt reminder for ${singleRowItem.description}`}
                          >
                            <FiBell size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.mobileMiniActionBtn}
                          onClick={() => onEditRecord(singleRowItem.id)}
                          title="Edit"
                          aria-label={`Edit ${singleRowItem.description}`}
                        >
                          <FiEdit2 size={12} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.mobileMiniActionBtn} ${styles.mobileDeleteMiniBtn}`}
                          onClick={() => onDeleteRecord(singleRowItem.id)}
                          title="Delete"
                          aria-label={`Delete ${singleRowItem.description}`}
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
/* === SECTION 4 END === */