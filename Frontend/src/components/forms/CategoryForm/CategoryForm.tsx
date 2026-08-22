// src/components/forms/CategoryForm/CategoryForm.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, { useEffect, useCallback } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { categoryFormSchema, type CategoryFormValues } from "@/schemas/categories";
import { type CategoryRecord } from "@/app/(dashboard)/dashboard/categories/page";
import styles from "./CategoryForm.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */
interface CategoryFormProps {
  onAddCategory: (newCategory: CategoryRecord) => void;
  initialData?: CategoryRecord | null;
  onCancel?: () => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */
export function CategoryForm({ onAddCategory, initialData, onCancel }: CategoryFormProps) {
  const isEditMode = Boolean(initialData);

  const resolver = zodResolver(categoryFormSchema) as Resolver<CategoryFormValues>;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver, 
    mode: "onBlur",
    defaultValues: {
      name: "",
      type: "EXPENSE",
      color: "#613BBF",
      isRecurring: false,
      frequency: "MONTHLY",
      dueDay: 1,
      reminderDays: 3,
    },
  });

  const activeColor = useWatch({ control, name: "color", defaultValue: "#613BBF" });
  const isRecurring = useWatch({ control, name: "isRecurring", defaultValue: false });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        type: initialData.type.toUpperCase() as "INCOME" | "EXPENSE" | "BOTH",
        color: initialData.accentColor,
        isRecurring: initialData.isRecurring || false,
        frequency: (initialData.frequency as "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY") || "MONTHLY",
        dueDay: initialData.dueDay !== undefined && initialData.dueDay !== null ? initialData.dueDay : 1,
        reminderDays: initialData.reminderDays !== undefined && initialData.reminderDays !== null ? initialData.reminderDays : 3,
      });
    } else {
      reset({
        name: "",
        type: "EXPENSE",
        color: "#613BBF",
        isRecurring: false,
        frequency: "MONTHLY",
        dueDay: 1,
        reminderDays: 3,
      });
    }
  }, [initialData, reset]);

  const onSubmit = useCallback(
    async (data: CategoryFormValues) => {
      try {
        const lowerCaseType = data.type.toLowerCase() as "income" | "expense" | "both";

        const generatedId = initialData?.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

        const completeCategoryRecord: CategoryRecord = {
          id: generatedId,
          name: data.name.trim(),
          type: lowerCaseType,
          iconSlug: lowerCaseType === "income" ? "FiBriefcase" : "FiShoppingCart",
          accentColor: data.color,
          transactionCount: initialData ? initialData.transactionCount : 0,
          workspaceId: initialData ? initialData.workspaceId : "active-workspace",
          isRecurring: data.isRecurring || false,
          frequency: data.frequency || "MONTHLY",
          dueDay: data.dueDay !== undefined && data.dueDay !== null ? data.dueDay : 1,
          reminderDays: data.reminderDays !== undefined && data.reminderDays !== null ? data.reminderDays : 3,
        };

        onAddCategory(completeCategoryRecord);

        if (initialData) {
          toast.success("Category changes saved successfully!");
        } else {
          toast.success("Custom category added!");
          reset({
            name: "",
            type: "EXPENSE",
            color: "#613BBF",
            isRecurring: false,
            frequency: "MONTHLY",
            dueDay: 1,
            reminderDays: 3,
          });
        }
      } catch (error: unknown) {
        console.error("Category submission error:", error);
        const detailedMessage = error instanceof Error ? error.message : "Could not save category.";
        toast.error(detailedMessage);
      }
    },
    [initialData, onAddCategory, reset]
  );

  return (
    <div className={styles.formCard}>
      <h3 className={styles.formTitle}>
        {isEditMode ? `Edit Category: ${initialData?.name}` : "Create New Category"}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formLayout} noValidate>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="categoryNameInput">Category Name</label>
          <input
            id="categoryNameInput"
            type="text"
            className={styles.inputField}
            placeholder="e.g., Groceries, Rent, Salary"
            maxLength={40}
            disabled={isSubmitting}
            {...register("name")}
          />
          {errors.name && <span className={styles.errorMessage}>{errors.name.message}</span>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="categoryTypeSelect">Transaction Type</label>
          <select 
            id="categoryTypeSelect" 
            className={styles.selectField} 
            disabled={isSubmitting}
            {...register("type")}
          >
            <option value="EXPENSE">Expense (Money Out)</option>
            <option value="INCOME">Income (Money In)</option>
            <option value="BOTH">Both (Income & Expense)</option>
          </select>
          {errors.type && <span className={styles.errorMessage}>{errors.type.message}</span>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="categoryColorPicker">Category Color Badge</label>
          <div className={styles.colorPickerWrapper}>
            <input
              id="categoryColorPicker"
              type="color"
              className={styles.colorInput}
              value={activeColor}
              disabled={isSubmitting}
              onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })}
            />
            <input
              type="text"
              className={styles.inputField}
              maxLength={7}
              placeholder="#613BBF"
              value={activeColor}
              disabled={isSubmitting}
              onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })}
              aria-label="Hex color string input"
            />
          </div>
          {errors.color && <span className={styles.errorMessage}>{errors.color.message}</span>}
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.recurringToggleRow}>
            <label className={styles.label} htmlFor="isCategoryRecurringCheckbox">Recurring Payment?</label>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                id="isCategoryRecurringCheckbox"
                disabled={isSubmitting}
                {...register("isRecurring")}
                className={styles.toggleCheckbox}
              />
              <label htmlFor="isCategoryRecurringCheckbox" className={styles.toggleLabel}>
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
          <p className={styles.hintText}>Enable for bills, subscriptions, and regular payments.</p>
        </div>

        {isRecurring && (
          <div className={styles.recurringDetailsPanel}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="recurringFrequencySelect">Frequency</label>
              <select 
                id="recurringFrequencySelect" 
                className={styles.selectField} 
                disabled={isSubmitting}
                {...register("frequency")}
              >
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Bi-Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
              {errors.frequency && <span className={styles.errorMessage}>{errors.frequency.message}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="recurringDueDaySelect">Due Day (of month)</label>
              <select
                id="recurringDueDaySelect"
                className={styles.selectField}
                disabled={isSubmitting}
                {...register("dueDay", { valueAsNumber: true })}
              >
                {Array.from({ length: 28 }).map((_, index) => (
                  <option key={index + 1} value={index + 1}>{index + 1}</option>
                ))}
                <option value="31">31 (Last day of month)</option>
              </select>
              {errors.dueDay && <span className={styles.errorMessage}>{errors.dueDay.message}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="reminderDaysLeadSelect">Notification Lead Time</label>
              <select
                id="reminderDaysLeadSelect"
                className={styles.selectField}
                disabled={isSubmitting}
                {...register("reminderDays", { valueAsNumber: true })}
              >
                <option value="0">Same day due date alert</option>
                <option value="1">1 day before due date</option>
                <option value="2">2 days before due date</option>
                <option value="3">3 days before due date</option>
                <option value="5">5 days before due date</option>
                <option value="7">1 week before due date</option>
              </select>
              {errors.reminderDays && <span className={styles.errorMessage}>{errors.reminderDays.message}</span>}
            </div>
          </div>
        )}

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Category"}
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
  );
}