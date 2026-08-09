// src/app/(dashboard)/dashboard/transactions/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { transactionService, categoryService, apiFetch, Transaction, Category } from "@/utils/api";
import { toast } from "sonner";

// Spreadsheet Ingestion Engine Libraries
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { FiUploadCloud, FiChevronRight, FiFileText, FiAlertCircle, FiLoader } from "react-icons/fi";

import TransactionHeader from "@/components/transactions/TransactionHeader/TransactionHeader";
import TransactionFilterBar, { TransactionTypeFilter } from "@/components/transactions/TransactionFilterBar/TransactionFilterBar";
import TransactionLedgerGrid, { TransactionRecord } from "@/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid";
import TransactionPagination from "@/components/transactions/TransactionPagination/TransactionPagination";
import BulkActionToolBelt from "@/components/transactions/BulkActionToolBelt/BulkActionToolBelt";
import TransactionFooter from "@/components/transactions/TransactionFooter/TransactionFooter";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { TransactionForm } from "@/components/forms/TransactionForm/TransactionForm";
import { DebtReminderForm } from "@/components/forms/DebtReminderForm/DebtReminderForm";
import styles from "./page.module.css";

// ----- Internal types -----
interface FormPayload {
  originalAmount: number;
  originalCurrency: string;
  baseAmountUSD: number;
  type: string;
  description: string;
  date: string;
  workspaceId: string;
  categoryId: string;
  id?: string;
}

interface ImportRowPreview {
  index: number;
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
}

type ParsedRowData = Record<string, string>;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: UTILITIES & HELPERS ===
   ========================================================================== */

/**
 * Safely parses a raw value into an ISO date string (YYYY‑MM‑DD).
 */
const safeParseSpreadsheetDate = (rawVal: unknown): string => {
  const fallbackToday = new Date().toISOString().substring(0, 10);
  if (!rawVal) return fallbackToday;

  if (rawVal instanceof Date) {
    return !isNaN(rawVal.getTime())
      ? rawVal.toISOString().substring(0, 10)
      : fallbackToday;
  }

  const strVal = String(rawVal).trim();
  const numericSerial = Number(strVal);

  if (!isNaN(numericSerial) && numericSerial > 30000 && numericSerial < 60000) {
    const computedExcelDate = new Date((numericSerial - 25569) * 86400 * 1000);
    if (!isNaN(computedExcelDate.getTime())) {
      return computedExcelDate.toISOString().substring(0, 10);
    }
  }

  let parsed = new Date(strVal);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().substring(0, 10);
  }

  const parts = strVal.split(/[-/.]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (year > 1000 && month >= 0 && month < 12 && day > 0 && day <= 31) {
      parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().substring(0, 10);
      }
    }
  }

  return fallbackToday;
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & HANDLERS ===
   ========================================================================== */
