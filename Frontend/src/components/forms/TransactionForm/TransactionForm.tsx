// src/components/forms/TransactionForm/TransactionForm.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useCallback, useEffect } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { transactionFormSchema, type TransactionFormValues } from "@/schemas/transactions";
import { Category, Transaction } from "@/utils/api";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./TransactionForm.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface TransactionFormProps {
  onAddTransaction: (payload: {
    originalAmount: number;
    originalCurrency: string;
    baseAmountUSD: number;
    type: string;
    description: string;
    date: string;
    workspaceId: string;
    categoryId: string;
    id?: string;
  }) => Promise<void>;
  availableCategories: Category[];
  initialData?: Transaction | null;
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
  // 🚀 FIXED: Differentiate between a real database record update and an AI receipt pre-fill scan
  const isEditMode = Boolean(initialData && initialData.id);
  const isAiScan = Boolean(initialData && !initialData.id);
  
  const { currency, convertAmount } = useCurrency();
  const defaultDateString = new Date().toISOString().substring(0, 10);

  const resolver = zodResolver(transactionFormSchema) as Resolver<TransactionFormValues>;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver, 
    mode: "onBlur",
    defaultValues: {
      date: defaultDateString,
      description: "",
      category: "",
      type: "EXPENSE",
      amount: 0,
    },
  });

  const currentType = useWatch({
    control,
    name: "type",
    defaultValue: "EXPENSE",
  });

  useEffect(() => {
    if (initialData) {
      const sourceAmount = initialData.originalAmount !== undefined && initialData.originalAmount !== null
        ? Number(initialData.originalAmount)
        : Number(initialData.amount ?? 0);

      const sourceCurrency = initialData.originalCurrency || "USD";
      
      // Convert values flawlessly from receipt currency baseline to user's active workspace view currency
      const displayAmount = convertAmount(sourceAmount, sourceCurrency, currency);

      reset({
        date: new Date(initialData.date).toISOString().substring(0, 10),
        description: initialData.description || "",
        category: initialData.categoryId || "",
        type: (initialData.type || "EXPENSE").toUpperCase() as "EXPENSE" | "INCOME",
        amount: Number(displayAmount.toFixed(2)),
      });
    } else {
      reset({
        date: defaultDateString,
        description: "",
        category: "",
        type: "EXPENSE",
        amount: 0,
      });
    }
  }, [initialData, reset, defaultDateString, convertAmount, currency]);

  const onSubmit = useCallback(
    async (data: TransactionFormValues) => {
      try {
        const originalAmount = Number(data.amount);
        const baseAmountUSD = convertAmount(originalAmount, currency, "USD");

        const payload = {
          originalAmount,
          originalCurrency: currency,
          baseAmountUSD,
          type: data.type.toUpperCase(),
          description: data.description.trim(),
          date: new Date(data.date).toISOString(),
          categoryId: data.category,
          workspaceId: "",
          id: initialData?.id,
        };

        await onAddTransaction(payload);

        if (isEditMode) {
          toast.success("Transaction updated successfully!");
        } else if (isAiScan) {
          toast.success("AI Scanned receipt logged safely!");
        } else {
          toast.success("Transaction recorded successfully!");
          reset({
            date: defaultDateString,
            description: "",
            category: "",
            type: "EXPENSE",
            amount: 0,
          });
        }
      } catch (error: unknown) {
        console.error("Failed to save transaction:", error);
        toast.error("Could not save transaction. Please check your inputs.");
      }
    },
    [initialData, isEditMode, isAiScan, onAddTransaction, reset, defaultDateString, convertAmount, currency]
  );

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.formCard}>
      <div className={styles.headerArea}>
        <h3 className={styles.formTitle}>
          {/* 🚀 FIXED: Dynamic heading titles based on context state */}
          {isEditMode ? "Modify Transaction Details" : isAiScan ? "Verify Scanned Receipt" : "Create Transaction Entry"}
        </h3>
        <p className={styles.formSubtitle}>Log financial cash flows into your accounting ledger.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formLayout}>
        <div className={styles.formRowSideBySide}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="date">Posting Date</label>
            <input id="date" type="date" className={styles.inputField} {...register("date")} />
            {errors.date && <span className={styles.errorMessage}>{errors.date.message}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Flow Classification</label>
            <div className={styles.segmentedControl}>
              <button
                type="button"
                className={`${styles.segmentOption} ${currentType === "EXPENSE" ? styles.segmentActiveExpense : ""}`}
                onClick={() => setValue("type", "EXPENSE", { shouldValidate: true })}
              >
                Expense
              </button>
              <button
                type="button"
                className={`${styles.segmentOption} ${currentType === "INCOME" ? styles.segmentActiveIncome : ""}`}
                onClick={() => setValue("type", "INCOME", { shouldValidate: true })}
              >
                Income
              </button>
            </div>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="description">Ledger Description</label>
          <input
            id="description"
            type="text"
            className={styles.inputField}
            placeholder="e.g., Office Supplies, Client Retainer, Cloud hosting"
            {...register("description")}
          />
          {errors.description && <span className={styles.errorMessage}>{errors.description.message}</span>}
        </div>

        <div className={styles.formRowSideBySide}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="category">Category Allocation</label>
            <div className={styles.selectWrapper}>
              <select id="category" className={styles.selectField} {...register("category")}>
                <option value="">-- Select Category --</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.category && <span className={styles.errorMessage}>{errors.category.message}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="amount">Transaction Value</label>
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
            {errors.amount && <span className={styles.errorMessage}>{errors.amount.message}</span>}
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : isEditMode ? "Commit Changes" : isAiScan ? "Verify & Save" : "Record Entry"}
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