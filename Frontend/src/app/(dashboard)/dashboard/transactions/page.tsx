// src/app/(dashboard)/dashboard/transactions/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { transactionService, categoryService, Transaction, Category } from "@/utils/api";
import { toast } from "sonner";

import TransactionHeader from "@/components/transactions/TransactionHeader/TransactionHeader";
import TransactionFilterBar, { TransactionTypeFilter } from "@/components/transactions/TransactionFilterBar/TransactionFilterBar";
import TransactionLedgerGrid from "@/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid";
import TransactionPagination from "@/components/transactions/TransactionPagination/TransactionPagination";
import BulkActionToolBelt from "@/components/transactions/BulkActionToolBelt/BulkActionToolBelt";
import TransactionFooter from "@/components/transactions/TransactionFooter/TransactionFooter";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { TransactionForm } from "@/components/forms/TransactionForm/TransactionForm";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES ===
   ========================================================================== */
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
/* === SECTION 2 END === */

export default function TransactionsPage() {
  const { activeWorkspaceId } = useWorkspace();

  /* --- STATE --- */
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<TransactionTypeFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  /* ==========================================================================
     === LIFECYCLE SYNC ===
     ========================================================================== */
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

  /* ==========================================================================
     === TRANSACTION MUTATION HANDLERS ===
     ========================================================================== */
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
        amount: payload.originalAmount, // legacy field
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

  /* ==========================================================================
     === SELECTION MATRIX ===
     ========================================================================== */
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

  /* ==========================================================================
     === SEARCH & FILTER ===
     ========================================================================== */
  const processedFilteredRecords = transactions.filter((singleLog) => {
    const normalQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = normalQuery === "" || singleLog.description.toLowerCase().includes(normalQuery);
    const matchesType = selectedType === "all" || singleLog.type.toUpperCase() === selectedType.toUpperCase();
    const matchesCategory = selectedCategory === "all" || singleLog.categoryId === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  // 👇 Use baseAmountUSD for totals (consistent across currencies)
  let calculatedIncomeTotal = 0;
  let calculatedExpenseTotal = 0;

  processedFilteredRecords.forEach((recordItem) => {
    const value = Number(recordItem.baseAmountUSD ?? recordItem.amount ?? 0);
    if (recordItem.type.toUpperCase() === "INCOME") {
      calculatedIncomeTotal += value;
    } else if (recordItem.type.toUpperCase() === "EXPENSE") {
      calculatedExpenseTotal += value;
    }
  });

  /* --- PAGINATION --- */
  const indexPositionOfLastRowItem = currentPage * itemsPerPage;
  const indexPositionOfFirstRowItem = indexPositionOfLastRowItem - itemsPerPage;
  
  const adaptiveGridRows = processedFilteredRecords.map(tx => ({
    id: tx.id,
    date: tx.date.substring(0, 10),
    description: tx.description,
    category: tx.category?.name || "General",
    originalAmount: Number(tx.originalAmount ?? tx.amount ?? 0),
    originalCurrency: tx.originalCurrency ?? "USD",
    amount: Number(tx.amount), // keep for backward compatibility
    type: tx.type.toLowerCase() as "income" | "expense"
  })).slice(indexPositionOfFirstRowItem, indexPositionOfLastRowItem);

  /* ==========================================================================
     === RENDER ===
     ========================================================================== */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <p className="text-gray-400 font-medium tracking-wide animate-pulse text-sm">Synchronizing Cloud Ledgers...</p>
      </div>
    );
  }

  return (
    <div className={styles.ledgerCanvasWrapper}>
      
      <TransactionHeader 
        totalCount={processedFilteredRecords.length}
        onAddTransactionClick={handleOpenCreateModal}
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
      />

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