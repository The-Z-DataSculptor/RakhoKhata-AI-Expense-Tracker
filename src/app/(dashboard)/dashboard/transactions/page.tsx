// src/app/(dashboard)/dashboard/transactions/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
// FIXED: Path pointing directly to your local nested component folder layout
import TransactionHeader from "@/components/transactions/TransactionHeader/TransactionHeader";
import TransactionFilterBar, { TransactionTypeFilter } from "@/components/transactions/TransactionFilterBar/TransactionFilterBar";
import TransactionLedgerGrid, { TransactionRecord } from "@/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid";
import TransactionPagination from "@/components/transactions/TransactionPagination/TransactionPagination";
// NEW: Importing your tool belt mass execution component
import BulkActionToolBelt from "@/components/transactions/BulkActionToolBelt/BulkActionToolBelt";
// NEW: Importing the dedicated transaction analytical footer layout block
import TransactionFooter from "@/components/transactions/TransactionFooter/TransactionFooter";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
// No external properties needed for root-level engine page routes.
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function TransactionsPage() {
  /* --- STATE MANAGEMENT ENGINES --- */
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<TransactionTypeFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  // UPDATED: Added modifier function to state variable to allow dynamic on-screen changes
  const [itemsPerPage, setItemsPerPage] = useState<number>(10); 

  // NEW STATE ENGINE: Array tracking IDs currently checked on screen
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  // System categories to populate filter tool belt option panels
  const [categories] = useState<string[]>([
    "Salary",
    "Freelance",
    "Groceries",
    "Utilities",
    "Investments",
    "Marketing"
  ]);

  // Production mock tracking record entries containing localized real value configurations
  const [rawRecords, setRawRecords] = useState<TransactionRecord[]>([
    { id: "tx-101", date: "2026-06-12", description: "Monthly Corporate Base Salary Emolument", category: "salary", amount: 185000, type: "income" },
    { id: "tx-102", date: "2026-06-11", description: "Alpha Centauri Green Groceries Bazaar Store", category: "groceries", amount: 14200, type: "expense" },
    { id: "tx-103", date: "2026-06-10", description: "Full-Stack Web App Development Milestone UI Contract", category: "freelance", amount: 65000, type: "income" },
    { id: "tx-104", date: "2026-06-08", description: "Sui Northern Gas Pipeline Bill Settlement", category: "utilities", amount: 8400, type: "expense" },
    { id: "tx-105", date: "2026-06-05", description: "Meta Platform Ads Campaign Conversions Growth Run", category: "marketing", amount: 32000, type: "expense" },
    { id: "tx-106", date: "2026-06-02", description: "PSX Index Dividend Payout Yield Release", category: "investments", amount: 12500, type: "income" },
  ]);

  /* --- NEW: SELECTION UTILITY MODIFIERS --- */
  const handleToggleSingleRowSelection = (targetId: string) => {
    setSelectedRecordIds((currentSelectedList) => {
      if (currentSelectedList.includes(targetId)) {
        // If already checked, filter out to remove selection highlight
        return currentSelectedList.filter(id => id !== targetId);
      } else {
        // Append into active selection list stack
        return [...currentSelectedList, targetId];
      }
    });
  };

  const handleToggleSelectAllOnPage = (visiblePageIds: string[]) => {
    setSelectedRecordIds((currentSelectedList) => {
      // If every item on the current page is already checked, uncheck all of them
      const isAllOnPageChecked = visiblePageIds.every(id => currentSelectedList.includes(id));
      
      if (isAllOnPageChecked) {
        return currentSelectedList.filter(id => !visiblePageIds.includes(id));
      } else {
        // Union merge arrays safely preventing duplicate keys using a Set constructor
        return Array.from(new Set([...currentSelectedList, ...visiblePageIds]));
      }
    });
  };

  const handleClearSelectionQueue = () => {
    setSelectedRecordIds([]);
  };

  /* --- INTERACTIVE ACTION CALLBACK TRIPPERS --- */
  const handleOpenTransactionDrawer = () => {
    console.log("Transaction operational form drawer triggered safely.");
    // Operational slide modal hook initialization will bind here next!
  };

  const handleEditRecordTrigger = (targetRecordId: string) => {
    console.log(`Modify request sequence activated for id entity node: ${targetRecordId}`);
  };

  const handleDeleteRecordTrigger = (targetRecordId: string) => {
    console.log(`Removal pipeline engaged for data node asset: ${targetRecordId}`);
    setRawRecords(currentRows => currentRows.filter(item => item.id !== targetRecordId));
    // Clean selection tracking buffer alongside deletion mechanics safely
    setSelectedRecordIds(currentSelected => currentSelected.filter(id => id !== targetRecordId));
    // Safe index fallback modifier to prevent view context crashing if tail index pages turn empty
    setCurrentPage(1);
  };

  // NEW MASS EXECUTION PIPELINE ROUTINE:
  const handleBulkDeleteExecution = () => {
    console.log(`Mass purging matching record nodes from state storage:`, selectedRecordIds);
    // Remove all records matching any identifier stored inside the checked state registry array
    setRawRecords(currentRows => currentRows.filter(row => !selectedRecordIds.includes(row.id)));
    // Flush the tracking selection buffer clear
    setSelectedRecordIds([]);
    setCurrentPage(1);
  };

  // Helper functions to reset back to index view 1 when filter search mutations occur
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
    // 1. Text Search verification check matching description parameters or identifier keys
    const normalQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = normalQuery === "" || singleLog.description.toLowerCase().includes(normalQuery);

    // 2. Financial Type condition matching (Income vs Expense splits)
    const matchesType = selectedType === "all" || singleLog.type === selectedType;

    // 3. Structural category grouping validation matches
    const matchesCategory = selectedCategory === "all" || singleLog.category.toLowerCase() === selectedCategory.toLowerCase();

    // The ledger record must pass all three logic parameters cleanly to render on screen
    return matchesSearch && matchesType && matchesCategory;
  });

  /* --- LIVE CALCULATIONS SUMS ENGINE --- */
  // Initialize baseline total counters at zero for calculation tracking loops
  let calculatedIncomeTotal = 0;
  let calculatedExpenseTotal = 0;

  // Run a beginner-friendly loop across filtered rows to calculate aggregates automatically
  processedFilteredRecords.forEach((recordItem) => {
    if (recordItem.type === "income") {
      calculatedIncomeTotal += recordItem.amount;
    } else if (recordItem.type === "expense") {
      calculatedExpenseTotal += recordItem.amount;
    }
  });

  // PAGINATION COMPUTATION ACTION: Slicing only our dedicated view windows
  const indexPositionOfLastRowItem = currentPage * itemsPerPage;
  const indexPositionOfFirstRowItem = indexPositionOfLastRowItem - itemsPerPage;
  const currentPaginatedRowsSubset = processedFilteredRecords.slice(indexPositionOfFirstRowItem, indexPositionOfLastRowItem);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.ledgerCanvasWrapper}>
      
      {/* THE FIRST COMPONENT: Premium high-end floating segmented glass header layout */}
      <TransactionHeader 
        totalCount={processedFilteredRecords.length}
        onAddTransactionClick={handleOpenTransactionDrawer}
      />

      {/* THE SECOND COMPONENT: Stateful data search, toggle bars, and picker lists */}
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

      {/* THE FOURTH COMPONENT BLOCK: Dynamic Row Select & Footer Switches Grouping */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        {/* INTERACTIVE ROWS CAPACITY SELECTOR */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", justifyContent: "flex-end" }}>
          <span style={{ color: "var(--text-secondary, #4e4a6b)", fontWeight: "600" }}>Rows per page:</span>
          <select 
            value={itemsPerPage} 
            onChange={(event) => {
              setItemsPerPage(Number(event.target.value));
              setCurrentPage(1); // Safely bounce back to page 1 to protect slice index calculation boundaries
            }}
            style={{
              padding: "0.3rem 0.6rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color, #e5e1f4)",
              backgroundColor: "var(--bg-surface, #ffffff)",
              color: "var(--text-primary, #10043f)",
              fontWeight: "700",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Item range tracker and indicators */}
        <TransactionPagination
          totalItems={processedFilteredRecords.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />

      </div>

      {/* THE FIFTH COMPONENT BLOCK: Passing down computed summaries live into layout streams */}
      <TransactionFooter 
        totalIncome={calculatedIncomeTotal}
        totalExpenses={calculatedExpenseTotal}
      />

      {/* NEW STANDALONE FLOATING BELT DECK: Triggers rendering instantly when checkbox arrays fill */}
      <BulkActionToolBelt
        selectedCount={selectedRecordIds.length}
        onClearSelection={handleClearSelectionQueue}
        onBulkDelete={handleBulkDeleteExecution}
      />

    </div>
  );
}
/* === SECTION 4 END === */