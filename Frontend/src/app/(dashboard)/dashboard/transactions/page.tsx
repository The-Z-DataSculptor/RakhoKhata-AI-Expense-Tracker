// src/app/(dashboard)/dashboard/transactions/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { transactionService, categoryService, Transaction, Category } from "@/utils/api";
import { toast } from "sonner";

// Spreadsheet Ingestion Engine Libs & Safe Typings
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { FiUploadCloud, FiChevronRight, FiFileText, FiAlertCircle, FiLoader } from "react-icons/fi";

import TransactionHeader from "@/components/transactions/TransactionHeader/TransactionHeader";
import TransactionFilterBar, { TransactionTypeFilter } from "@/components/transactions/TransactionFilterBar/TransactionFilterBar";
import TransactionLedgerGrid, { TransactionRecord } from "@/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid"; // 🚀 FIXED: Absolute Naming Alignment
import TransactionPagination from "@/components/transactions/TransactionPagination/TransactionPagination";
import BulkActionToolBelt from "@/components/transactions/BulkActionToolBelt/BulkActionToolBelt";
import TransactionFooter from "@/components/transactions/TransactionFooter/TransactionFooter";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { TransactionForm } from "@/components/forms/TransactionForm/TransactionForm";
import { DebtReminderForm } from "@/components/forms/DebtReminderForm/DebtReminderForm"; 
import styles from "./page.module.css";

type FormPayload = {
  originalAmount: number;
  originalCurrency: string;
  baseAmountUSD: number;
  type: string;
  description: string;
  date: string;
  workspaceId: string;
  categoryId: string;
  id?: string;
};

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

/* ==========================================================================
   === SECTION 2: COMPONENT CORE ENGINE ===
   ========================================================================== */
