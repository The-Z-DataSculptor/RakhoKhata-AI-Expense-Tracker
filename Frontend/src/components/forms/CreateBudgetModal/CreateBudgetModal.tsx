// src/components/forms/CreateBudgetModal/CreateBudgetModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { toast } from "sonner";
import { Category as ApiCategory } from "@/utils/api";
import styles from "./CreateBudgetModal.module.css";

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

const getCurrentMonthRange = (): { start: string; end: string } => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const formatLocalIso = (y: number, m: number, d: number): string => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  const startStr = formatLocalIso(year, month, 1);
  const lastDayNum = new Date(year, month + 1, 0).getDate();
  const endStr = formatLocalIso(year, month, lastDayNum);

  return { start: startStr, end: endStr };
};

export function CreateBudgetModal({ isOpen, onClose, onSubmit, categories, initialData }: CreateBudgetModalProps) {
  const { currency, convertAmount } = useCurrency();

  const [categoryName, setCategoryName] = useState<string>("");
  const [limitAmount, setLimitAmount] = useState<string>("");
  const [isCustomPeriod, setIsCustomPeriod] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);
  const [prevInitialData, setPrevInitialData] = useState<typeof initialData>(initialData);

  // Synchronize form state when props change (React 19 compatible)
  if (isOpen !== prevIsOpen || initialData !== prevInitialData) {
    setPrevIsOpen(isOpen);
    setPrevInitialData(initialData);

    if (isOpen) {
      if (initialData) {
        setCategoryName(initialData.categoryName || "");
        // ✅ FIX: Stored amount is already in workspace currency – no conversion.
        const rawAmount = Number(initialData.limitAmount || 0);
        setLimitAmount(rawAmount > 0 ? rawAmount.toFixed(2) : "");
        setStartDate(initialData.startDate ? initialData.startDate.split("T")[0] : "");
        setEndDate(initialData.endDate ? initialData.endDate.split("T")[0] : "");
        setIsCustomPeriod(true);
      } else {
        const range = getCurrentMonthRange();
        setCategoryName("");
        setLimitAmount("");
        setIsCustomPeriod(false);
        setStartDate(range.start);
        setEndDate(range.end);
      }
    }
  }

  const handleClose = useCallback(() => {
    setCategoryName("");
    setLimitAmount("");
    setIsCustomPeriod(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedAmount = limitAmount.trim();
    if (!categoryName || !sanitizedAmount) {
      toast.error("Please fill out all required form fields.");
      return;
    }

    if (isCustomPeriod && startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot occur after end date.");
      return;
    }

    try {
      const originalAmount = parseFloat(sanitizedAmount);
      
      if (isNaN(originalAmount) || originalAmount <= 0) {
        toast.error("Please enter a valid positive budget limit.");
        return;
      }

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
      
      handleClose();
    } catch (error: unknown) {
      console.error("Failed to submit budget limit:", error);
      toast.error("Could not allocate budget limit.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose} role="dialog" aria-modal="true">
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{initialData ? "Edit Budget Settings" : "Create Budget Environment"}</h2>
          <button 
            type="button" 
            className={styles.closeButton} 
            onClick={handleClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleFormSubmission} className={styles.formBody} noValidate>
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
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({cat.type})
                  </option>
                ))
              ) : (
                <option value="" disabled>No categories registered in workspace</option>
              )}
            </select>
          </div>

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

          <div className={styles.toggleRow}>
            <div className={styles.toggleText}>
              <span className={styles.toggleTitle}>Set Custom Dates</span>
              <p className={styles.toggleDescription}>Manually select custom tracking dates</p>
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