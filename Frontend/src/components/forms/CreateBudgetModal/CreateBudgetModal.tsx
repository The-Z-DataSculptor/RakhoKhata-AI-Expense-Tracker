// src/components/forms/CreateBudgetModal/CreateBudgetModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { toast } from "sonner";
import { Category as ApiCategory } from "@/utils/api";
import styles from "./CreateBudgetModal.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */
export interface NewBudgetFormData {
  originalAmount: number;
  originalCurrency: string;
  baseAmountUSD: number;
  categoryName: string;
  startDate: string;
  endDate: string;
  isCustomPeriod: boolean;
}

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewBudgetFormData) => void;
  categories: ApiCategory[];
  initialData?: {
    id: string;
    categoryName: string;
    limitAmount: number;
    startDate: string;
    endDate: string;
  } | null;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */
export function CreateBudgetModal({ isOpen, onClose, onSubmit, categories, initialData }: CreateBudgetModalProps) {
  const { currency, convertAmount } = useCurrency();

  // --- LOCAL INPUT ENGINE INITIAL STATES ---
  const [categoryName, setCategoryName] = useState<string>("");
  const [limitAmount, setLimitAmount] = useState<string>("");
  const [isCustomPeriod, setIsCustomPeriod] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  /**
   * Utility helper function: Derives calendar parameters for the active month block.
   * Outputs explicit ISO format strings (YYYY-MM-DD).
   */
  const getCurrentMonthRange = (): { start: string; end: string } => {
    const today = new Date();
    const activeYear = today.getFullYear();
    const activeMonth = today.getMonth();
    
    const firstDay = new Date(activeYear, activeMonth, 1);
    const lastDay = new Date(activeYear, activeMonth + 1, 0);
    
    const formatIsoDate = (dateObject: Date) => dateObject.toISOString().split("T")[0];
    return { start: formatIsoDate(firstDay), end: formatIsoDate(lastDay) };
  };

  // Synchronize state contexts safely when incoming parameters fluctuate
  useEffect(() => {
    if (!isOpen) return;

    const stateLoadTimerId = setTimeout(() => {
      const currentMonthBoundaries = getCurrentMonthRange();

      if (initialData) {
        // Edit mode synchronization routine maps base currency values back to the active screen layer
        setCategoryName(initialData.categoryName);
        const dynamicDisplayAmount = convertAmount(initialData.limitAmount, "USD", currency);
        setLimitAmount(dynamicDisplayAmount.toFixed(2));
        setStartDate(initialData.startDate.split("T")[0]);
        setEndDate(initialData.endDate.split("T")[0]);
        setIsCustomPeriod(true);
      } else {
        // Clear inputs safely to maintain data isolation integrity across workspace swaps
        setCategoryName("");
        setLimitAmount("");
        setIsCustomPeriod(false);
        setStartDate(currentMonthBoundaries.start);
        setEndDate(currentMonthBoundaries.end);
      }
    }, 0);

    // Lifecycle clean-up routine terminates execution threads if the form drops from layout visibility
    return () => clearTimeout(stateLoadTimerId);
  }, [isOpen, initialData, currency, convertAmount]);

  /** Shuts down the view frame overlay while cleaning input remnants */
  const handleClose = () => {
    setCategoryName("");
    setLimitAmount("");
    setIsCustomPeriod(false);
    onClose();
  };

  /** Validates boundary limits and commits the transaction parameters down the handler pipe */
  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedAmount = limitAmount.trim();
    if (!categoryName || !sanitizedAmount) {
      toast.error("Please fill out all required form fields before submitting.");
      return;
    }

    try {
      const originalAmount = parseFloat(sanitizedAmount);
      
      if (isNaN(originalAmount) || originalAmount <= 0) {
        toast.error("Please allocate a valid positive number for your budget limit.");
        return;
      }

      // Compute standard baseline values for remote PostgreSQL currency structure constraints
      const baseAmountUSD = convertAmount(originalAmount, currency, "USD");

      onSubmit({
        originalAmount,
        originalCurrency: currency,
        baseAmountUSD,
        categoryName,
        startDate,
        endDate,
        isCustomPeriod,
      });
      
      handleClose(); // Terminate view parameters cleanly upon processing success
    } catch (error: unknown) {
      console.error("Failed to secure budget metrics setup:", error);
      toast.error("Could not allocate budget limit safely. Verify your text inputs.");
    }
  };

  // Prevent components from dropping dead DOM footprints onto screen spaces if closed
  if (!isOpen) return null;
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPORTS / RENDER COMPONENT ===
   ========================================================================== */
  return (
    <div className={styles.modalOverlay} onClick={handleClose} role="dialog" aria-modal="true">
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{initialData ? "Edit Budget Settings" : "Create Budget Environment"}</h2>
          <button 
            type="button" 
            className={styles.closeButton} 
            onClick={handleClose}
            aria-label="Close dialog layout framework view"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleFormSubmission} className={styles.formBody} noValidate>
          {/* FIELD 1: WORKSPACE CATEGORY SELECTION DROPDOWN */}
          <div className={styles.formGroup}>
            <label htmlFor="budgetCategorySelect" className={styles.formLabel}>Select Workspace Category</label>
            <select
              id="budgetCategorySelect"
              required
              className={styles.inputField}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            >
              <option value="" disabled hidden>-- Choose a Category --</option>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({cat.type})
                  </option>
                ))
              ) : (
                <option value="" disabled>No categories registered in this workspace environment</option>
              )}
            </select>
          </div>

          {/* FIELD 2: BUDGET LIMIT NUMERIC INPUT */}
          <div className={styles.formGroup}>
            <label htmlFor="budgetLimitInput" className={styles.formLabel}>Budget Limit Target</label>
            <div className={styles.currencyInputWrapper}>
              <span className={styles.currencySymbol}>{currency}</span>
              <input
                id="budgetLimitInput"
                type="number"
                required
                min="0.01"
                max={99999999}
                step="0.01"
                placeholder="0.00"
                className={styles.inputFieldWithPrefix}
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
              />
            </div>
          </div>

          {/* FIELD 3: DYNAMIC TIMELINE CUSTOMIZATION SLIDER CONTROLS */}
          <div className={styles.toggleRow}>
            <div className={styles.toggleText}>
              <span className={styles.toggleTitle}>Set Custom Dates</span>
              <p className={styles.toggleDescription}>Manually select custom tracking dates for this budget</p>
            </div>
            <label className={styles.switchLabel}>
              <input
                type="checkbox"
                className={styles.hiddenCheckbox}
                checked={isCustomPeriod}
                onChange={(e) => setIsCustomPeriod(e.target.checked)}
              />
              <span className={styles.switchSlider} />
            </label>
          </div>

          {/* HIDDEN DRAWER FIELD CONTAINER GRID: Toggles view properties on checkbox changes */}
          <div className={`${styles.dateSectionContainer} ${isCustomPeriod ? styles.showDateSection : ""}`}>
            <div className={styles.dateGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="budgetStartDate" className={styles.formLabel}>Start Date</label>
                <input
                  id="budgetStartDate"
                  type="date"
                  disabled={!isCustomPeriod}
                  className={styles.inputField}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="budgetEndDate" className={styles.formLabel}>End Date</label>
                <input
                  id="budgetEndDate"
                  type="date"
                  disabled={!isCustomPeriod}
                  className={styles.inputField}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* FORM ACTIONS CONTROL FOOTER */}
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              {initialData ? "Save Changes" : "Create Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
/* === SECTION 4 END === */