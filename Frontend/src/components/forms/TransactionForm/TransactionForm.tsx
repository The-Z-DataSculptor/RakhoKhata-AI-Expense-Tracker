// src/components/forms/TransactionForm/TransactionForm.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { transactionFormSchema, type TransactionFormValues } from "@/schemas/transactions";
import { Category, Transaction, categoryService } from "@/utils/api";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { CategoryForm } from "@/components/forms/CategoryForm/CategoryForm";
import { type CategoryRecord } from "@/app/(dashboard)/dashboard/categories/page";
import styles from "./TransactionForm.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */
interface TransactionSubmissionPayload {
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

interface TransactionFormProps {
  onAddTransaction: (payload: TransactionSubmissionPayload) => Promise<void>;
  availableCategories: Category[];
  initialData?: Transaction | null;
  onCancel?: () => void;
  workspaceId: string; 
  onCategoryCreate?: (newCategory: CategoryRecord) => void;
}

// WHY THIS FIX WAS MADE: Safely converts date inputs to ISO strings without throwing RangeError on malformed inputs.
const safeFormatIsoDate = (rawDate?: string | Date | null): string => {
  if (!rawDate) return new Date().toISOString().substring(0, 10);
  const parsedDate = new Date(rawDate);
  return isNaN(parsedDate.getTime()) 
    ? new Date().toISOString().substring(0, 10) 
    : parsedDate.toISOString().substring(0, 10);
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */
export function TransactionForm({
  onAddTransaction,
  availableCategories,
  initialData,
  onCancel,
  workspaceId,
  onCategoryCreate,
}: TransactionFormProps) {
  const isEditMode = Boolean(initialData && initialData.id);
  const isAiScan = Boolean(initialData && !initialData.id);
  
  const { currency, convertAmount } = useCurrency();
  const defaultDateString = safeFormatIsoDate();
  const resolver = zodResolver(transactionFormSchema) as Resolver<TransactionFormValues>;

  const [createdCategories, setCreatedCategories] = useState<CategoryRecord[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // WHY THIS FIX WAS MADE: Deduplicates available and newly created categories by ID to prevent
  // duplicate key collision warnings and UI flickering in React renders.
  const categoriesList = useMemo(() => {
    const combined = [...(Array.isArray(availableCategories) ? availableCategories : []), ...createdCategories];
    const uniqueMap = new Map<string, Category | CategoryRecord>();
    combined.forEach((cat) => {
      if (cat.id) uniqueMap.set(cat.id, cat);
    });
    return Array.from(uniqueMap.values());
  }, [availableCategories, createdCategories]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
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

  const categoryRegister = register("category");

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
      const displayAmount = convertAmount(sourceAmount, sourceCurrency, currency);

      reset({
        date: safeFormatIsoDate(initialData.date),
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

  const handleCategoryCreated = async (newCat: CategoryRecord) => {
    try {
      const uppercaseCategoryType = newCat.type.toUpperCase() as "INCOME" | "EXPENSE" | "BOTH";

      const response = await categoryService.create({
        name: newCat.name,
        type: uppercaseCategoryType,
        workspaceId: workspaceId,
        color: newCat.accentColor || "#613BBF",
        isFixed: false,
        isRecurring: newCat.isRecurring ?? false,
        frequency: newCat.frequency ?? null,
        dueDay: newCat.dueDay ?? null,
        reminderDays: newCat.reminderDays ?? null,
      });

      const realDbId = (response as { category?: { id: string }; id?: string }).category?.id 
        || (response as { id?: string }).id 
        || newCat.id;

      const persistedCategoryRecord: CategoryRecord = {
        ...newCat,
        id: realDbId,
        workspaceId: workspaceId,
      };

      setCreatedCategories((prev) => [...prev, persistedCategoryRecord]);
      setValue("category", realDbId, { shouldValidate: true });

      if (onCategoryCreate) {
        onCategoryCreate(persistedCategoryRecord);
      }

      setIsCategoryModalOpen(false);
      toast.success(`Category "${newCat.name}" saved successfully!`);
    } catch (error: unknown) {
      console.error("Failed to save category to backend:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to persist category.";
      toast.error(`Could not create category: ${errorMsg}`);
    }
  };

  const onSubmit = useCallback(
    async (data: TransactionFormValues) => {
      try {
        const originalAmount = Number(data.amount);
        const baseAmountUSD = convertAmount(originalAmount, currency, "USD");

        const payload: TransactionSubmissionPayload = {
          originalAmount,
          originalCurrency: currency,
          baseAmountUSD,
          type: data.type.toUpperCase(),
          description: data.description.trim(),
          date: safeFormatIsoDate(data.date),
          categoryId: data.category,
          workspaceId: workspaceId,
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
        console.error("Failed to save transaction workflow:", error);
        toast.error("Could not save transaction. Please check your network parameters.");
      }
    },
    [initialData, isEditMode, isAiScan, onAddTransaction, reset, defaultDateString, convertAmount, currency, workspaceId]
  );
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: EXPORTS / RENDER COMPONENT ===
     ========================================================================== */
  return (
    <>
      <div className={styles.formCard}>
        <div className={styles.headerArea}>
          <h3 className={styles.formTitle}>
            {isEditMode ? "Modify Transaction Details" : isAiScan ? "Verify Scanned Receipt" : "Create Transaction Entry"}
          </h3>
          <p className={styles.formSubtitle}>Log financial cash flows into your accounting ledger.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.formLayout} noValidate>
          <div className={styles.formRowSideBySide}>
            {/* POSTING DATE FIELD */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="date">Transaction Date</label>
              <input 
                id="date" 
                type="date" 
                className={styles.inputField} 
                {...register("date")} 
              />
              {errors.date && <span className={styles.errorMessage}>{errors.date.message}</span>}
            </div>

            {/* FLOW CLASSIFICATION SEGMENTED CONTROLS */}
            <div className={styles.fieldGroup}>
              <span className={styles.label}>Flow Classification</span>
              <div className={styles.segmentedControl}>
                <label 
                  className={`${styles.segmentOption} ${currentType === "EXPENSE" ? styles.segmentActiveExpense : ""}`}
                >
                  <input 
                    type="radio"
                    value="EXPENSE"
                    {...register("type")}
                    className={styles.hiddenRadioControl}
                  />
                  Expense
                </label>
                <label 
                  className={`${styles.segmentOption} ${currentType === "INCOME" ? styles.segmentActiveIncome : ""}`}
                >
                  <input 
                    type="radio"
                    value="INCOME"
                    {...register("type")}
                    className={styles.hiddenRadioControl}
                  />
                  Income
                </label>
              </div>
            </div>
          </div>

          {/* LEDGER DESCRIPTION FIELD */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="description">Ledger Description</label>
            <input
              id="description"
              type="text"
              className={styles.inputField}
              placeholder="e.g., Office Supplies, Client Retainer, Cloud hosting"
              maxLength={120}
              {...register("description")}
            />
            {errors.description && <span className={styles.errorMessage}>{errors.description.message}</span>}
          </div>

          <div className={styles.formRowSideBySide}>
            {/* CATEGORY ALLOCATION DROPDOWN */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="category">Category Allocation</label>

              <div className={styles.selectWrapper}>
                <select 
                  id="category" 
                  className={styles.selectField} 
                  {...categoryRegister}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW_CATEGORY__") {
                      setIsCategoryModalOpen(true);
                      setValue("category", "", { shouldValidate: false });
                      return;
                    }
                    categoryRegister.onChange(e);
                  }}
                >
                  <option value="">-- Select Category --</option>
                  <optgroup label="Actions">
                    <option value="__ADD_NEW_CATEGORY__">➕ Create New Category...</option>
                  </optgroup>
                  <optgroup label="Available Categories">
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              {errors.category && <span className={styles.errorMessage}>{errors.category.message}</span>}
            </div>

            {/* TRANSACTION VALUE NUMERIC INPUT */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="amount">Transaction Value</label>
              <div className={styles.currencyInputContainer}>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.00"
                  max={99999999}
                  className={styles.inputFieldCurrency}
                  placeholder="0.00"
                  {...register("amount", { valueAsNumber: true })}
                />
                <span className={styles.currencyBadge}>{currency}</span>
              </div>
              {errors.amount && <span className={styles.errorMessage}>{errors.amount.message}</span>}
            </div>
          </div>

          {/* INTERACTION TRIGGERS ACTION ROW */}
          <div className={styles.buttonGroup}>
            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : isEditMode ? "Commit Changes" : isAiScan ? "Verify & Save" : "Record Entry"}
            </button>
            {onCancel && (
              <button 
                type="button" 
                className={styles.cancelBtn} 
                onClick={onCancel} 
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* OVERLAY MODAL FOR CREATING A NEW CATEGORY */}
      {isCategoryModalOpen && (
        <div 
          className={styles.categoryModalOverlay} 
          onClick={() => setIsCategoryModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className={styles.categoryModalContent} 
            onClick={(e) => e.stopPropagation()}
          >
            <CategoryForm
              onAddCategory={handleCategoryCreated}
              onCancel={() => setIsCategoryModalOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
/* === SECTION 4 END === */