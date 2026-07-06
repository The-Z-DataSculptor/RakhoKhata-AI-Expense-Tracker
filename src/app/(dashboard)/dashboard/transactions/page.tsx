// src/app/(dashboard)/dashboard/transactions/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext"; // NEW: Connect to the global brain
import TransactionHeader from "@/components/transactions/TransactionHeader/TransactionHeader";
import TransactionFilterBar, { TransactionTypeFilter } from "@/components/transactions/TransactionFilterBar/TransactionFilterBar";
import TransactionLedgerGrid, { TransactionRecord as BaseTransactionRecord } from "@/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid";
import TransactionPagination from "@/components/transactions/TransactionPagination/TransactionPagination";
import BulkActionToolBelt from "@/components/transactions/BulkActionToolBelt/BulkActionToolBelt";
import TransactionFooter from "@/components/transactions/TransactionFooter/TransactionFooter";
import styles from "./page.module.css";
import { TransactionForm } from "@/components/forms/TransactionForm/TransactionForm";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
// We extend the base record to ensure every transaction belongs to a workspace
interface TransactionRecord extends BaseTransactionRecord {
  workspaceId: string; 
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function TransactionsPage() {
  // --- WORKSPACE CONTEXT ---
  const { activeWorkspaceId } = useWorkspace(); // Grab the currently active mode

  /* --- STATE MANAGEMENT ENGINES --- */
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<TransactionTypeFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10); 
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  /* --- MODAL OVERLAY VISIBILITY CONTROL ENGINE --- */
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionRecord | null>(null);

  // System categories to populate filter tool belt option panels
  const [categories] = useState<string[]>([
    "Salary",
    "Freelance",
    "Groceries",
    "Utilities",
    "Investments",
    "Marketing"
  ]);

  // NEW: Every single dummy record now belongs specifically to the default "Personal" workspace
  const [rawRecords, setRawRecords] = useState<TransactionRecord[]>([
    { id: "tx-101", workspaceId: "ws-personal-default", date: "2026-06-12", description: "Monthly Corporate Base Salary Emolument", category: "salary", amount: 185000, type: "income" },
    { id: "tx-102", workspaceId: "ws-personal-default", date: "2026-06-11", description: "Alpha Centauri Green Groceries Bazaar Store", category: "groceries", amount: 14200, type: "expense" },
    { id: "tx-103", workspaceId: "ws-personal-default", date: "2026-06-10", description: "Full-Stack Web App Development Milestone UI Contract", category: "freelance", amount: 65000, type: "income" },
    { id: "tx-104", workspaceId: "ws-personal-default", date: "2026-06-08", description: "Sui Northern Gas Pipeline Bill Settlement", category: "utilities", amount: 8400, type: "expense" },
    { id: "tx-105", workspaceId: "ws-business-default", date: "2026-06-05", description: "Meta Platform Ads Campaign Conversions Growth Run", category: "marketing", amount: 32000, type: "expense" }, // Assigned to Business to prove it works!
    { id: "tx-106", workspaceId: "ws-personal-default", date: "2026-06-02", description: "PSX Index Dividend Payout Yield Release", category: "investments", amount: 12500, type: "income" },
  ]);

  /* --- SELECTION UTILITY MODIFIERS --- */
  const handleToggleSingleRowSelection = (targetId: string) => {
    setSelectedRecordIds((currentSelectedList) => {
      if (currentSelectedList.includes(targetId)) {
        return currentSelectedList.filter(id => id !== targetId);
      } else {
        return [...currentSelectedList, targetId];
      }
    });
  };

  const handleToggleSelectAllOnPage = (visiblePageIds: string[]) => {
    setSelectedRecordIds((currentSelectedList) => {
      const isAllOnPageChecked = visiblePageIds.every(id => currentSelectedList.includes(id));
      
      if (isAllOnPageChecked) {
        return currentSelectedList.filter(id => !visiblePageIds.includes(id));
      } else {
        return Array.from(new Set([...currentSelectedList, ...visiblePageIds]));
      }
    });
  };

  const handleClearSelectionQueue = () => {
    setSelectedRecordIds([]);
  };

  /* --- MODAL TOGGLE MECHANICS --- */
  const handleOpenCreateModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleClosePopupModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  // NEW: When a user creates a new transaction, force it to belong to the active workspace
  const handleUpsertTransaction = (savedTx: BaseTransactionRecord) => {
    const transactionWithWorkspace = {
      ...savedTx,
      workspaceId: editingTransaction ? editingTransaction.workspaceId : activeWorkspaceId,
    };

    setRawRecords((prevList) => {
      const exists = prevList.some((t) => t.id === savedTx.id);
      if (exists) {
        return prevList.map((t) => (t.id === savedTx.id ? transactionWithWorkspace : t));
      }
      return [transactionWithWorkspace, ...prevList];
    });
    handleClosePopupModal();
  };

