
// Frontend/src/components/transactions/TransactionFooter/TransactionFooter.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & ENVIRONMENT CONFIG ===
   ========================================================================== */
import React, { useState, useRef, useEffect } from "react";
import {
  FiArrowUpRight,
  FiArrowDownLeft,
  FiFileText,
  FiGrid,
  FiChevronDown,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "sonner";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./TransactionFooter.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface TransactionFooterProps {
  totalIncome: number;
  totalExpenses: number;
  sourceCurrency: string;
  activeWorkspaceId: string | null;
  onOpenTrashCan?: () => void;
}

type DownloadType = "idle" | "pdf" | "excel";
type ExportScope =
  | "today"
  | "week"
  | "month"
  | "3months"
  | "6months"
  | "year"
  | "all";
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & EXPORT HANDLERS ===
   ========================================================================== */
export default function TransactionFooter({
  totalIncome,
  totalExpenses,
  sourceCurrency,
  activeWorkspaceId,
  onOpenTrashCan,
}: TransactionFooterProps) {
  const [downloadType, setDownloadType] = useState<DownloadType>("idle");
  const { formatAmount } = useCurrency();

  const [pdfScope, setPdfScope] = useState<ExportScope>("all");
  const [excelScope, setExcelScope] = useState<ExportScope>("all");

  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);
  const [isExcelMenuOpen, setIsExcelMenuOpen] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);
  const excelRef = useRef<HTMLDivElement>(null);

  const isDownloading = downloadType !== "idle";

  const scopeLabels: Record<ExportScope, string> = {
    today: "Today Only",
    week: "This Week",
    month: "This Month",
    "3months": "Last 3 Months",
    "6months": "Last 6 Months",
    year: "This Year",
    all: "All Transactions",
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (pdfRef.current && !pdfRef.current.contains(event.target as Node)) {
        setIsPdfMenuOpen(false);
      }
      if (excelRef.current && !excelRef.current.contains(event.target as Node)) {
        setIsExcelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleExecutePDFExport = (scope: ExportScope) => {
    if (!activeWorkspaceId) {
      toast.error("Please select an active workspace before exporting.");
      return;
    }

    setIsPdfMenuOpen(false);
    setDownloadType("pdf");

    try {
      const workspaceIdEncoded = encodeURIComponent(activeWorkspaceId);
      const scopeEncoded = encodeURIComponent(scope);
      const downloadUrl = `${API_BASE_URL}/api/transactions/export/pdf?workspaceId=${workspaceIdEncoded}&scope=${scopeEncoded}`;

      window.location.href = downloadUrl;
      toast.success(`Compiling your [${scopeLabels[scope]}] PDF document...`);
    } catch (error) {
      console.error("PDF Export error:", error);
      toast.error("Could not generate PDF statement.");
    } finally {
      setTimeout(() => setDownloadType("idle"), 1200);
    }
  };

  const handleExecuteExcelExport = (scope: ExportScope) => {
    if (!activeWorkspaceId) {
      toast.error("Please select an active workspace before exporting.");
      return;
    }

    setIsExcelMenuOpen(false);
    setDownloadType("excel");

    try {
      const workspaceIdEncoded = encodeURIComponent(activeWorkspaceId);
      const scopeEncoded = encodeURIComponent(scope);
      const downloadUrl = `${API_BASE_URL}/api/transactions/export/excel?workspaceId=${workspaceIdEncoded}&scope=${scopeEncoded}`;

      window.location.href = downloadUrl;
      toast.success(`Compiling your [${scopeLabels[scope]}] Excel spreadsheet...`);
    } catch (error) {
      console.error("Excel Export error:", error);
      toast.error("Could not generate Excel sheet.");
    } finally {
      setTimeout(() => setDownloadType("idle"), 1200);
    }
  };
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.footerDeckContainer}>
      {/* Total Income */}
      <div className={styles.metaStatNode}>
        <div className={`${styles.iconBadgeTrack} ${styles.incomeIcon}`}>
          <FiArrowUpRight size={18} />
        </div>
        <div>
          <p className={styles.statLabel}>Total Income</p>
          <p className={`${styles.statValue} ${styles.incomeColor}`}>
            +{formatAmount(Number(totalIncome) || 0, sourceCurrency)}
          </p>
        </div>
      </div>

      {/* Total Expenses */}
      <div className={styles.metaStatNode}>
        <div className={`${styles.iconBadgeTrack} ${styles.expenseIcon}`}>
          <FiArrowDownLeft size={18} />
        </div>
        <div>
          <p className={styles.statLabel}>Total Expenses</p>
          <p className={`${styles.statValue} ${styles.expenseColor}`}>
            -{formatAmount(Number(totalExpenses) || 0, sourceCurrency)}
          </p>
        </div>
      </div>

      {/* Action Buttons with Recycle Bin Trigger */}
      <div className={styles.actionButtonBlock}>
        {/* Recycle Bin Button */}
        {onOpenTrashCan && (
          <button
            type="button"
            className={styles.trashCanTriggerBtn}
            onClick={onOpenTrashCan}
            title="Open Recycle Bin (Items auto-deleted after 15 days)"
          >
            <FiTrash2 size={16} />
            <span>Recycle Bin</span>
          </button>
        )}

        {/* PDF Split Button */}
        <div className={styles.splitButtonWrapper} ref={pdfRef}>
          <button
            type="button"
            className={styles.mainActionBtn}
            onClick={() => handleExecutePDFExport(pdfScope)}
            disabled={isDownloading}
          >
            <FiFileText size={16} />
            <span>
              {downloadType === "pdf"
                ? "Exporting PDF..."
                : `PDF (${scopeLabels[pdfScope]})`}
            </span>
          </button>
          <button
            type="button"
            className={styles.dropdownArrowTrigger}
            onClick={() => setIsPdfMenuOpen((prev) => !prev)}
            disabled={isDownloading}
            aria-label="Open timeline scope selection menu for PDF"
            aria-expanded={isPdfMenuOpen}
          >
            <FiChevronDown
              size={14}
              className={isPdfMenuOpen ? styles.rotateArrowUp : ""}
            />
          </button>

          {isPdfMenuOpen && (
            <ul className={styles.floatingRangeMenu} role="menu">
              {(Object.keys(scopeLabels) as ExportScope[]).map((scope) => (
                <li key={scope} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className={pdfScope === scope ? styles.activeScopeItem : ""}
                    onClick={() => {
                      setPdfScope(scope);
                      handleExecutePDFExport(scope);
                    }}
                  >
                    {scopeLabels[scope]}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Excel Split Button */}
        <div
          className={`${styles.splitButtonWrapper} ${styles.excelThemeOverride}`}
          ref={excelRef}
        >
          <button
            type="button"
            className={styles.mainActionBtn}
            onClick={() => handleExecuteExcelExport(excelScope)}
            disabled={isDownloading}
          >
            <FiGrid size={16} />
            <span>
              {downloadType === "excel"
                ? "Exporting..."
                : `Excel (${scopeLabels[excelScope]})`}
            </span>
          </button>
          <button
            type="button"
            className={styles.dropdownArrowTrigger}
            onClick={() => setIsExcelMenuOpen((prev) => !prev)}
            disabled={isDownloading}
            aria-label="Open timeline scope selection menu for Excel"
            aria-expanded={isExcelMenuOpen}
          >
            <FiChevronDown
              size={14}
              className={isExcelMenuOpen ? styles.rotateArrowUp : ""}
            />
          </button>

          {isExcelMenuOpen && (
            <ul className={styles.floatingRangeMenu} role="menu">
              {(Object.keys(scopeLabels) as ExportScope[]).map((scope) => (
                <li key={scope} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className={excelScope === scope ? styles.activeScopeItem : ""}
                    onClick={() => {
                      setExcelScope(scope);
                      handleExecuteExcelExport(scope);
                    }}
                  >
                    {scopeLabels[scope]}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}