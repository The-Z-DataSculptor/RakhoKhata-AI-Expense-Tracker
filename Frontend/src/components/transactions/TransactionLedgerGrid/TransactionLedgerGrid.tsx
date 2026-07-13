// src/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiArrowUpRight, FiArrowDownLeft, FiTrash2, FiEdit2 } from "react-icons/fi";
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
  // 👇 ENTERPRISE FIELDS: store original values for display
  originalAmount: number;
  originalCurrency: string;
  // The 'amount' field is now used only for internal aggregation (base USD)
  // We keep it for backward compatibility but will not display it.
  amount?: number;
  type: "income" | "expense";
}

interface TransactionLedgerGridProps {
  records: TransactionRecord[];
  onEditRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAllOnPage: (pageRecordIds: string[]) => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function TransactionLedgerGrid({
  records,
  onEditRecord,
  onDeleteRecord,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAllOnPage,
}: TransactionLedgerGridProps) {
  
  const validatedRecords = records || [];

  const isAllOnPageSelected = 
    validatedRecords.length > 0 && 
    validatedRecords.every((row) => selectedIds.includes(row.id));

  const currentPageIds = validatedRecords.map((row) => row.id);

  // Helper to format currency with original amount and symbol
  const formatOriginalCurrency = (amount: number, currency: string) => {
    // Simple formatting – you can enhance with locale support if needed
    return `${amount.toFixed(2)} ${currency}`;
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
                      aria-label="Select all entries visible on this page"
                    />
                  </th>
                  <th style={{ width: "120px" }}>Date</th>
                  <th>Description</th>
                  <th style={{ width: "160px" }}>Category</th>
                  <th style={{ width: "180px", textAlign: "right" }}>Amount (Original)</th>
                  <th style={{ width: "110px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {validatedRecords.map((singleRowItem) => {
                  const isIncomeType = singleRowItem.type === "income";
                  const isRowChecked = selectedIds.includes(singleRowItem.id);
                  
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
                          aria-label={`Select item row ${singleRowItem.description}`}
                        />
                      </td>

                      <td className={styles.calendarDateCellText}>
                        {singleRowItem.date}
                      </td>
                      
                      <td className={styles.descriptiveDetailsCellText}>
                        {singleRowItem.description}
                      </td>
                      
                      <td>
                        <span className={styles.categoryLabelBadgeToken}>
                          {singleRowItem.category}
                        </span>
                      </td>
                      
                      <td className={styles.numericAmountCellTextPositioner}>
                        <div className={`${styles.inlineAmountFlexCluster} ${isIncomeType ? styles.incomeColorAccentNode : styles.expenseColorAccentNode}`}>
                          {isIncomeType ? (
                            <FiArrowDownLeft size={14} className={styles.directionMarkerVector} />
                          ) : (
                            <FiArrowUpRight size={14} className={styles.directionMarkerVector} />
                          )}
                          {/* 👇 DISPLAY ORIGINAL AMOUNT + CURRENCY */}
                          <span>{formatOriginalCurrency(singleRowItem.originalAmount, singleRowItem.originalCurrency)}</span>
                        </div>
                      </td>
                      
                      <td>
                        <div className={styles.actionUtilitesButtonDock}>
                          <button
                            type="button"
                            className={styles.rowUtilityIconButtonNode}
                            onClick={() => onEditRecord(singleRowItem.id)}
                            title="Modify tracking parameters"
                            aria-label={`Edit entry ${singleRowItem.description}`}
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.rowUtilityIconButtonNode} ${styles.dangerHoverPillNode}`}
                            onClick={() => onDeleteRecord(singleRowItem.id)}
                            title="Remove log permanently"
                            aria-label={`Delete entry ${singleRowItem.description}`}
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
                      <span className={styles.mobileCardCalendarDateText}>
                        {singleRowItem.date}
                      </span>
                    </div>
                    <span className={styles.categoryLabelBadgeToken}>
                      {singleRowItem.category}
                    </span>
                  </div>

                  <p className={styles.mobileCardDescriptiveTitleText}>
                    {singleRowItem.description}
                  </p>

                  <div className={styles.mobileCardBottomActionBarLayout}>
                    <div className={`${styles.inlineAmountFlexCluster} ${isIncomeType ? styles.incomeColorAccentNode : styles.expenseColorAccentNode}`}>
                      {isIncomeType ? (
                        <FiArrowDownLeft size={14} />
                      ) : (
                        <FiArrowUpRight size={14} />
                      )}
                      <span className={styles.mobileCardBoldAmountText}>
                        {formatOriginalCurrency(singleRowItem.originalAmount, singleRowItem.originalCurrency)}
                      </span>
                    </div>

                    <div className={styles.actionUtilitesButtonDock}>
                      <button
                        type="button"
                        className={styles.rowUtilityIconButtonNode}
                        onClick={() => onEditRecord(singleRowItem.id)}
                        aria-label="Modify log settings"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.rowUtilityIconButtonNode}
                        onClick={() => onDeleteRecord(singleRowItem.id)}
                        aria-label="Remove ledger item"
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
/* === SECTION 4 END === */