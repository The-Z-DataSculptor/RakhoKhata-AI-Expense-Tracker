// src/components/forms/CreateBudgetModal/CreateBudgetModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { toast } from "sonner"; // NEW: Imported the global notification engine hook
import styles from "./CreateBudgetModal.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewBudgetFormData) => void;
}

export interface NewBudgetFormData {
  categoryName: string;
  limitAmount: number;
  startDate: string;
  endDate: string;
  isCustomPeriod: boolean;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function CreateBudgetModal({ isOpen, onClose, onSubmit }: CreateBudgetModalProps) {
  // Pull currency type string and safe data converters from global context state
  const { currency, convertAmount } = useCurrency();

  // Form input fields state
  const [categoryName, setCategoryName] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Set automatic default dates (Starts today, ends 30 days from now)
  useEffect(() => {
    if (!isOpen) return;

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    const id = window.setTimeout(() => {
      setStartDate(formatDate(today));
      setEndDate(formatDate(futureDate));
    }, 0);

    return () => clearTimeout(id);
  }, [isOpen]);

  // Reset all input fields when closing the modal
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
      const rawEnteredValue = parseFloat(limitAmount);

      // Convert the input value from the ACTIVE view currency back to baseline PKR units 
      // to ensure database arrays store uniform telemetry values.
      const normalizedBaseAmount = convertAmount(rawEnteredValue, currency, "PKR");

      onSubmit({
        categoryName,
        limitAmount: normalizedBaseAmount,
        startDate,
        endDate,
        isCustomPeriod,
      });

      // NEW: Trigger micro-feedback message to instantly confirm budget metrics generation
      toast.success("Budget limit established successfully!");
      
      handleClose();
    } catch (error) {
      console.error("Failed to secure budget metrics setup:", error);
      // NEW: Safeguard error notice if calculations fail
      toast.error("Could not allocate budget limit safely. Verify numeric values.");
    }
  };

  if (!isOpen) return null;
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* Header Section */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create Budget</h2>
          <button type="button" className={styles.closeButton} onClick={handleClose}>
            &times;
          </button>
        </div>

        {/* Form Body Section */}
        <form onSubmit={handleSubmit} className={styles.formBody}>
          
          {/* Input: Category Name */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Marketing Ads, Cloud Servers"
              className={styles.inputField}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>

          {/* Input: Budget Limit Amount */}
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

          {/* Toggle Switch: Custom Dates Option */}
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

          {/* Collapsible Section: Date Inputs */}
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

          {/* Footer Section: Action Buttons */}
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Create Budget
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
/* === SECTION 4 END === */