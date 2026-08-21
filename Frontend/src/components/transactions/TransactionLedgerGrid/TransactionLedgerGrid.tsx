// Frontend/src/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { memo } from "react";
import { 
  FiArrowUpRight, 
  FiArrowDownLeft, 
  FiTrash2, 
  FiEdit2, 
  FiBell, 
  FiCheckSquare,
  FiBookOpen
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
   === SECTION 3: HELPERS ===
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
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: MEMOIZED ROW COMPONENTS (PERFORMANCE SHIELD) ===
   ========================================================================== */

interface DesktopRowProps {
  row: TransactionRecord;
  isChecked: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSendReminder?: (row: TransactionRecord) => void;
}

const DesktopTableRow = memo(function DesktopTableRow({
  row,
  isChecked,
  onToggleSelect,
  onEdit,
  onDelete,
  onSendReminder,
}: DesktopRowProps) {
  const isIncome = row.type === "income";
  const isDebt = checkIsDebtCategory(row.category);

  return (
    <tr className={`${styles.zebraStripeRowNode} ${isChecked ? styles.selectedRowHighlightNode : ""}`}>
      <td style={{ textAlign: "center" }}>
        <input
          type="checkbox"
          className={styles.rowSelectionCheckboxInput}
          checked={isChecked}
          onChange={() => onToggleSelect(row.id)}
          aria-label={`Select transaction ${row.description || ""}`}
        />
      </td>
      <td className={styles.calendarDateCellText}>{row.date || "N/A"}</td>
      <td className={styles.descriptiveDetailsCellText} title={row.description}>
        {row.description || "Untitled Transaction"}
      </td>
      <td>
        <span className={styles.categoryLabelBadgeToken}>
          {row.category || "Unassigned"}
        </span>
      </td>
      <td className={styles.numericAmountCellTextPositioner}>
        <div className={`${styles.inlineAmountFlexCluster} ${isIncome ? styles.incomeColorAccentNode : styles.expenseColorAccentNode}`}>
          {isIncome ? <FiArrowDownLeft size={14} /> : <FiArrowUpRight size={14} />}
          <span>{formatOriginalCurrency(row.originalAmount, row.originalCurrency)}</span>
        </div>
      </td>
      <td>
        <div className={styles.actionUtilitesButtonDock}>
          {isDebt && onSendReminder ? (
            <button
              type="button"
              className={styles.rowUtilityIconButtonNode}
              style={{ color: "var(--color-primary, #6366f1)" }}
              onClick={() => onSendReminder(row)}
              title="Send debt reminder link"
              aria-label={`Send debt reminder for ${row.description}`}
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
            onClick={() => onEdit(row.id)}
            title="Edit record"
            aria-label={`Edit ${row.description}`}
          >
            <FiEdit2 size={13} />
          </button>
          <button
            type="button"
            className={`${styles.rowUtilityIconButtonNode} ${styles.dangerHoverPillNode}`}
            onClick={() => onDelete(row.id)}
            title="Delete record"
            aria-label={`Delete ${row.description}`}
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
});

interface MobileRowProps {
  row: TransactionRecord;
  isChecked: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSendReminder?: (row: TransactionRecord) => void;
}

const MobileRowItem = memo(function MobileRowItem({
  row,
  isChecked,
  onToggleSelect,
  onEdit,
  onDelete,
  onSendReminder,
}: MobileRowProps) {
  const isIncome = row.type === "income";
  const isDebt = checkIsDebtCategory(row.category);

  return (
    <div className={`${styles.mobileCompactRowItem} ${isChecked ? styles.mobileRowChecked : ""}`}>
      <div className={styles.mobileRowLeft}>
        <input
          type="checkbox"
          className={styles.rowSelectionCheckboxInput}
          checked={isChecked}
          onChange={() => onToggleSelect(row.id)}
        />
        <div className={`${styles.mobileIconBadge} ${isIncome ? styles.incomeIconBg : styles.expenseIconBg}`}>
          {isIncome ? <FiArrowDownLeft size={14} /> : <FiArrowUpRight size={14} />}
        </div>
      </div>

      <div className={styles.mobileRowMiddle}>
        <h4 className={styles.mobileRowTitle} title={row.description}>
          {row.description || "Untitled Transaction"}
        </h4>
        <div className={styles.mobileRowMetaLine}>
          <span className={styles.mobileCategoryTag}>{row.category || "Unassigned"}</span>
          <span className={styles.mobileDotDivider}>•</span>
          <span className={styles.mobileRowDate}>{row.date || "N/A"}</span>
        </div>
      </div>

      <div className={styles.mobileRowRight}>
        <span className={`${styles.mobileRowAmount} ${isIncome ? styles.incomeColorAccentNode : styles.expenseColorAccentNode}`}>
          {isIncome ? "+" : "-"}{formatOriginalCurrency(row.originalAmount, row.originalCurrency)}
        </span>

        <div className={styles.mobileRowActions}>
          {isDebt && onSendReminder && (
            <button
              type="button"
              className={styles.mobileMiniActionBtn}
              onClick={() => onSendReminder(row)}
              title="Send reminder"
              aria-label={`Send debt reminder for ${row.description}`}
            >
              <FiBell size={12} />
            </button>
          )}
          <button
            type="button"
            className={styles.mobileMiniActionBtn}
            onClick={() => onEdit(row.id)}
            title="Edit"
            aria-label={`Edit ${row.description}`}
          >
            <FiEdit2 size={12} />
          </button>
          <button
            type="button"
            className={`${styles.mobileMiniActionBtn} ${styles.mobileDeleteMiniBtn}`}
            onClick={() => onDelete(row.id)}
            title="Delete"
            aria-label={`Delete ${row.description}`}
          >
            <FiTrash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
});
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: MASTER GRID COMPONENT ===
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
  const validatedRecords = Array.isArray(records) ? records : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  const isAllOnPageSelected =
    validatedRecords.length > 0 &&
    validatedRecords.every((row) => safeSelectedIds.includes(row.id));

  const currentPageIds = validatedRecords.map((row) => row.id);

  return (
    <div className={styles.ledgerTableViewportWrapper}>
      {validatedRecords.length === 0 ? (
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
                {validatedRecords.map((singleRowItem) => (
                  <DesktopTableRow
                    key={singleRowItem.id}
                    row={singleRowItem}
                    isChecked={safeSelectedIds.includes(singleRowItem.id)}
                    onToggleSelect={onToggleSelectRow}
                    onEdit={onEditRecord}
                    onDelete={onDeleteRecord}
                    onSendReminder={onSendReminder}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* HIGH-DENSITY MOBILE COMPACT LIST */}
          <div className={styles.mobileCardsStackViewportFrame}>
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

            <div className={styles.mobileCompactListWrapper}>
              {validatedRecords.map((singleRowItem) => (
                <MobileRowItem
                  key={singleRowItem.id}
                  row={singleRowItem}
                  isChecked={safeSelectedIds.includes(singleRowItem.id)}
                  onToggleSelect={onToggleSelectRow}
                  onEdit={onEditRecord}
                  onDelete={onDeleteRecord}
                  onSendReminder={onSendReminder}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}