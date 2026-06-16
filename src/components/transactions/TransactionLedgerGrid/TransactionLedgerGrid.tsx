//K:\Developer\expense-tracker\src\components\transactions\TransactionLedgerGrid\TransactionLedgerGrid.tsx //

"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FiArrowUpRight, FiArrowDownLeft, FiTrash2, FiEdit2 } from "react-icons/fi";
// NEW: Import the live currency channel to dynamically format monetary values
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
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
  amount: number;
  type: "income" | "expense";
}

interface TransactionLedgerGridProps {
  // An array of tracking records filtered down by our live state tools
  records: TransactionRecord[];
  // Callback trigger executed when a user hits a line item edit node
  onEditRecord: (id: string) => void;
  // Callback trigger executing a removal operation out of the database array
  onDeleteRecord: (id: string) => void;
  // NEW BULK SELECTION API ATTRIBUTES:
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
  
  // NEW: Instantiating the global formatting layout context pipeline
  const { formatAmount } = useCurrency();

  // Clean guard loop to verify incoming dataset states aren't empty or null
  const validatedRecords = records || [];

  // Determine if every single item currently visible on this specific slice window is checked
  const isAllOnPageSelected = 
    validatedRecords.length > 0 && 
    validatedRecords.every((row) => selectedIds.includes(row.id));

  // Extract all currently visible IDs to pass up into the master selection callback engine
  const currentPageIds = validatedRecords.map((row) => row.id);

  return (
    /* ==========================================================================
       === SECTION 4: RENDER (JSX) ===
       ========================================================================== */
    <div className={styles.ledgerTableViewportWrapper}>
      
      {/* RENDER PHASE A: CONDITIONAL EMPTY STATE VIEW BLOCK */}
      {validatedRecords.length === 0 ? (
        <div className={styles.emptyStateContainerBlock}>
          <p className={styles.emptyStateNoticeText}>
            No active transaction logs match your filter combinations.
          </p>
        </div>
      ) : (
        <>
          {/* RENDER PHASE B: DESKTOP EXPERT HIGH-DENSITY GRID */}
          <div className={styles.desktopTableFrameContainer}>
            <table className={styles.nativeHighDensityTableElement}>
              <thead>
                <tr>
                  {/* MASTER SELECTION ELEMENT HEAD COLUMN COLUMN */}
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
                  <th style={{ width: "150px", textAlign: "right" }}>Amount</th>
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
                      {/* INDIVIDUAL ROW SELECT CHECKBOX ELEMENT */}
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          className={styles.rowSelectionCheckboxInput}
                          checked={isRowChecked}
                          onChange={() => onToggleSelectRow(singleRowItem.id)}
                          aria-label={`Select item row ${singleRowItem.description}`}
                        />
                      </td>

                      {/* DATE AXIS LOG */}
                      <td className={styles.calendarDateCellText}>
                        {singleRowItem.date}
                      </td>
                      
                      {/* TEXT METADATA LOG */}
                      <td className={styles.descriptiveDetailsCellText}>
                        {singleRowItem.description}
                      </td>
                      
                      {/* CATEGORY TOKEN TAG CHIP */}
                      <td>
                        <span className={styles.categoryLabelBadgeToken}>
                          {singleRowItem.category}
                        </span>
                      </td>
                      
                      {/* COLOR-CODED MONETARY VALUE */}
                      <td className={styles.numericAmountCellTextPositioner}>
                        <div className={`${styles.inlineAmountFlexCluster} ${isIncomeType ? styles.incomeColorAccentNode : styles.expenseColorAccentNode}`}>
                          {isIncomeType ? (
                            <FiArrowDownLeft size={14} className={styles.directionMarkerVector} />
                          ) : (
                            <FiArrowUpRight size={14} className={styles.directionMarkerVector} />
                          )}
                          {/* FIXED/WHY: Dynamic layout engine format updates value based on active navbar choices */}
                          <span>{formatAmount(singleRowItem.amount, "PKR")}</span>
                        </div>
                      </td>
                      
                      {/* CONTEXT INTERACTION UTILITIES */}
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

          {/* RENDER PHASE C: MOBILE ADAPTIVE PILL STACK LIST CONTAINER */}
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
                    {/* MOBILE CHECKBOX ATTACHMENT HUB */}
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
                    {/* ACCENT VALUE DISPLAY */}
                    <div className={`${styles.inlineAmountFlexCluster} ${isIncomeType ? styles.incomeColorAccentNode : styles.expenseColorAccentNode}`}>
                      {isIncomeType ? (
                        <FiArrowDownLeft size={14} />
                      ) : (
                        <FiArrowUpRight size={14} />
                      )}
                      <span className={styles.mobileCardBoldAmountText}>
                        {/* FIXED/WHY: Dynamic template mapping across fluid mobile display elements */}
                        {formatAmount(singleRowItem.amount, "PKR")}
                      </span>
                    </div>

                    {/* INTERACTION DOCK */}
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
    /* === SECTION 4 END === */
  );
}