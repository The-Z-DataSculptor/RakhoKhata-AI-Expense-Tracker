// src/components/forms/CreateBudgetModal/CreateBudgetModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { toast } from "sonner";
import { Category as ApiCategory } from "@/utils/api";
import styles from "./CreateBudgetModal.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
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
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function CreateBudgetModal({ isOpen, onClose, onSubmit, categories, initialData }: CreateBudgetModalProps) {
  const { currency, convertAmount } = useCurrency();

  const [categoryName, setCategoryName] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Helper: Get first and last day of the current month in YYYY-MM-DD format
  const getCurrentMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    return { start: formatDate(firstDay), end: formatDate(lastDay) };
  };

  useEffect(() => {
    if (!isOpen) return;

    const timerId = setTimeout(() => {
      const monthRange = getCurrentMonthRange();

      if (initialData) {
        setCategoryName(initialData.categoryName);
        const displayAmount = convertAmount(initialData.limitAmount, "USD", currency);
        setLimitAmount(displayAmount.toFixed(2));
        setStartDate(initialData.startDate.split("T")[0]);
        setEndDate(initialData.endDate.split("T")[0]);
        setIsCustomPeriod(true);
      } else {
        // 👇 FIXED: Use 1st and last day of current month
        setCategoryName("");
        setLimitAmount("");
        setIsCustomPeriod(false);
        setStartDate(monthRange.start);
        setEndDate(monthRange.end);
      }
    }, 0);

    return () => clearTimeout(timerId);
  }, [isOpen, initialData, currency, convertAmount]);

  const handleClose = () => {
    setCategoryName("");
    setLimitAmount("");
    setIsCustomPeriod(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName || !limitAmount) return;

    try {
      const originalAmount = parseFloat(limitAmount);
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
    } catch (error) {
      console.error("Failed to secure budget metrics setup:", error);
      toast.error("Could not allocate budget limit safely. Verify numeric values.");
    }
  };

  if (!isOpen) return null;

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{initialData ? "Edit Budget" : "Create Budget"}</h2>
          <button type="button" className={styles.closeButton} onClick={handleClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.formBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Select Workspace Category</label>
            <select
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
                <option value="" disabled>No categories found</option>
              )}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Budget Limit</label>
            <div className={styles.currencyInputWrapper}>
              <span className={styles.currencySymbol}>{currency}</span>
              <input
                type="number"
                required
                min="0.01"
                step="any"
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

          <div className={`${styles.dateSectionContainer} ${isCustomPeriod ? styles.showDateSection : ""}`}>
            <div className={styles.dateGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Start Date</label>
                <input
                  type="date"
                  className={styles.inputField}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>End Date</label>
                <input
                  type="date"
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
/* === SECTION 4 END === */