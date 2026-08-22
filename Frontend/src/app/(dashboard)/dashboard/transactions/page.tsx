// Frontend/src/app/(dashboard)/dashboard/transactions/page.tsx
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

import ImportWizardModal, { StagedTransactionRow } from "@/components/transactions/ImportWizardModal/ImportWizardModal";
import ReceiptScannerOverlay, { ReceiptScannerOverlayHandle } from "@/components/transactions/ReceiptScannerOverlay/ReceiptScannerOverlay";
import DebtReminderModal from "@/components/transactions/DebtReminderModal/DebtReminderModal";
import TrashCanModal from "@/components/transactions/TrashCanModal/TrashCanModal";

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
  const { activeWorkspaceId, activeWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();
  const workspaceCurrency = activeWorkspace?.currency || "USD";
  const { convertAmount } = useCurrency();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [selectedType, setSelectedType] = useState<TransactionTypeFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeReminderTx, setActiveReminderTx] = useState<TransactionRecord | null>(null);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isSubmittingImport, setIsSubmittingImport] = useState<boolean>(false);
  const [isTrashOpen, setIsTrashOpen] = useState<boolean>(false);

  const scannerRef = useRef<ReceiptScannerOverlayHandle>(null);

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
    if (!activeWorkspaceId || isWorkspaceLoading) return;

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

    void loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, isWorkspaceLoading]);

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
        (c) => c.name.toLowerCase() === "unassigned" || c.name.toLowerCase().includes("unassigned")
      );
      const defaultCategoryId = unassignedCategory?.id || safeCategories[0]?.id;

      if (!defaultCategoryId) {
        throw new Error("No categories found in this workspace. Please create a category first.");
      }

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

  const handleOpenCreateModal = useCallback(() => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  }, []);

  const handleClosePopupModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  }, []);

  const handleUpsertTransaction = async (payload: FormPayload) => {
    try {
      if (!activeWorkspaceId) {
        toast.error("No active workspace detected.");
        return;
      }

      const workspaceConvertedAmount =
        payload.originalCurrency.toUpperCase() === workspaceCurrency.toUpperCase()
          ? payload.originalAmount
          : convertAmount(payload.originalAmount, payload.originalCurrency, workspaceCurrency);

      const requestBody = {
        originalAmount: payload.originalAmount,
        originalCurrency: payload.originalCurrency,
        baseAmountUSD: payload.baseAmountUSD,
        type: payload.type as "INCOME" | "EXPENSE",
        description: payload.description,
        date: payload.date,
        categoryId: payload.categoryId,
        workspaceId: activeWorkspaceId,
        amount: workspaceConvertedAmount,
      };

      if (payload.id) {
        await transactionService.update(payload.id, requestBody);
        toast.success("Transaction updated successfully.");
      } else {
        await transactionService.create(requestBody);
        toast.success("Transaction recorded successfully.");
      }

      await refreshLedgerData();
      handleClosePopupModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save transaction.";
      toast.error(message);
    }
  };

  const handleEditRecordTrigger = useCallback((targetId: string) => {
    setTransactions((currentTx) => {
      const match = currentTx.find((t) => t.id === targetId);
      if (match) {
        setEditingTransaction(match);
        setIsModalOpen(true);
      }
      return currentTx;
    });
  }, []);

  const handleDeleteRecordTrigger = useCallback(async (targetId: string) => {
    try {
      await transactionService.delete(targetId);
      setTransactions((prev) => {
        const updated = (Array.isArray(prev) ? prev : []).filter((item) => item.id !== targetId);
        return updated;
      });
      setSelectedRecordIds((prev) => (Array.isArray(prev) ? prev : []).filter((id) => id !== targetId));
      
      setTimeout(() => {
        setCurrentPage((currPage) => {
          const remainingCount = transactions.length - 1;
          const maxPages = Math.ceil(remainingCount / itemsPerPage) || 1;
          return currPage > maxPages ? maxPages : currPage;
        });
      }, 0);

      toast.success("Transaction moved to Recycle Bin.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete transaction.";
      toast.error(message);
    }
  }, [transactions.length, itemsPerPage]);

  const handleBulkDeleteExecution = async () => {
    try {
      const safeSelectedIds = Array.isArray(selectedRecordIds) ? selectedRecordIds : [];
      await Promise.all(safeSelectedIds.map((id) => transactionService.delete(id)));

      toast.success(`Moved ${safeSelectedIds.length} transactions to Recycle Bin.`);
      setTransactions((prev) => (Array.isArray(prev) ? prev : []).filter((row) => !safeSelectedIds.includes(row.id)));
      setSelectedRecordIds([]);
      setCurrentPage(1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Bulk delete failed.";
      toast.error(message);
      await refreshLedgerData();
    }
  };

  const handleToggleSingleRowSelection = useCallback((targetId: string) => {
    setSelectedRecordIds((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.includes(targetId) ? safePrev.filter((id) => id !== targetId) : [...safePrev, targetId];
    });
  }, []);

  const handleToggleSelectAllOnPage = useCallback((visiblePageIds: string[]) => {
    setSelectedRecordIds((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const safeVisible = Array.isArray(visiblePageIds) ? visiblePageIds : [];
      const allSelected = safeVisible.every((id) => safePrev.includes(id));
      return allSelected ? safePrev.filter((id) => !safeVisible.includes(id)) : Array.from(new Set([...safePrev, ...safeVisible]));
    });
  }, []);

  const filteredTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const query = searchQuery.toLowerCase().trim();
    const typeUpper = selectedType.toUpperCase();

    return safeTransactions.filter((tx) => {
      const matchesSearch = !query || (tx.description || "").toLowerCase().includes(query);
      const matchesType = selectedType === "all" || (tx.type || "").toUpperCase() === typeUpper;
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
  const pagedTransactions = useMemo(() => {
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, startIndex, itemsPerPage]);

  const gridRows: TransactionRecord[] = useMemo(() => {
    return pagedTransactions.map((tx) => ({
      id: tx.id,
      date: tx.date ? String(tx.date).substring(0, 10) : "",
      description: tx.description || "",
      category: tx.category?.name || "General",
      originalAmount: Number(tx.originalAmount ?? tx.amount ?? 0),
      originalCurrency: tx.originalCurrency ?? workspaceCurrency,
      amount: Number(tx.amount || 0),
      type: (tx.type || "expense").toLowerCase() as "income" | "expense",
    }));
  }, [pagedTransactions, workspaceCurrency]);

  const categoryOptionsForFilter = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    return safeCategories.map((c) => ({ id: c.id, name: c.name }));
  }, [categories]);

  if (isWorkspaceLoading) {
    return (
      <div className={styles.inlineLoadingContainer}>
        <FiLoader className={styles.inlineSpinner} />
        <p>Initializing workspace context...</p>
      </div>
    );
  }

  return (
    <div className={styles.ledgerCanvasWrapper}>
      <TransactionHeader
        totalCount={filteredTransactions.length}
        onAddTransactionClick={handleOpenCreateModal}
        onImportClick={() => setIsImportOpen(true)}
        onFileScannerSelect={() => scannerRef.current?.triggerFileInput()}
        onCameraScannerSelect={() => scannerRef.current?.triggerCameraInput()}
      />

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

      <TransactionFooter
        totalIncome={calculatedIncomeTotal}
        totalExpenses={calculatedExpenseTotal}
        sourceCurrency={workspaceCurrency}
        activeWorkspaceId={activeWorkspaceId}
        onOpenTrashCan={() => setIsTrashOpen(true)}
      />

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

      <TrashCanModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        workspaceId={activeWorkspaceId}
        onLedgerChange={refreshLedgerData}
      />

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