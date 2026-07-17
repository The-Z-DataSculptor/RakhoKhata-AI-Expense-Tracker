// src/components/transactions/TransactionFooter/TransactionFooter.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useRef, useEffect } from "react";
import { 
  FiArrowUpRight, 
  FiArrowDownLeft, 
  FiFileText, 
  FiGrid, 
  FiChevronDown 
} from "react-icons/fi";
import { toast } from "sonner";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./TransactionFooter.module.css";
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

type ExportScope = "today" | "week" | "month" | "3months" | "6months" | "year" | "all";
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function TransactionFooter({ 
  totalIncome, 
  totalExpenses, 
  sourceCurrency,
  activeWorkspaceId 
}: TransactionFooterProps) {
  const [downloadType, setDownloadType] = useState<DownloadType>("idle");
  const { formatAmount } = useCurrency();

  // Scope tracking states
  const [pdfScope, setPdfScope] = useState<ExportScope>("all");
  const [excelScope, setExcelScope] = useState<ExportScope>("all");

  // Floating dropdown open/close states
  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);
  const [isExcelMenuOpen, setIsExcelMenuOpen] = useState(false);

  // References for outside-click tracking handlers
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

  // Close floating menus cleanly if user clicks elsewhere on the page
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

  // 🚀 FIXED: Pointing directly to the logically correct /api/transactions highway prefix
  const handleExecutePDFExport = async (scope: ExportScope) => {
    if (!activeWorkspaceId) {
      toast.error("Please select an active workspace before exporting.");
      return;
    }
    
    setIsPdfMenuOpen(false);
    setDownloadType("pdf");
    
    try {
      window.location.href = `http://localhost:5000/api/transactions/export/pdf?workspaceId=${activeWorkspaceId}&scope=${scope}`;
      toast.success(`Compiling your [${scopeLabels[scope]}] PDF document...`);
    } catch (error) {
      console.error("PDF Download pipeline initialization error:", error);
      toast.error("Could not generate PDF statement. Check server link connection.");
    } finally {
      setTimeout(() => setDownloadType("idle"), 1200);
    }
  };

  const handleExecuteExcelExport = async (scope: ExportScope) => {
    if (!activeWorkspaceId) {
      toast.error("Please select an active workspace before exporting.");
      return;
    }

    setIsExcelMenuOpen(false);
    setDownloadType("excel");
    
    try {
      window.location.href = `http://localhost:5000/api/transactions/export/excel?workspaceId=${activeWorkspaceId}&scope=${scope}`;
      toast.success(`Compiling your [${scopeLabels[scope]}] Excel spreadsheet...`);
    } catch (error) {
      console.error("Excel Download pipeline initialization error:", error);
      toast.error("Could not generate Excel sheet. Check server link connection.");
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
      <div className={styles.metaStatNode}>
        <div className={`${styles.iconBadgeTrack} ${styles.incomeIcon}`}>
          <FiArrowUpRight size={18} />
        </div>
        <div>
          <p className={styles.statLabel}>Total Income</p>
          <p className={`${styles.statValue} ${styles.incomeColor}`}>
            +{formatAmount(totalIncome, sourceCurrency)}
          </p>
        </div>
      </div>

      <div className={styles.metaStatNode}>
        <div className={`${styles.iconBadgeTrack} ${styles.expenseIcon}`}>
          <FiArrowDownLeft size={18} />
        </div>
        <div>
          <p className={styles.statLabel}>Total Expenses</p>
          <p className={`${styles.statValue} ${styles.expenseColor}`}>
            -{formatAmount(totalExpenses, sourceCurrency)}
          </p>
        </div>
      </div>

      <div className={styles.actionButtonBlock}>
        
        {/* ==========================================
           === PDF SPLIT DOWNLOAD CONSOLE COMPONENT ===
           ========================================== */}
        <div className={styles.splitButtonWrapper} ref={pdfRef}>
          <button
            className={styles.mainActionBtn}
            onClick={() => handleExecutePDFExport(pdfScope)}
            disabled={isDownloading}
          >
            <FiFileText size={16} />
            <span>
              {downloadType === "pdf" ? "Exporting PDF..." : `Export as PDF (${scopeLabels[pdfScope]})`}
            </span>
          </button>
          <button
            className={styles.dropdownArrowTrigger}
            onClick={() => setIsPdfMenuOpen((prev) => !prev)}
            disabled={isDownloading}
            aria-label="Open timeline scope selection menu for PDF"
          >
            <FiChevronDown size={14} className={isPdfMenuOpen ? styles.rotateArrowUp : ""} />
          </button>

          {isPdfMenuOpen && (
            <ul className={styles.floatingRangeMenu}>
              {(Object.keys(scopeLabels) as ExportScope[]).map((scope) => (
                <li key={scope}>
                  <button
                    type="button"
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

        {/* ==========================================
           === EXCEL SPLIT DOWNLOAD CONSOLE COMPONENT ===
           ========================================== */}
        <div className={`${styles.splitButtonWrapper} ${styles.excelThemeOverride}`} ref={excelRef}>
          <button
            className={styles.mainActionBtn}
            onClick={() => handleExecuteExcelExport(excelScope)}
            disabled={isDownloading}
          >
            <FiGrid size={16} />
            <span>
              {downloadType === "excel" ? "Exporting..." : `Export to Excel (${scopeLabels[excelScope]})`}
            </span>
          </button>
          <button
            className={styles.dropdownArrowTrigger}
            onClick={() => setIsExcelMenuOpen((prev) => !prev)}
            disabled={isDownloading}
            aria-label="Open timeline scope selection menu for Excel"
          >
            <FiChevronDown size={14} className={isExcelMenuOpen ? styles.rotateArrowUp : ""} />
          </button>

          {isExcelMenuOpen && (
            <ul className={styles.floatingRangeMenu}>
              {(Object.keys(scopeLabels) as ExportScope[]).map((scope) => (
                <li key={scope}>
                  <button
                    type="button"
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