  /* --- INTERACTIVE ACTION CALLBACK TRIPPERS --- */
  const handleEditRecordTrigger = (targetRecordId: string) => {
    const match = rawRecords.find((t) => t.id === targetRecordId);
    if (match) {
      setEditingTransaction(match);
      setIsModalOpen(true);
    }
  };

  const handleDeleteRecordTrigger = (targetRecordId: string) => {
    setRawRecords(currentRows => currentRows.filter(item => item.id !== targetRecordId));
    setSelectedRecordIds(currentSelected => currentSelected.filter(id => id !== targetRecordId));
    setCurrentPage(1);
  };

  const handleBulkDeleteExecution = () => {
    setRawRecords(currentRows => currentRows.filter(row => !selectedRecordIds.includes(row.id)));
    setSelectedRecordIds([]);
    setCurrentPage(1);
  };

  const handleSearchModification = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleTypeModification = (type: TransactionTypeFilter) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleCategoryModification = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  /* --- DATA ENGINE CONVERSION: CLIENT SIDE LIVE COMPUTED FILTER MATRIX --- */
  const processedFilteredRecords = rawRecords.filter((singleLog) => {
    // THE MAGIC FILTER: Only show records that belong to the active workspace
    if (singleLog.workspaceId !== activeWorkspaceId) return false;

    const normalQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = normalQuery === "" || singleLog.description.toLowerCase().includes(normalQuery);
    const matchesType = selectedType === "all" || singleLog.type === selectedType;
    const matchesCategory = selectedCategory === "all" || singleLog.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesType && matchesCategory;
  });

  /* --- LIVE CALCULATIONS SUMS ENGINE --- */
  let calculatedIncomeTotal = 0;
  let calculatedExpenseTotal = 0;

  processedFilteredRecords.forEach((recordItem) => {
    if (recordItem.type === "income") {
      calculatedIncomeTotal += recordItem.amount;
    } else if (recordItem.type === "expense") {
      calculatedExpenseTotal += recordItem.amount;
    }
  });

  /* --- PAGINATION COMPUTATION ACTION --- */
  const indexPositionOfLastRowItem = currentPage * itemsPerPage;
  const indexPositionOfFirstRowItem = indexPositionOfLastRowItem - itemsPerPage;
  const currentPaginatedRowsSubset = processedFilteredRecords.slice(indexPositionOfFirstRowItem, indexPositionOfLastRowItem);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.ledgerCanvasWrapper}>
      
      {/* THE FIRST COMPONENT: Premium glass header layout */}
      <TransactionHeader 
        totalCount={processedFilteredRecords.length}
        onAddTransactionClick={handleOpenCreateModal}
      />

      {/* THE SECOND COMPONENT: Stateful data search and toggle filters */}
      <TransactionFilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchModification}
        selectedType={selectedType}
        onTypeChange={handleTypeModification}
        availableCategories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryModification}
      />

      {/* THE THIRD COMPONENT: High-Density Stripe Ledger List Stage */}
      <main className={styles.mainContentStage}>
        <TransactionLedgerGrid
          records={currentPaginatedRowsSubset}
          onEditRecord={handleEditRecordTrigger}
          onDeleteRecord={handleDeleteRecordTrigger}
          selectedIds={selectedRecordIds}
          onToggleSelectRow={handleToggleSingleRowSelection}
          onToggleSelectAllOnPage={handleToggleSelectAllOnPage}
        />
      </main>

      {/* THE FOURTH COMPONENT BLOCK: Rows per page selector & Pagination control */}
      <div className={styles.paginationControlRowDeck}>
        
        <div className={styles.capacitySelectorFlexCluster}>
          <span className={styles.capacityLabelText}>Rows per page:</span>
          <select 
            value={itemsPerPage} 
            onChange={(event) => {
              setItemsPerPage(Number(event.target.value));
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
          totalItems={processedFilteredRecords.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />

      </div>

      {/* THE FIFTH COMPONENT BLOCK: Computed summary totals footer split */}
      <TransactionFooter 
        totalIncome={calculatedIncomeTotal}
        totalExpenses={calculatedExpenseTotal}
      />

      {/* DYNAMIC MODAL OVERLAY BACKDROP LAYER */}
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

      {/* FLOATING ACTION BELT: Triggers rendering instantly when checkboxes fill */}
      <BulkActionToolBelt
        selectedCount={selectedRecordIds.length}
        onClearSelection={handleClearSelectionQueue}
        onBulkDelete={handleBulkDeleteExecution}
      />

    </div>
  );
}
/* === SECTION 4 END === */