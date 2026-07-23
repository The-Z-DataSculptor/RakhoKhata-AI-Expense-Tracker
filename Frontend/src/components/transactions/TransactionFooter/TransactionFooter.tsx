// src/components/transactions/TransactionFooter/TransactionFooter.tsx
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
} from "react-icons/fi";
import { toast } from "sonner";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./TransactionFooter.module.css";

/*
 * WHY a fallback is necessary:
 * NEXT_PUBLIC_API_URL is only set when you have a .env.local file.
 * Without it the variable is undefined, causing `API_BASE_URL` to be "".
 * The fallback ensures export requests always go to the backend (port 5000),
 * never to the Next.js dev server.
 */
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
}: TransactionFooterProps) {
  const [downloadType, setDownloadType] = useState<DownloadType>("idle");
  const { formatAmount } = useCurrency();

  // Scope tracking states
  const [pdfScope, setPdfScope] = useState<ExportScope>("all");
  const [excelScope, setExcelScope] = useState<ExportScope>("all");

  // Floating dropdown states
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

  // Close dropdowns when clicking outside
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

  /**
   * Triggers a PDF export for the given time scope.
   * Uses `window.location.href` to force a file download from the backend.
   */
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

  /**
   * Triggers an Excel export for the given time scope.
   */
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

      {/* Export action buttons */}
      <div className={styles.actionButtonBlock}>
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
                : `Export as PDF (${scopeLabels[pdfScope]})`}
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
                : `Export to Excel (${scopeLabels[excelScope]})`}
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
/* === SECTION 4 END === */