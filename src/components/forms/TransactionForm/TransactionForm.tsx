// src/app/(dashboard)/dashboard/transactions/_components/TransactionForm.tsx
/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import {
  useForm,
  useWatch,
  type SubmitHandler,
  type FieldError,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionFormSchema, type TransactionFormValues } from "@/schemas/transactions";
import type { TransactionRecord } from "@/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid";
import styles from "./TransactionForm.module.css";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface TransactionFormProps {
  onAddTransaction: (newTx: TransactionRecord) => void;
  availableCategories: string[];
  initialData?: TransactionRecord | null;
  onCancel?: () => void;
}
/* === SECTION 2 END === */
/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function TransactionForm({
  onAddTransaction,
  availableCategories,
  initialData,
  onCancel,
}: TransactionFormProps) {
  // Flag to indicate edit vs create mode
  const isEditMode = Boolean(initialData);

  // Get active currency from context
  const { currency } = useCurrency();

  // FIXED: Simplified down to a guaranteed clean primitive string instead of an implicit array reference
  const defaultDateString = useMemo(() => {
    return new Date().toISOString().split("T")[0]; // Returns raw "YYYY-MM-DD" string
  }, []);

  // Initialize form with explicitly typed parameters
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema), // FIXED: Removed "as unknown" type mask to let TS infer validation shapes naturally
    mode: "onBlur",
    defaultValues: {
      date: defaultDateString,
      description: "",
      category: "",
      type: "EXPENSE",
      amount: 0,
    },
  });

  // Watch the "type" field to update segmented control UI
  const currentType = useWatch({
    control,
    name: "type",
    defaultValue: "EXPENSE",
  }) as "EXPENSE" | "INCOME";

  // Populate form when initialData changes (edit mode) or reset to defaults (create mode)
  useEffect(() => {
    if (initialData) {
      reset({
        date: initialData.date,
        description: initialData.description,
        category: initialData.category ? initialData.category.toLowerCase() : "",
        type: (initialData.type || "EXPENSE").toUpperCase() as "EXPENSE" | "INCOME",
        amount: initialData.amount,
      });
    } else {
      reset({
        date: defaultDateString, /* FIXED: Explicitly maps a clean string item fallback pointer */
        description: "",
        category: "",
        type: "EXPENSE",
        amount: 0,
      });
    }
  }, [initialData, reset, defaultDateString]);

  // FIXED: Explicitly bounded custom handler interface values to ensure full compatibility with handleSubmit engine
  const onSubmit: SubmitHandler<TransactionFormValues> = useCallback(
    async (data) => {
      try {
        const transactionId = initialData ? initialData.id : `tx-${Date.now()}`;

        const compiledRecord: TransactionRecord = {
          id: transactionId,
          date: data.date,
          description: data.description.trim(),
          category: data.category ? data.category.toLowerCase() : "",
          amount: Number(data.amount),
          type: (data.type || "EXPENSE").toLowerCase() as "income" | "expense",
        };

        onAddTransaction(compiledRecord);

        // Clear form only when creating a new transaction
        if (!initialData) {
          reset({
            date: defaultDateString,
            description: "",
            category: "",
            type: "EXPENSE",
            amount: 0,
          });
        }
      } catch (error) {
        console.error("Failed to save transaction:", error);
      }
    },
    [initialData, onAddTransaction, reset, defaultDateString]
  );

  // Helper to extract error message from FieldError
  const getErrorMessage = (error: FieldError | undefined): string | undefined => {
    if (!error) return undefined;
    return error.message;
  };
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.formCard}>
      <div className={styles.headerArea}>
        <h3 className={styles.formTitle}>
          {isEditMode ? "Modify Transaction Details" : "Create Transaction Entry"}
        </h3>
        <p className={styles.formSubtitle}>
          Log financial cash flows into your accounting ledger books.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formLayout}>
        {/* ROW 1: DATE & CLASSIFICATION */}
        <div className={styles.formRowSideBySide}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="date">
              Posting Date
            </label>
            <input id="date" type="date" className={styles.inputField} {...register("date")} />
            {errors.date && <span className={styles.errorMessage}>{getErrorMessage(errors.date)}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Flow Classification</label>
            <div className={styles.segmentedControl}>
              <button
                type="button"
                className={`${styles.segmentOption} ${
                  currentType === "EXPENSE" ? styles.segmentActiveExpense : ""
                }`}
                onClick={() => setValue("type", "EXPENSE", { shouldValidate: true })}
              >
                Expense
              </button>

              <button
                type="button"
                className={`${styles.segmentOption} ${
                  currentType === "INCOME" ? styles.segmentActiveIncome : ""
                }`}
                onClick={() => setValue("type", "INCOME", { shouldValidate: true })}
              >
                Income
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: DESCRIPTION */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="description">
            Ledger Description
          </label>
          <input
            id="description"
            type="text"
            className={styles.inputField}
            placeholder="e.g., Office Supplies, Client Retainer, Cloud hosting"
            {...register("description")}
          />
          {errors.description && (
            <span className={styles.errorMessage}>{getErrorMessage(errors.description)}</span>
          )}
        </div>

        {/* ROW 3: CATEGORY & AMOUNT */}
        <div className={styles.formRowSideBySide}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="category">
              Category Allocation
            </label>
            <div className={styles.selectWrapper}>
              <select id="category" className={styles.selectField} {...register("category")}>
                <option value="">-- Select Category --</option>
                {availableCategories.map((catName) => (
                  <option key={catName} value={catName.toLowerCase()}>
                    {catName}
                  </option>
                ))}
              </select>
            </div>
            {errors.category && (
              <span className={styles.errorMessage}>{getErrorMessage(errors.category)}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="amount">
              Transaction Value
            </label>
            <div className={styles.currencyInputContainer}>
              <input
                id="amount"
                type="number"
                step="0.01"
                className={styles.inputFieldCurrency}
                placeholder="0.00"
                {...register("amount", { valueAsNumber: true })}
              />
              <span className={styles.currencyBadge}>{currency}</span>
            </div>
            {errors.amount && <span className={styles.errorMessage}>{getErrorMessage(errors.amount)}</span>}
          </div>
        </div>

        {/* BUTTON ACTIONS GROUP */}
        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : isEditMode ? "Commit Changes" : "Record Entry"}
          </button>

          {onCancel && (
            <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
/* === SECTION 4 END === */