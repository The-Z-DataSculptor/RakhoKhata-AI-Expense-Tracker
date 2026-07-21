// src/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiArrowUpRight, FiArrowDownLeft, FiTrash2, FiEdit2, FiBell, FiCheckSquare } from "react-icons/fi";
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
   === SECTION 3: COMPONENT LOGIC & RENDER ===
   ========================================================================== */
export default function TransactionLedgerGrid({
  records,
  onEditRecord,
  onDeleteRecord,
  onSendReminder,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAllOnPage,
}: TransactionLedgerGridProps) {
  
  const validatedRecords = records || [];
  const isAllOnPageSelected = validatedRecords.length > 0 && validatedRecords.every((row) => selectedIds.includes(row.id));
  const currentPageIds = validatedRecords.map((row) => row.id);

  const formatOriginalCurrency = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  const checkIsDebtCategory = (catName: string) => {
    const lowercase = catName.toLowerCase();
    return lowercase.includes("owed") || lowercase.includes("debts");
  };

  return (
    <div className={styles.ledgerTableViewportWrapper}>
      {validatedRecords.length === 0 ? (
        <div className={styles.emptyStateContainerBlock}>
          <p className={styles.emptyStateNoticeText}>
            No active transaction logs match your filter combinations.
          </p>
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
                {validatedRecords.map((singleRowItem) => {
                  const isIncomeType = singleRowItem.type === "income";
                  const isRowChecked = selectedIds.includes(singleRowItem.id);
                  const isDebt = checkIsDebtCategory(singleRowItem.category);
                  
                  return (
                    <tr 
                      key={singleRowItem.id} 
                      className={`${styles.zebraStripeRowNode} ${isRowChecked ? styles.selectedRowHighlightNode : ""}`}
                    >
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          className={styles.rowSelectionCheckboxInput}
                          checked={isRowChecked}
                          onChange={() => onToggleSelectRow(singleRowItem.id)}
                        />
                      </td>
                      <td className={styles.calendarDateCellText}>{singleRowItem.date}</td>
                      <td className={styles.descriptiveDetailsCellText}>{singleRowItem.description}</td>
                      <td>
                        <span className={styles.categoryLabelBadgeToken}>
                          {singleRowItem.category}
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
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.rowUtilityIconButtonNode} ${styles.dangerHoverPillNode}`}
                            onClick={() => onDeleteRecord(singleRowItem.id)}
                            title="Delete record"
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
              {validatedRecords.map((singleRowItem) => {
                const isIncomeType = singleRowItem.type === "income";
                const isRowChecked = selectedIds.includes(singleRowItem.id);
                const isDebt = checkIsDebtCategory(singleRowItem.category);

                return (
                  <div 
                    key={singleRowItem.id} 
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
                        {singleRowItem.description}
                      </h4>
                      <div className={styles.mobileRowMetaLine}>
                        <span className={styles.mobileCategoryTag}>{singleRowItem.category}</span>
                        <span className={styles.mobileDotDivider}>•</span>
                        <span className={styles.mobileRowDate}>{singleRowItem.date}</span>
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
                          >
                            <FiBell size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.mobileMiniActionBtn}
                          onClick={() => onEditRecord(singleRowItem.id)}
                          title="Edit"
                        >
                          <FiEdit2 size={12} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.mobileMiniActionBtn} ${styles.mobileDeleteMiniBtn}`}
                          onClick={() => onDeleteRecord(singleRowItem.id)}
                          title="Delete"
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
/* === SECTION 3 END === */