export default function TransactionsPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const workspaceCurrency = activeWorkspace?.currency || "PKR";
  const { convertAmount } = useCurrency();

  // ----- Data state -----
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // ----- Filter state -----
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<TransactionTypeFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  // ----- Modal state -----
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeReminderTx, setActiveReminderTx] = useState<TransactionRecord | null>(null);

  // ----- Import wizard state -----
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [importStep, setImportStep] = useState<number>(1);
  const [rawFileHeaders, setRawFileHeaders] = useState<string[]>([]);
  const [rawParsedRows, setRawParsedRows] = useState<ParsedRowData[]>([]);
  const [isSubmittingImport, setIsSubmittingImport] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ----- Column mapping & preview -----
  const [colMap, setColMap] = useState({
    date: "",
    description: "",
    amount: "",
    currency: "",
    type: "",
  });
  const [fallbackCurrency, setFallbackCurrency] = useState<string>(workspaceCurrency);
  const [fallbackType, setFallbackType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [stagedPreviewRows, setStagedPreviewRows] = useState<ImportRowPreview[]>([]);

  // ---------------------------------------------------------------------------
  // DATA FETCHING (SAFEGUARDED)
  // ---------------------------------------------------------------------------
  const refreshLedgerData = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try {
      const txData = await transactionService.getByWorkspace(activeWorkspaceId);
      const safeTransactions = Array.isArray(txData?.transactions) ? txData.transactions : [];
      setTransactions(safeTransactions);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to refresh transactions.";
      toast.error(message);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    let isMounted = true;
    if (!activeWorkspaceId) return;

    const loadInitialData = async () => {
      try {
        if (isMounted) setIsLoading(true);
        const [txData, catData] = await Promise.all([
          transactionService.getByWorkspace(activeWorkspaceId),
          categoryService.getByWorkspace(activeWorkspaceId),
        ]);
        if (isMounted) {
          const safeTxs = Array.isArray(txData?.transactions) ? txData.transactions : [];
          const safeCats = Array.isArray(catData?.categories) ? catData.categories : [];

          setTransactions(safeTxs);
          setCategories(safeCats);
          setCurrentPage(1);
          setSelectedRecordIds([]);
        }
      } catch (error: unknown) {
        console.error("Ledger Sync Failure:", error);
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Failed to sync transactions.";
          toast.error(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId]);

  // ---------------------------------------------------------------------------
  // RECEIPT SCANNING (AI)
  // ---------------------------------------------------------------------------
  const handleReceiptScanProcessing = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspaceId) return;

    setIsScanning(true);
    const notificationId = toast.loading("AI Engine analyzing receipt...");

    try {
      const formData = new FormData();
      formData.append("receipt", file);
      formData.append("workspaceId", activeWorkspaceId);

      const parsedResult = await apiFetch<{
        merchant?: string;
        date?: string;
        totalAmount?: number;
        currency?: string;
      }>("/transactions/scan", {
        method: "POST",
        body: formData,
      });

      const safeCategories = Array.isArray(categories) ? categories : [];
      const unassignedCategory = safeCategories.find(
        (c) => c.name.toLowerCase() === "unassigned"
      );
      const defaultCategoryId = unassignedCategory?.id || safeCategories[0]?.id || "";

      const scannedTransaction: Partial<Transaction> = {
        description: parsedResult.merchant || "AI Scanned Receipt",
        date: parsedResult.date
          ? new Date(parsedResult.date).toISOString()
          : new Date().toISOString(),
        originalAmount: Number(parsedResult.totalAmount || 0),
        originalCurrency: parsedResult.currency || workspaceCurrency,
        baseAmountUSD: convertAmount(
          Number(parsedResult.totalAmount || 0),
          parsedResult.currency || workspaceCurrency,
          "USD"
        ),
        type: "EXPENSE",
        categoryId: defaultCategoryId,
        category: unassignedCategory || safeCategories[0],
      };

      toast.success("Receipt data extracted!", { id: notificationId });
      setEditingTransaction(scannedTransaction as Transaction);
      setIsModalOpen(true);
    } catch (error: unknown) {
      console.error("OCR AI Pipeline breakdown:", error);
      const message = error instanceof Error ? error.message : "Network processing timeout.";
      toast.error(message, { id: notificationId });
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  // ---------------------------------------------------------------------------
  // SPREADSHEET IMPORT LOGIC
  // ---------------------------------------------------------------------------
  const autoGuessFileHeaders = useCallback((headers: string[]) => {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const mapping = { date: "", description: "", amount: "", currency: "", type: "" };

    for (const header of headers || []) {
      const normal = clean(header);
      if (!mapping.date && (normal.includes("date") || normal.includes("time"))) mapping.date = header;
      if (!mapping.description && (normal.includes("desc") || normal.includes("narrative") || normal.includes("detail")))
        mapping.description = header;
      if (!mapping.amount && (normal.includes("amount") || normal.includes("value") || normal.includes("paid") || normal.includes("price")))
        mapping.amount = header;
      if (!mapping.currency && (normal.includes("curr") || normal.includes("code"))) mapping.currency = header;
      if (!mapping.type && (normal.includes("type") || normal.includes("class"))) mapping.type = header;
    }

    setColMap(mapping);
  }, []);

  const handleFileExtractionStream = useCallback(
    (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10 MB limit.");
        return;
      }

      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".csv")) {
        Papa.parse<ParsedRowData>(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const fields = Array.isArray(results.meta.fields) ? results.meta.fields : [];
            const dataRows = Array.isArray(results.data) ? results.data : [];

            if (fields.length > 0 && dataRows.length > 0) {
              setRawFileHeaders(fields);
              setRawParsedRows(dataRows);
              autoGuessFileHeaders(fields);
              setImportStep(2);
            } else {
              toast.error("CSV file appears to be empty or corrupt.");
            }
          },
        });
      } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const data = evt.target?.result;
          if (!data || typeof data !== "string") {
            toast.error("Failed to read Excel file.");
            return;
          }
          const workbook = XLSX.read(data, { type: "binary", cellDates: true, dateNF: "yyyy-mm-dd" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
          
          if (Array.isArray(rows) && rows.length > 0) {
            const headers = (rows[0] || []).map((h) => String(h));
            const body = XLSX.utils.sheet_to_json<ParsedRowData>(sheet);
            const safeBody = Array.isArray(body) ? body : [];

            setRawFileHeaders(headers);
            setRawParsedRows(safeBody);
            autoGuessFileHeaders(headers);
            setImportStep(2);
          } else {
            toast.error("Excel sheet appears to be empty.");
          }
        };
        reader.readAsBinaryString(file);
      } else {
        toast.error("Unsupported file type. Please upload a .csv or .xlsx file.");
      }
    },
    [autoGuessFileHeaders]
  );

  const handleComputeMappingVerification = () => {
    if (!colMap.date || !colMap.description || !colMap.amount) {
      toast.error("Please map the Date, Description, and Amount columns.");
      return;
    }

    const safeCategories = Array.isArray(categories) ? categories : [];
    const unassignedCategory = safeCategories.find((c) => c.name.toLowerCase() === "unassigned");
    const defaultCategoryId = unassignedCategory?.id || safeCategories[0]?.id || "";

    const safeParsedRows = Array.isArray(rawParsedRows) ? rawParsedRows : [];

    const previewRows: ImportRowPreview[] = safeParsedRows.map((row, idx) => {
      let rawAmount = parseFloat(String(row[colMap.amount] || "0").replace(/[^0-9.-]/g, ""));
      let detectedType: "INCOME" | "EXPENSE" = fallbackType;

      if (colMap.type && row[colMap.type]) {
        const typeStr = String(row[colMap.type]).toUpperCase();
        if (typeStr.includes("INC") || typeStr.includes("CR") || typeStr.includes("DEP"))
          detectedType = "INCOME";
        else if (typeStr.includes("EXP") || typeStr.includes("DR") || typeStr.includes("WD"))
          detectedType = "EXPENSE";
      } else if (rawAmount < 0) {
        detectedType = "EXPENSE";
        rawAmount = Math.abs(rawAmount);
      }

      let rowCurrency = fallbackCurrency;
      if (colMap.currency && row[colMap.currency]) {
        rowCurrency = String(row[colMap.currency]).toUpperCase().trim().substring(0, 3);
      }

      let categoryId = defaultCategoryId;
      const description = String(row[colMap.description] || "").toLowerCase();
      if (description.includes("salary") || description.includes("dividend")) {
        const found = safeCategories.find(
          (c) => c.name.toLowerCase().includes("salary") || c.name.toLowerCase().includes("revenue")
        );
        if (found) categoryId = found.id;
      } else if (description.includes("rent") || description.includes("housing")) {
        const found = safeCategories.find(
          (c) => c.name.toLowerCase().includes("rent") || c.name.toLowerCase().includes("housing")
        );
        if (found) categoryId = found.id;
      }

      return {
        index: idx,
        date: safeParseSpreadsheetDate(row[colMap.date]),
        description: String(row[colMap.description] || "Imported Transaction"),
        amount: isNaN(rawAmount) ? 0 : rawAmount,
        currency: rowCurrency,
        type: detectedType,
        categoryId,
      };
    });

    setStagedPreviewRows(previewRows);
    setImportStep(3);
  };

  const handleCommitBulkDataToBackend = async () => {
    if (!activeWorkspaceId) return;
    setIsSubmittingImport(true);

    try {
      const safeStagedRows = Array.isArray(stagedPreviewRows) ? stagedPreviewRows : [];

      const payload = safeStagedRows.map((row) => ({
        originalAmount: row.amount,
        originalCurrency: row.currency,
        baseAmountUSD: convertAmount(row.amount, row.currency, "USD"),
        type: row.type,
        description: row.description,
        date: new Date(row.date).toISOString(),
        categoryId: row.categoryId,
        workspaceId: activeWorkspaceId,
      }));

      const result = await transactionService.bulkCreate({
        workspaceId: activeWorkspaceId,
        transactions: payload,
      });

      toast.success(result?.message || "Transactions imported successfully!");
      setIsImportOpen(false);
      setImportStep(1);
      await refreshLedgerData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Import failed due to a network error.";
      toast.error(message);
    } finally {
      setIsSubmittingImport(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CRUD OPERATIONS
  // ---------------------------------------------------------------------------
  const handleOpenCreateModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleClosePopupModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleUpsertTransaction = async (payload: FormPayload) => {
    try {
      if (!activeWorkspaceId) {
        toast.error("No active workspace detected.");
        return;
      }

      if (payload.id) {
        await transactionService.delete(payload.id);
      }

      await transactionService.create({
        originalAmount: payload.originalAmount,
        originalCurrency: payload.originalCurrency,
        baseAmountUSD: payload.baseAmountUSD,
        type: payload.type as "INCOME" | "EXPENSE",
        description: payload.description,
        date: payload.date,
        workspaceId: activeWorkspaceId,
        categoryId: payload.categoryId,
        amount: payload.originalAmount,
      });

      await refreshLedgerData();
      handleClosePopupModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save transaction.";
      toast.error(message);
    }
  };

  const handleEditRecordTrigger = (targetId: string) => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const match = safeTransactions.find((t) => t.id === targetId);
    if (match) {
      setEditingTransaction(match);
      setIsModalOpen(true);
    }
  };

  const handleDeleteRecordTrigger = async (targetId: string) => {
    try {
      await transactionService.delete(targetId);
      setTransactions((prev) => (Array.isArray(prev) ? prev : []).filter((item) => item.id !== targetId));
      setSelectedRecordIds((prev) => (Array.isArray(prev) ? prev : []).filter((id) => id !== targetId));
      toast.success("Transaction deleted.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete transaction.";
      toast.error(message);
    }
  };

  const handleBulkDeleteExecution = async () => {
    try {
      const safeSelectedIds = Array.isArray(selectedRecordIds) ? selectedRecordIds : [];
      await Promise.all(safeSelectedIds.map((id) => transactionService.delete(id)));

      toast.success(`Successfully deleted ${safeSelectedIds.length} transactions.`);
      setTransactions((prev) => (Array.isArray(prev) ? prev : []).filter((row) => !safeSelectedIds.includes(row.id)));
      setSelectedRecordIds([]);
      setCurrentPage(1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Bulk delete failed.";
      toast.error(message);
      await refreshLedgerData();
    }
  };

  // ---------------------------------------------------------------------------
  // SELECTION HANDLERS
  // ---------------------------------------------------------------------------
  const handleToggleSingleRowSelection = (targetId: string) => {
    setSelectedRecordIds((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.includes(targetId)
        ? safePrev.filter((id) => id !== targetId)
        : [...safePrev, targetId];
    });
  };

  const handleToggleSelectAllOnPage = (visiblePageIds: string[]) => {
    setSelectedRecordIds((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const safeVisible = Array.isArray(visiblePageIds) ? visiblePageIds : [];
      const allSelected = safeVisible.every((id) => safePrev.includes(id));
      return allSelected
        ? safePrev.filter((id) => !safeVisible.includes(id))
        : Array.from(new Set([...safePrev, ...safeVisible]));
    });
  };

  const handleClearSelectionQueue = () => setSelectedRecordIds([]);

  // ---------------------------------------------------------------------------
  // AGGREGATION FOR DISPLAY (MEMOIZED WITH ARRAY GUARDS)
  // ---------------------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    return safeTransactions.filter((tx) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || (tx.description || "").toLowerCase().includes(query);
      const matchesType = selectedType === "all" || (tx.type || "").toUpperCase() === selectedType.toUpperCase();
      const matchesCategory =
        selectedCategory === "all" || tx.categoryId === selectedCategory;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchQuery, selectedType, selectedCategory]);

  const { calculatedIncomeTotal, calculatedExpenseTotal } = useMemo(() => {
    let totalIncomeUSD = 0;
    let totalExpenseUSD = 0;

    const safeFiltered = Array.isArray(filteredTransactions) ? filteredTransactions : [];
    safeFiltered.forEach((tx) => {
      const value = Number(tx.baseAmountUSD ?? tx.amount ?? 0);
      if ((tx.type || "").toUpperCase() === "INCOME") totalIncomeUSD += value;
      else if ((tx.type || "").toUpperCase() === "EXPENSE") totalExpenseUSD += value;
    });

    return {
      calculatedIncomeTotal: convertAmount(totalIncomeUSD, "USD", workspaceCurrency),
      calculatedExpenseTotal: convertAmount(totalExpenseUSD, "USD", workspaceCurrency),
    };
  }, [filteredTransactions, workspaceCurrency, convertAmount]);

  // Pagination slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const safeFiltered = Array.isArray(filteredTransactions) ? filteredTransactions : [];
  const pagedTransactions = safeFiltered.slice(startIndex, startIndex + itemsPerPage);

  const gridRows: TransactionRecord[] = useMemo(() => {
    const safePaged = Array.isArray(pagedTransactions) ? pagedTransactions : [];
    return safePaged.map((tx) => ({
      id: tx.id,
      date: tx.date ? String(tx.date).substring(0, 10) : "",
      description: tx.description || "",
      category: tx.category?.name || "General",
      originalAmount: Number(tx.originalAmount ?? tx.amount ?? 0),
      originalCurrency: tx.originalCurrency ?? "USD",
      amount: Number(tx.amount || 0),
      type: (tx.type || "expense").toLowerCase() as "income" | "expense",
    }));
  }, [pagedTransactions]);

  const categoryOptionsForFilter = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    return safeCategories.map((c) => ({ id: c.id, name: c.name }));
  }, [categories]);

  return (
    <div className={styles.ledgerCanvasWrapper}>
      {/* Header */}
      <TransactionHeader
        totalCount={filteredTransactions.length}
        onAddTransactionClick={handleOpenCreateModal}
        onImportClick={() => {
          setImportStep(1);
          setIsImportOpen(true);
        }}
        onFileScannerSelect={() => fileInputRef.current?.click()}
        onCameraScannerSelect={() => cameraInputRef.current?.click()}
      />

      {/* Filter Bar */}
      <TransactionFilterBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        selectedType={selectedType}
        onTypeChange={(val) => {
          setSelectedType(val);
          setCurrentPage(1);
        }}
        categories={categoryOptionsForFilter}
        selectedCategory={selectedCategory}
        onCategoryChange={(catId) => {
          setSelectedCategory(catId);
          setCurrentPage(1);
        }}
      />

      {/* Main Grid */}
      <main className={styles.mainContentStage}>
        {isLoading ? (
          <div className={styles.inlineLoadingContainer}>
            <FiLoader className={styles.inlineSpinner} />
            <p>Syncing ledger records...</p>
          </div>
        ) : (
          <TransactionLedgerGrid
            records={gridRows}
            onEditRecord={handleEditRecordTrigger}
            onDeleteRecord={handleDeleteRecordTrigger}
            onSendReminder={(row) => setActiveReminderTx(row)}
            selectedIds={selectedRecordIds}
            onToggleSelectRow={handleToggleSingleRowSelection}
            onToggleSelectAllOnPage={handleToggleSelectAllOnPage}
          />
        )}
      </main>

      {/* Pagination */}
      <div className={styles.paginationControlRowDeck}>
        <div className={styles.capacitySelectorFlexCluster}>
          <span className={styles.capacityLabelText}>Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className={styles.nativeCapacitySelectDropdown}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <TransactionPagination
          totalItems={filteredTransactions.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Footer Totals */}
      <TransactionFooter
        totalIncome={calculatedIncomeTotal}
        totalExpenses={calculatedExpenseTotal}
        sourceCurrency={workspaceCurrency}
        activeWorkspaceId={activeWorkspaceId}
      />

      {/* Hidden File Inputs for Receipt Scanning */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*,application/pdf"
        onChange={handleReceiptScanProcessing}
      />
      <input
        type="file"
        ref={cameraInputRef}
        style={{ display: "none" }}
        accept="image/*"
        capture="environment"
        onChange={handleReceiptScanProcessing}
      />

      {/* AI Scanning Overlay */}
      {isScanning && (
        <div className={styles.scanningOverlayBackdrop}>
          <div className={styles.scanningCoreCard}>
            <FiLoader className={styles.scanningSpinnerVector} />
            <h4>Reading Receipt Matrix</h4>
            <p>Gemini LLM is mapping variables and structuring ledger lines...</p>
          </div>
        </div>
      )}

      {/* Import Wizard Modal */}
      {isImportOpen && (
        <div
          className={styles.modalOverlayBackdrop}
          onClick={() => {
            if (!isSubmittingImport) setIsImportOpen(false);
          }}
        >
          <div
            className={`${styles.modalContentCard} ${styles.wizardExpansionLarge}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.wizardHeaderDeck}>
              <div className={styles.wizardHeaderTitleBlock}>
                <h3 className={styles.wizardMainTitle}>Statement Import Wizard</h3>
                <span className={styles.wizardBadgePill}>Engine v2.4</span>
              </div>
              <div className={styles.stepperPipelineLayout}>
                <div className={importStep === 1 ? styles.stepperNodeActive : styles.stepperNodeMuted}>
                  <span className={styles.stepperStepNumber}>1</span>
                  <span>Upload</span>
                </div>
                <FiChevronRight className={styles.stepperArrowIcon} />
                <div className={importStep === 2 ? styles.stepperNodeActive : styles.stepperNodeMuted}>
                  <span className={styles.stepperStepNumber}>2</span>
                  <span>Map Headers</span>
                </div>
                <FiChevronRight className={styles.stepperArrowIcon} />
                <div className={importStep === 3 ? styles.stepperNodeActive : styles.stepperNodeMuted}>
                  <span className={styles.stepperStepNumber}>3</span>
                  <span>Review & Commit</span>
                </div>
              </div>
            </div>

            {/* Step 1: Upload */}
            {importStep === 1 && (
              <div
                className={`${styles.dropzoneFrameZone} ${isDraggingOver ? styles.dropzoneActiveTint : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileExtractionStream(file);
                }}
              >
                <div className={styles.dropzoneIconWrapper}>
                  <FiUploadCloud className={styles.dropzoneUploadIcon} />
                </div>
                <p className={styles.dropzoneMainTitleText}>Drag & drop bank statement here</p>
                <p className={styles.dropzoneSubtextMeta}>Supports .csv, .xlsx, .xls (max 10 MB)</p>
                <span className={styles.dropzoneBrowseBtn}>Browse Computer</span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className={styles.nativeFullHiddenFileInputControl}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileExtractionStream(file);
                  }}
                />
              </div>
            )}

            {/* Step 2: Map Columns */}
            {importStep === 2 && (
              <div className={styles.wizardFormCoreBody}>
                <div className={`${styles.wizardInfoAlertBox} ${styles.alertInfoBlue}`}>
                  <FiFileText size={18} className={styles.alertIconFlex} />
                  <div>
                    <strong>Header Alignment Required:</strong> Map the columns from your file to ledger fields.
                  </div>
                </div>

                <div className={styles.mappingSelectorsGridRow}>
                  <div className={styles.formGroupWrapperField}>
                    <label htmlFor="mapDateCol">Transaction Date *</label>
                    <select
                      id="mapDateCol"
                      value={colMap.date}
                      onChange={(e) => setColMap((p) => ({ ...p, date: e.target.value }))}
                      className={styles.premiumFieldSelectControl}
                    >
                      <option value="">-- Select Column --</option>
                      {(Array.isArray(rawFileHeaders) ? rawFileHeaders : []).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroupWrapperField}>
                    <label htmlFor="mapDescCol">Description / Narrative *</label>
                    <select
                      id="mapDescCol"
                      value={colMap.description}
                      onChange={(e) => setColMap((p) => ({ ...p, description: e.target.value }))}
                      className={styles.premiumFieldSelectControl}
                    >
                      <option value="">-- Select Column --</option>
                      {(Array.isArray(rawFileHeaders) ? rawFileHeaders : []).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroupWrapperField}>
                    <label htmlFor="mapAmountCol">Transaction Amount *</label>
                    <select
                      id="mapAmountCol"
                      value={colMap.amount}
                      onChange={(e) => setColMap((p) => ({ ...p, amount: e.target.value }))}
                      className={styles.premiumFieldSelectControl}
                    >
                      <option value="">-- Select Column --</option>
                      {(Array.isArray(rawFileHeaders) ? rawFileHeaders : []).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroupWrapperField}>
                    <label htmlFor="mapCurrCol">Currency Code (Optional)</label>
                    <select
                      id="mapCurrCol"
                      value={colMap.currency}
                      onChange={(e) => setColMap((p) => ({ ...p, currency: e.target.value }))}
                      className={styles.premiumFieldSelectControl}
                    >
                      <option value="">-- Fallback Only ({fallbackCurrency}) --</option>
                      {(Array.isArray(rawFileHeaders) ? rawFileHeaders : []).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.stagerFallbackSubFormBlock}>
                  <div className={styles.formGroupWrapperField}>
                    <label htmlFor="fallbackCurrInput">Fallback Currency</label>
                    <input
                      id="fallbackCurrInput"
                      type="text"
                      maxLength={3}
                      value={fallbackCurrency}
                      onChange={(e) => setFallbackCurrency(e.target.value.toUpperCase())}
                      className={styles.premiumFieldInputTextControl}
                      placeholder="PKR"
                    />
                  </div>
                  <div className={styles.formGroupWrapperField}>
                    <label htmlFor="fallbackTypeSelect">Default Cash Flow Type</label>
                    <select
                      id="fallbackTypeSelect"
                      value={fallbackType}
                      onChange={(e) => setFallbackType(e.target.value as "INCOME" | "EXPENSE")}
                      className={styles.premiumFieldSelectControl}
                    >
                      <option value="EXPENSE">Expense (Debit / Outflow)</option>
                      <option value="INCOME">Income (Credit / Inflow)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.wizardActionFooterToolbar}>
                  <button type="button" onClick={() => setImportStep(1)} className={styles.wizardCancelControlBtn}>
                    Back
                  </button>
                  <button type="button" onClick={handleComputeMappingVerification} className={styles.wizardPrimaryConfirmBtn}>
                    Generate Preview
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Commit */}
            {importStep === 3 && (
              <div className={styles.wizardFormCoreBody}>
                <div className={`${styles.wizardInfoAlertBox} ${styles.alertWarningAmber}`}>
                  <FiAlertCircle size={18} className={styles.alertIconFlex} />
                  <div>
                    <strong>Staging Area:</strong> Unmapped records will be placed in <b>Unassigned</b>.
                  </div>
                </div>

                <div className={styles.previewDataGridContainerWindow}>
                  <table className={styles.previewTableViewportLayout}>
                    <thead className={styles.previewTableHeaderStickyDeck}>
                      <tr>
                        <th>Posting Date</th>
                        <th>Description</th>
                        <th>Value Amount</th>
                        <th>Flow Type</th>
                        <th>Category Allocation</th>
                      </tr>
                    </thead>
                    <tbody className={styles.previewTableBodyRowCluster}>
                      {(Array.isArray(stagedPreviewRows) ? stagedPreviewRows : []).map((row, rIdx) => (
                        <tr key={row.index}>
                          <td className={styles.tableCellDate}>{row.date}</td>
                          <td className={styles.tableCellTruncateText} title={row.description}>
                            {row.description}
                          </td>
                          <td className={styles.tableCellAmount}>
                            {row.currency} {row.amount.toFixed(2)}
                          </td>
                          <td>
                            <span
                              className={
                                row.type === "INCOME" ? styles.badgeTypeIncomePill : styles.badgeTypeExpensePill
                              }
                            >
                              {row.type}
                            </span>
                          </td>
                          <td>
                            <select
                              value={row.categoryId}
                              onChange={(e) => {
                                const newId = e.target.value;
                                setStagedPreviewRows((prev) =>
                                  (Array.isArray(prev) ? prev : []).map((pr, idx) =>
                                    idx === rIdx ? { ...pr, categoryId: newId } : pr
                                  )
                                );
                              }}
                              className={styles.tableCellInlineSelectControl}
                            >
                              {(Array.isArray(categories) ? categories : []).map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.wizardActionFooterToolbar}>
                  <span className={styles.wizardCounterSummaryMetaText}>
                    {stagedPreviewRows.length} transactions ready to sync.
                  </span>
                  <div className={styles.flexButtonGroupRow}>
                    <button
                      type="button"
                      disabled={isSubmittingImport}
                      onClick={() => setImportStep(2)}
                      className={styles.wizardCancelControlBtn}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingImport}
                      onClick={handleCommitBulkDataToBackend}
                      className={styles.wizardCommitExecutionBtn}
                    >
                      {isSubmittingImport ? "Syncing..." : "Commit Statement Import"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debt Reminder Modal */}
      {activeReminderTx && (
        <div className={styles.modalOverlayBackdrop} onClick={() => setActiveReminderTx(null)}>
          <div className={styles.modalContentCard} onClick={(e) => e.stopPropagation()}>
            <DebtReminderForm
              transaction={activeReminderTx}
              onCancel={() => setActiveReminderTx(null)}
            />
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlayBackdrop} onClick={handleClosePopupModal}>
          <div className={styles.modalContentCard} onClick={(e) => e.stopPropagation()}>
            <TransactionForm
              onAddTransaction={handleUpsertTransaction}
              availableCategories={Array.isArray(categories) ? categories : []}
              initialData={editingTransaction}
              onCancel={handleClosePopupModal}
              workspaceId={activeWorkspaceId || ""}
            />
          </div>
        </div>
      )}

      {/* Bulk Action Toolbelt */}
      <BulkActionToolBelt
        selectedCount={selectedRecordIds.length}
        onClearSelection={handleClearSelectionQueue}
        onBulkDelete={handleBulkDeleteExecution}
      />

      <footer className={styles.systemGlobalFooterWrapper}>
        <DashboardFooter />
      </footer>
    </div>
  );
}