export default function TransactionsPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const workspaceCurrency = activeWorkspace?.currency || "PKR";
  const { convertAmount } = useCurrency();

  /* --- STATE --- */
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false); 

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<TransactionTypeFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeReminderTx, setActiveReminderTx] = useState<TransactionRecord | null>(null);

  /* ENGINE STATES: AUTOMATED INGESTION WIZARD SYSTEM */
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [importStep, setImportStep] = useState<number>(1);
  const [rawFileHeaders, setRawFileHeaders] = useState<string[]>([]);
  const [rawParsedRows, setRawParsedRows] = useState<ParsedRowData[]>([]);
  const [isSubmittingImport, setIsSubmittingImport] = useState<boolean>(false);

  // DOM References hooks anchoring hidden document file and camera triggers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Column Mapping Layout Configuration States
  const [colMap, setColMap] = useState({
    date: "",
    description: "",
    amount: "",
    currency: "",
    type: ""
  });
  const [fallbackCurrency, setFallbackCurrency] = useState<string>(workspaceCurrency);
  const [fallbackType, setFallbackType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [stagedPreviewRows, setStagedPreviewRows] = useState<ImportRowPreview[]>([]);

  /* RESILIENT HELPER: PARSES EXCEL SERIALS AND REGIONAL STRINGS SAFELY */
  const safeParseSpreadsheetDate = (rawVal: unknown): string => {
    const fallbackToday = new Date().toISOString().substring(0, 10);
    if (!rawVal) return fallbackToday;

    if (rawVal instanceof Date) {
      return !isNaN(rawVal.getTime()) ? rawVal.toISOString().substring(0, 10) : fallbackToday;
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

    const stringParts = strVal.split(/[-/.]/);
    if (stringParts.length === 3) {
      const firstPart = parseInt(stringParts[0], 10);
      const secondPart = parseInt(stringParts[1], 10) - 1; 
      const thirdPart = parseInt(stringParts[2], 10);

      if (thirdPart > 1000 && secondPart >= 0 && secondPart < 12 && firstPart > 0 && firstPart <= 31) {
        parsed = new Date(thirdPart, secondPart, firstPart);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().substring(0, 10);
        }
      }
    }

    return fallbackToday;
  };

  const refreshLedgerData = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try {
      const txData = await transactionService.getByWorkspace(activeWorkspaceId);
      setTransactions(txData.transactions);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to refresh data stream.";
      toast.error(msg);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    const syncWorkspaceLedgerOnSwitch = async () => {
      setIsLoading(true);
      try {
        const [txData, catData] = await Promise.all([
          transactionService.getByWorkspace(activeWorkspaceId),
          categoryService.getByWorkspace(activeWorkspaceId)
        ]);
        
        setTransactions(txData.transactions);
        setCategories(catData.categories);
        setCurrentPage(1);
        setSelectedRecordIds([]);
      } catch (error: unknown) {
        console.error("Ledger Sync Failure:", error);
        const msg = error instanceof Error ? error.message : "Failed to sync entries with Neon Cloud database.";
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };

    syncWorkspaceLedgerOnSwitch();
  }, [activeWorkspaceId]);

  /* FULL-STACK HANDLER: PROCESSES MULTIPART FILE SCAN THROUGHS VIA GEMINI ENGINE */
  const handleReceiptScanProcessing = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetFile = e.target.files?.[0];
    if (!targetFile) return;

    setIsScanning(true);
    const notificationId = toast.loading("AI Engine analyzing receipt layout pixels...");

    try {
      const formTransportContainer = new FormData();
      formTransportContainer.append("receipt", targetFile);

      const response = await fetch("http://localhost:5000/api/transactions/scan", {
        method: "POST",
        body: formTransportContainer,
        credentials: "include",
      });

      // 🚀 FIXED: Anti-Crash Safety Shield parsing content headers before JSON execution
      const contentType = response.headers.get("content-type") || "";
      
      if (!response.ok) {
        if (contentType.includes("application/json")) {
          const errorJson = await response.json();
          throw new Error(errorJson.error || "AI Ingestion system crash.");
        } else {
          throw new Error(`Server returned non-JSON HTML page. (Status Code: ${response.status})`);
        }
      }

      const parsedResult = await response.json();

      const unassignedNode = categories.find(c => c.name.toLowerCase() === "unassigned");
      const unassignedUUID = unassignedNode ? unassignedNode.id : categories[0]?.id || "";

      const preFilledMockTransaction: Partial<Transaction> = {
        id: undefined, 
        description: parsedResult.merchant || "AI Scanned Receipt",
        date: parsedResult.date ? new Date(parsedResult.date).toISOString() : new Date().toISOString(),
        originalAmount: Number(parsedResult.totalAmount || 0),
        originalCurrency: parsedResult.currency || workspaceCurrency,
        amount: Number(parsedResult.totalAmount || 0), 
        baseAmountUSD: convertAmount(Number(parsedResult.totalAmount || 0), parsedResult.currency || workspaceCurrency, "USD"),
        type: "EXPENSE",
        categoryId: unassignedUUID,
        category: unassignedNode || categories[0],
      };

      toast.success("Receipt structure extracted cleanly!", { id: notificationId });
      
      setEditingTransaction(preFilledMockTransaction as Transaction);
      setIsModalOpen(true);

    } catch (error: unknown) {
      console.error("OCR AI Pipeline breakdown:", error);
      const msg = error instanceof Error ? error.message : "Network processing timeout.";
      toast.error(msg, { id: notificationId });
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  /* ENGINE HOOKS: DATA TRANSFORMATION PIPELINES */
  const handleFileDropProcessing = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    
    if (fileNameLower.endsWith(".csv")) {
      Papa.parse<ParsedRowData>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<ParsedRowData>) => {
          if (results.meta.fields && results.data.length > 0) {
            setRawFileHeaders(results.meta.fields);
            setRawParsedRows(results.data);
            autoGuessFileHeaders(results.meta.fields);
            setImportStep(2);
          } else {
            toast.error("CSV statement configuration looks empty or corrupt.");
          }
        }
      });
    } else if (fileNameLower.endsWith(".xlsx") || fileNameLower.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        if (!bstr) return;
        
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true, dateNF: "yyyy-mm-dd" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
        
        if (data.length > 0) {
          const headers = data[0];
          const rows = XLSX.utils.sheet_to_json<ParsedRowData>(ws);
          setRawFileHeaders(headers);
          setRawParsedRows(rows);
          autoGuessFileHeaders(headers);
          setImportStep(2);
        } else {
          toast.error("Excel tracking sheet looks empty.");
        }
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error("Unsupported file extension. Drop a clean .csv or .xlsx workbook file.");
    }
  };

  const autoGuessFileHeaders = (headers: string[]) => {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const mapping = { date: "", description: "", amount: "", currency: "", type: "" };
    
    headers.forEach(h => {
      const normal = clean(h);
      if (normal.includes("date") || normal.includes("time")) mapping.date = h;
      else if (normal.includes("desc") || normal.includes("narrative") || normal.includes("detail")) mapping.description = h;
      else if (normal.includes("amount") || normal.includes("value") || normal.includes("paid") || normal.includes("price")) mapping.amount = h;
      else if (normal.includes("curr") || normal.includes("code")) mapping.currency = h;
      else if (normal.includes("type") || normal.includes("class")) mapping.type = h;
    });
    setColMap(mapping);
  };

  const handleComputeMappingVerification = () => {
    if (!colMap.date || !colMap.description || !colMap.amount) {
      toast.error("Mapping Error: Date, Description, and Amount columns must be aligned.");
      return;
    }

    const unassignedNode = categories.find(c => c.name.toLowerCase() === "unassigned");
    const unassignedUUID = unassignedNode ? unassignedNode.id : categories[0]?.id || "";

    const cleanStagedDataset: ImportRowPreview[] = rawParsedRows.map((row, idx) => {
      let rawAmount = parseFloat(String(row[colMap.amount] || "0").replace(/[^0-9.-]/g, ""));
      let detectedType: "INCOME" | "EXPENSE" = fallbackType;

      if (colMap.type && row[colMap.type]) {
        const tStr = String(row[colMap.type]).toUpperCase();
        if (tStr.includes("INC") || tStr.includes("CR") || tStr.includes("DEP")) detectedType = "INCOME";
        else if (tStr.includes("EXP") || tStr.includes("DR") || tStr.includes("WD")) detectedType = "EXPENSE";
      } else if (rawAmount < 0) {
        detectedType = "EXPENSE";
        rawAmount = Math.abs(rawAmount);
      }

      let rowCurrency = fallbackCurrency;
      if (colMap.currency && row[colMap.currency]) {
        rowCurrency = String(colMap.currency && row[colMap.currency]).toUpperCase().trim().substring(0, 3);
      }

      let targetCategoryId = unassignedUUID;
      const descLower = String(row[colMap.description] || "").toLowerCase();
      
      if (descLower.includes("salary") || descLower.includes("dividend")) {
        const found = categories.find(c => c.name.toLowerCase().includes("salary") || c.name.toLowerCase().includes("revenue"));
        if (found) targetCategoryId = found.id;
      } else if (descLower.includes("rent") || descLower.includes("housing") || descLower.includes("landlord")) {
        const found = categories.find(c => c.name.toLowerCase().includes("rent") || c.name.toLowerCase().includes("housing"));
        if (found) targetCategoryId = found.id;
      }

      return {
        index: idx,
        date: safeParseSpreadsheetDate(row[colMap.date]),
        description: String(row[colMap.description] || "Imported Ledger Record Entry"),
        amount: isNaN(rawAmount) ? 0 : rawAmount,
        currency: rowCurrency,
        type: detectedType,
        categoryId: targetCategoryId
      };
    });

    setStagedPreviewRows(cleanStagedDataset);
    setImportStep(3);
  };

  const handleCommitBulkDataToBackend = async () => {
    if (!activeWorkspaceId) return;
    setIsSubmittingImport(true);

    try {
      const formattedPayload = stagedPreviewRows.map(row => {
        const convertedToUSD = convertAmount(row.amount, row.currency, "USD");
        return {
          originalAmount: row.amount,
          originalCurrency: row.currency,
          baseAmountUSD: convertedToUSD,
          type: row.type,
          description: row.description,
          date: new Date(row.date).toISOString(),
          categoryId: row.categoryId
        };
      });

      const response = await fetch("http://localhost:5000/api/transactions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          transactions: formattedPayload
        }),
        credentials: "include"
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(typeof resData?.error === "string" ? resData.error : "Bulk pipeline ingestion crash.");
      }

      toast.success(typeof resData?.message === "string" ? resData.message : "Spreadsheet matching records uploaded successfully!");
      setIsImportOpen(false);
      setImportStep(1);
      await refreshLedgerData();

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Ingestion thread error.";
      toast.error(errorMsg);
    } finally {
      setIsSubmittingImport(false);
    }
  };

  /* --- ACTIONS --- */
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
        type: payload.type,
        description: payload.description,
        date: payload.date,
        workspaceId: activeWorkspaceId,
        categoryId: payload.categoryId,
        amount: payload.originalAmount, 
      });

      await refreshLedgerData(); 
      handleClosePopupModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Could not log transaction down onto server logs.";
      toast.error(msg);
    }
  };

  const handleEditRecordTrigger = (targetRecordId: string) => {
    const match = transactions.find((t) => t.id === targetRecordId);
    if (match) {
      setEditingTransaction(match);
      setIsModalOpen(true);
    }
  };

  const handleDeleteRecordTrigger = async (targetRecordId: string) => {
    try {
      await transactionService.delete(targetRecordId);
      setTransactions(prev => prev.filter(item => item.id !== targetRecordId));
      setSelectedRecordIds(current => current.filter(id => id !== targetRecordId));
      toast.success("Ledger entry dropped completely.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to drop entry row from database storage.";
      toast.error(msg);
    }
  };

  const handleBulkDeleteExecution = async () => {
    try {
      await Promise.all(selectedRecordIds.map(id => transactionService.delete(id)));
      toast.success(`Successfully cleared ${selectedRecordIds.length} financial rows.`);
      setTransactions(prev => prev.filter(row => !selectedRecordIds.includes(row.id)));
      setSelectedRecordIds([]);
      setCurrentPage(1);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Bulk ledger flush operation experienced a failure.";
      toast.error(msg);
      await refreshLedgerData();
    }
  };

  const handleToggleSingleRowSelection = (targetId: string) => {
    setSelectedRecordIds((current) => 
      current.includes(targetId) ? current.filter(id => id !== targetId) : [...current, targetId]
    );
  };

  const handleToggleSelectAllOnPage = (visiblePageIds: string[]) => {
    setSelectedRecordIds((current) => {
      const isAllChecked = visiblePageIds.every(id => current.includes(id));
      return isAllChecked ? current.filter(id => !visiblePageIds.includes(id)) : Array.from(new Set([...current, ...visiblePageIds]));
    });
  };

  const handleClearSelectionQueue = () => setSelectedRecordIds([]);

  const processedFilteredRecords = transactions.filter((singleLog) => {
    const normalQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = normalQuery === "" || singleLog.description.toLowerCase().includes(normalQuery);
    const matchesType = selectedType === "all" || singleLog.type.toUpperCase() === selectedType.toUpperCase();
    const matchesCategory = selectedCategory === "all" || singleLog.categoryId === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  let totalIncomeUSD = 0;
  let totalExpenseUSD = 0;

  processedFilteredRecords.forEach((recordItem) => {
    const value = Number(recordItem.baseAmountUSD ?? recordItem.amount ?? 0);
    if (recordItem.type.toUpperCase() === "INCOME") {
      totalIncomeUSD += value;
    } else if (recordItem.type.toUpperCase() === "EXPENSE") {
      totalExpenseUSD += value;
    }
  });

  const calculatedIncomeTotal = convertAmount(totalIncomeUSD, "USD", workspaceCurrency);
  const calculatedExpenseTotal = convertAmount(totalExpenseUSD, "USD", workspaceCurrency);

  const indexPositionOfLastRowItem = currentPage * itemsPerPage;
  const indexPositionOfFirstRowItem = indexPositionOfLastRowItem - itemsPerPage;
  
  const adaptiveGridRows = processedFilteredRecords.map(tx => ({
    id: tx.id,
    date: tx.date.substring(0, 10),
    description: tx.description,
    category: tx.category?.name || "General",
    originalAmount: Number(tx.originalAmount ?? tx.amount ?? 0),
    originalCurrency: tx.originalCurrency ?? "USD",
    amount: Number(tx.amount), 
    type: tx.type.toLowerCase() as "income" | "expense"
  })).slice(indexPositionOfFirstRowItem, indexPositionOfLastRowItem);

  return (
    <div className={styles.ledgerCanvasWrapper}>
      
      <TransactionHeader 
        totalCount={processedFilteredRecords.length}
        onAddTransactionClick={handleOpenCreateModal}
        onImportClick={() => { setImportStep(1); setIsImportOpen(true); }}
        onFileScannerSelect={() => fileInputRef.current?.click()}
        onCameraScannerSelect={() => cameraInputRef.current?.click()}
      />

      <TransactionFilterBar
        searchQuery={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        selectedType={selectedType}
        onTypeChange={(t) => { setSelectedType(t); setCurrentPage(1); }}
        availableCategories={categories.map(c => c.name)}
        selectedCategory={selectedCategory}
        onCategoryChange={(c) => {
          const match = categories.find(cat => cat.name.toLowerCase() === c.toLowerCase());
          setSelectedCategory(match ? match.id : "all");
          setCurrentPage(1);
        }}
      />

      <main className={styles.mainContentStage}>
        <TransactionLedgerGrid
          records={adaptiveGridRows}
          onEditRecord={handleEditRecordTrigger}
          onDeleteRecord={handleDeleteRecordTrigger}
          onSendReminder={(row) => setActiveReminderTx(row)} 
          selectedIds={selectedRecordIds}
          onToggleSelectRow={handleToggleSingleRowSelection}
          onToggleSelectAllOnPage={handleToggleSelectAllOnPage}
        />
      </main>

      <div className={styles.paginationControlRowDeck}>
        <div className={styles.capacitySelectorFlexCluster}>
          <span className={styles.capacityLabelText}>Rows per page:</span>
          <select 
            value={itemsPerPage} 
            onChange={(event) => { setItemsPerPage(Number(event.target.value)); setCurrentPage(1); }}
            className={styles.nativeCapacitySelectDropdown}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <TransactionPagination
          totalItems={processedFilteredRecords.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <TransactionFooter 
        totalIncome={calculatedIncomeTotal}
        totalExpenses={calculatedExpenseTotal}
        sourceCurrency={workspaceCurrency}
        activeWorkspaceId={activeWorkspaceId}
      />

      {/* Hidden document upload and camera inputs handles */}
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

      {/* Absolute Floating Glass Loading Shield for scanner engine parsing */}
      {isScanning && (
        <div className={styles.scanningOverlayBackdrop}>
          <div className={styles.scanningCoreCard}>
            <FiLoader className={styles.scanningSpinnerVector} />
            <h4>Reading Receipt Matrix</h4>
            <p>Gemini LLM is mapping variables, isolating currency codes, and structuring ledger lines...</p>
          </div>
        </div>
      )}

      {/* PRE-FLIGHT INTERACTIVE MAPPING INGESTION AUTOMATED DATA WIZARD MODAL */}
      {isImportOpen && (
        <div className={styles.modalOverlayBackdrop} onClick={() => { if(!isSubmittingImport) setIsImportOpen(false); }}>
          <div className={`${styles.modalContentCard} ${styles.wizardExpansionLarge}`} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.wizardHeaderDeck}>
              <div className={styles.wizardHeaderTitleBlock}>
                <h3 className={styles.wizardMainTitle}>Automated Statement Importer</h3>
                <span className={styles.wizardBadgePill}>Workspace Engine v2</span>
              </div>
              <div className={styles.stepperPipelineLayout}>
                <span className={importStep === 1 ? styles.stepperNodeActive : styles.stepperNodeMuted}>Upload</span>
                <FiChevronRight className={styles.stepperArrowIcon} />
                <span className={importStep === 2 ? styles.stepperNodeActive : styles.stepperNodeMuted}>Map Headers</span>
                <FiChevronRight className={styles.stepperArrowIcon} />
                <span className={importStep === 3 ? styles.stepperNodeActive : styles.stepperNodeMuted}>Validate Review</span>
              </div>
            </div>

            {importStep === 1 && (
              <div className={styles.dropzoneFrameZone}>
                <FiUploadCloud className={styles.dropzoneUploadIcon} />
                <p className={styles.dropzoneMainTitleText}>Drag and drop statement here, or click to browse</p>
                <p className={styles.dropzoneSubtextMeta}>Supports standard banking sheet outputs (.csv, .xlsx, .xls)</p>
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls" 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  onChange={handleFileDropProcessing}
                />
              </div>
            )}

            {importStep === 2 && (
              <div className={styles.wizardFormCoreBody}>
                <div className={`${styles.wizardInfoAlertBox} ${styles.alertInfoBlue}`}>
                  <FiFileText size={16} />
                  <span>Map your spreadsheet columns to your ledger workspace layout metrics. Date, Description, and Amount fields are required parameters.</span>
                </div>

                <div className={styles.mappingSelectorsGridRow}>
                  <div className={styles.formGroupWrapperField}>
                    <label className={styles.fieldLayoutInputLabel}>Transaction Date Column *</label>
                    <select value={colMap.date} onChange={e => setColMap(p => ({...p, date: e.target.value}))} className={styles.premiumFieldSelectControl}>
                      <option value="">-- Choose Column --</option>
                      {rawFileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroupWrapperField}>
                    <label className={styles.fieldLayoutInputLabel}>Description / Narration Column *</label>
                    <select value={colMap.description} onChange={e => setColMap(p => ({...p, description: e.target.value}))} className={styles.premiumFieldSelectControl}>
                      <option value="">-- Choose Column --</option>
                      {rawFileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroupWrapperField}>
                    <label className={styles.fieldLayoutInputLabel}>Amount Column *</label>
                    <select value={colMap.amount} onChange={e => setColMap(p => ({...p, amount: e.target.value}))} className={styles.premiumFieldSelectControl}>
                      <option value="">-- Choose Column --</option>
                      {rawFileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroupWrapperField}>
                    <label className={styles.fieldLayoutInputLabel}>Currency Column (Optional)</label>
                    <select value={colMap.currency} onChange={e => setColMap(p => ({...p, currency: e.target.value}))} className={styles.premiumFieldSelectControl}>
                      <option value="">-- Fallback Value Only ({fallbackCurrency}) --</option>
                      {rawFileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.stagerFallbackSubFormBlock}>
                  <div className={styles.formGroupWrapperField}>
                    <label className={styles.fieldLayoutInputLabel}>Fallback Document Currency</label>
                    <input type="text" maxLength={3} value={fallbackCurrency} onChange={e => setFallbackCurrency(e.target.value.toUpperCase())} className={styles.premiumFieldInputTextControl} placeholder="PKR" />
                  </div>
                  <div className={styles.fieldGroupWrapperField}>
                    <label className={styles.fieldLayoutInputLabel}>Default Flow Configuration</label>
                    <select value={fallbackType} onChange={e => setFallbackType(e.target.value as "INCOME" | "EXPENSE")} className={styles.premiumFieldSelectControl}>
                      <option value="EXPENSE">Expense (Debit/Payouts)</option>
                      <option value="INCOME">Income (Credit/Deposits)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.wizardActionFooterToolbar}>
                  <button type="button" onClick={() => setImportStep(1)} className={styles.wizardCancelControlBtn}>Back</button>
                  <button type="button" onClick={handleComputeMappingVerification} className={styles.wizardPrimaryConfirmBtn}>Generate Preview</button>
                </div>
              </div>
            )}

            {importStep === 3 && (
              <div className={styles.wizardFormCoreBody}>
                <div className={`${styles.wizardInfoAlertBox} ${styles.alertWarningAmber}`}>
                  <FiAlertCircle size={16} />
                  <span>Staging Area: Unmatched transactions will default into your protected <b>Unassigned</b> stack. You can clean or override row configurations below.</span>
                </div>

                <div className={styles.previewDataGridContainerWindow}>
                  <table className={styles.previewTableViewportLayout}>
                    <thead className={styles.previewTableHeaderStickyDeck}>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Flow Type</th>
                        <th>Workspace Category Core Mapping</th>
                      </tr>
                    </thead>
                    <tbody className={styles.previewTableBodyRowCluster}>
                      {stagedPreviewRows.map((row, rIdx) => (
                        <tr key={row.index}>
                          <td className="whitespace-nowrap font-medium">{row.date}</td>
                          <td className={styles.tableCellTruncateText} title={row.description}>{row.description}</td>
                          <td className="font-bold text-slate-900 dark:text-zinc-100">{row.currency} {row.amount}</td>
                          <td>
                            <span className={row.type === "INCOME" ? styles.badgeTypeIncomePill : styles.badgeTypeExpensePill}>
                              {row.type}
                            </span>
                          </td>
                          <td>
                            <select 
                              value={row.categoryId}
                              onChange={(e) => {
                                const nextVal = e.target.value;
                                setStagedPreviewRows(prev => prev.map((pr, pIdx) => pIdx === rIdx ? {...pr, categoryId: nextVal} : pr));
                              }}
                              className={styles.tableCellInlineSelectControl}
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.wizardActionFooterToolbar}>
                  <span className={styles.wizardCounterSummaryMetaText}>{stagedPreviewRows.length} records staged.</span>
                  <div className={styles.flexButtonGroupRow}>
                    <button type="button" disabled={isSubmittingImport} onClick={() => setImportStep(2)} className={styles.wizardCancelControlBtn}>Back</button>
                    <button type="button" disabled={isSubmittingImport} onClick={handleCommitBulkDataToBackend} className={styles.wizardCommitExecutionBtn}>
                      {isSubmittingImport ? "Syncing Database Grid..." : "Commit Statement Import"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Active Debt Reminder Popup Modal */}
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

      {/* Standard Transaction Modals */}
      {isModalOpen && (
        <div className={styles.modalOverlayBackdrop} onClick={handleClosePopupModal}>
          <div className={styles.modalContentCard} onClick={(e) => e.stopPropagation()}>
            <TransactionForm 
              onAddTransaction={handleUpsertTransaction}
              availableCategories={categories}
              initialData={editingTransaction}
              onCancel={handleClosePopupModal}
            />
          </div>
        </div>
      )}

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