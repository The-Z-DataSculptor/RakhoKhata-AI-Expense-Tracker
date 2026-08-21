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
import { FiLoader } from "react-icons/fi";

import TransactionHeader from "@/components/transactions/TransactionHeader/TransactionHeader";
import TransactionFilterBar, { TransactionTypeFilter } from "@/components/transactions/TransactionFilterBar/TransactionFilterBar";
import TransactionLedgerGrid, { TransactionRecord } from "@/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid";
import TransactionPagination from "@/components/transactions/TransactionPagination/TransactionPagination";
import BulkActionToolBelt from "@/components/transactions/BulkActionToolBelt/BulkActionToolBelt";
import TransactionFooter from "@/components/transactions/TransactionFooter/TransactionFooter";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { TransactionForm } from "@/components/forms/TransactionForm/TransactionForm";

// Modularized Components
import ImportWizardModal, { StagedTransactionRow } from "@/components/transactions/ImportWizardModal/ImportWizardModal";
import ReceiptScannerOverlay, { ReceiptScannerOverlayHandle } from "@/components/transactions/ReceiptScannerOverlay/ReceiptScannerOverlay";
import DebtReminderModal from "@/components/transactions/DebtReminderModal/DebtReminderModal";

import styles from "./page.module.css";

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
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TRANSACTIONS MAIN PAGE ===
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

  // ----- Filter & Pagination state -----
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [selectedType, setSelectedType] = useState<TransactionTypeFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  // ----- Modals state -----
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeReminderTx, setActiveReminderTx] = useState<TransactionRecord | null>(null);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isSubmittingImport, setIsSubmittingImport] = useState<boolean>(false);

  const scannerRef = useRef<ReceiptScannerOverlayHandle>(null);

  // ---------------------------------------------------------------------------
  // DATA FETCHING
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
          setTransactions(Array.isArray(txData?.transactions) ? txData.transactions : []);
          setCategories(Array.isArray(catData?.categories) ? catData.categories : []);
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
        if (isMounted) setIsLoading(false);
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
  // SPREADSHEET IMPORT COMMIT
  // ---------------------------------------------------------------------------
  const handleCommitBulkDataToBackend = async (stagedRows: StagedTransactionRow[]) => {
    if (!activeWorkspaceId) return;
    setIsSubmittingImport(true);

    try {
      const payload = stagedRows.map((row) => ({
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
      await refreshLedgerData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Import failed due to a network error.";
      toast.error(message);
    } finally {
      setIsSubmittingImport(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CRUD ACTIONS
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
        await transactionService.update(payload.id, {
          originalAmount: payload.originalAmount,
          originalCurrency: payload.originalCurrency,
          baseAmountUSD: payload.baseAmountUSD,
          type: payload.type as "INCOME" | "EXPENSE",
          description: payload.description,
          date: payload.date,
          categoryId: payload.categoryId,
          amount: payload.originalAmount,
        });
      } else {
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
      }

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
  // SELECTION
  // ---------------------------------------------------------------------------
  const handleToggleSingleRowSelection = (targetId: string) => {
    setSelectedRecordIds((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.includes(targetId) ? safePrev.filter((id) => id !== targetId) : [...safePrev, targetId];
    });
  };

  const handleToggleSelectAllOnPage = (visiblePageIds: string[]) => {
    setSelectedRecordIds((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const safeVisible = Array.isArray(visiblePageIds) ? visiblePageIds : [];
      const allSelected = safeVisible.every((id) => safePrev.includes(id));
      return allSelected ? safePrev.filter((id) => !safeVisible.includes(id)) : Array.from(new Set([...safePrev, ...safeVisible]));
    });
  };

  // ---------------------------------------------------------------------------
  // FILTERING & AGGREGATIONS
  // ---------------------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    return safeTransactions.filter((tx) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || (tx.description || "").toLowerCase().includes(query);
      const matchesType = selectedType === "all" || (tx.type || "").toUpperCase() === selectedType.toUpperCase();
      const matchesCategory = selectedCategory === "all" || tx.categoryId === selectedCategory;
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
      {/* 1. Header with direct actions */}
      <TransactionHeader
        totalCount={filteredTransactions.length}
        onAddTransactionClick={handleOpenCreateModal}
        onImportClick={() => setIsImportOpen(true)}
        onFileScannerSelect={() => scannerRef.current?.triggerFileInput()}
        onCameraScannerSelect={() => scannerRef.current?.triggerCameraInput()}
      />

      {/* 2. Filter Bar */}
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

      {/* 3. Main Data Grid */}
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

      {/* 4. Pagination */}
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

      {/* 5. Footer Totals */}
      <TransactionFooter
        totalIncome={calculatedIncomeTotal}
        totalExpenses={calculatedExpenseTotal}
        sourceCurrency={workspaceCurrency}
        activeWorkspaceId={activeWorkspaceId}
      />

      {/* 6. Modals & Overlays */}
      <ReceiptScannerOverlay
        ref={scannerRef}
        isScanning={isScanning}
        onFileSelect={handleReceiptScanProcessing}
      />

      <ImportWizardModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        categories={categories}
        workspaceCurrency={workspaceCurrency}
        isSubmitting={isSubmittingImport}
        onCommitImport={handleCommitBulkDataToBackend}
      />

      <DebtReminderModal
        activeReminderTx={activeReminderTx}
        onClose={() => setActiveReminderTx(null)}
      />

      {/* Transaction Upsert Modal */}
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

      {/* Bulk Action Floating Toolbelt */}
      <BulkActionToolBelt
        selectedCount={selectedRecordIds.length}
        onClearSelection={() => setSelectedRecordIds([])}
        onBulkDelete={handleBulkDeleteExecution}
      />

      <footer className={styles.systemGlobalFooterWrapper}>
        <DashboardFooter />
      </footer>
    </div>
  );
}