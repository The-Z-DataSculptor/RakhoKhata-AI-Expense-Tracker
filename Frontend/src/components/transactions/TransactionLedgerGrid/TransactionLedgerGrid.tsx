// K:\Developer\Expense-Tracker\Frontend\src\components\transactions\TransactionLedgerGrid\TransactionLedgerGrid.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiArrowUpRight, FiArrowDownLeft, FiTrash2, FiEdit2, FiBell } from "react-icons/fi";
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
          {/* DESKTOP TABLE */}
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

          {/* MOBILE CARDS */}
          <div className={styles.mobileCardsStackViewportFrame}>
            {validatedRecords.map((singleRowItem) => {
              const isIncomeType = singleRowItem.type === "income";
              const isRowChecked = selectedIds.includes(singleRowItem.id);
              const isDebt = checkIsDebtCategory(singleRowItem.category);

              return (
                <div 
                  key={singleRowItem.id} 
                  className={`${styles.mobileDataCardDeckNode} ${isIncomeType ? styles.mobileIncomeBorderAccent : styles.mobileExpenseBorderAccent} ${isRowChecked ? styles.selectedRowHighlightNode : ""}`}
                >
                  <div className={styles.mobileCardTopRowHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="checkbox"
                        className={styles.rowSelectionCheckboxInput}
                        checked={isRowChecked}
                        onChange={() => onToggleSelectRow(singleRowItem.id)}
                      />
                      <span className={styles.mobileCardCalendarDateText}>{singleRowItem.date}</span>
                    </div>
                    <span className={styles.categoryLabelBadgeToken}>{singleRowItem.category}</span>
                  </div>

                  <p className={styles.mobileCardDescriptiveTitleText}>{singleRowItem.description}</p>

                  <div className={styles.mobileCardBottomActionBarLayout}>
                    <div className={`${styles.inlineAmountFlexCluster} ${isIncomeType ? styles.incomeColorAccentNode : styles.expenseColorAccentNode}`}>
                      {isIncomeType ? <FiArrowDownLeft size={14} /> : <FiArrowUpRight size={14} />}
                      <span className={styles.mobileCardBoldAmountText}>
                        {formatOriginalCurrency(singleRowItem.originalAmount, singleRowItem.originalCurrency)}
                      </span>
                    </div>

                    <div className={styles.actionUtilitesButtonDock}>
                      {isDebt && onSendReminder ? (
                        <button
                          type="button"
                          className={styles.rowUtilityIconButtonNode}
                          style={{ color: "var(--color-primary, #6366f1)" }}
                          onClick={() => onSendReminder(singleRowItem)}
                        >
                          <FiBell size={14} />
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
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.rowUtilityIconButtonNode}
                        onClick={() => onDeleteRecord(singleRowItem.id)}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}