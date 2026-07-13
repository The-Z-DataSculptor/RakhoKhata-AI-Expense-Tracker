// src/components/forms/CategoryForm/CategoryForm.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useEffect, useCallback } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { categoryFormSchema, CategoryFormValues } from "@/schemas/categories";
import { CategoryRecord } from "@/app/(dashboard)/dashboard/categories/page";
import styles from "./CategoryForm.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface CategoryFormProps {
  onAddCategory: (newCategory: CategoryRecord) => void;
  initialData?: CategoryRecord | null;
  onCancel?: () => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function CategoryForm({ onAddCategory, initialData, onCancel }: CategoryFormProps) {
  const isEditMode = !!initialData;

  // ✅ FIXED: Explicitly type the resolver
  const resolver = zodResolver(categoryFormSchema) as Resolver<CategoryFormValues>;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver, // 👈 No `as any` needed
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

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        type: initialData.type.toUpperCase() as "INCOME" | "EXPENSE" | "BOTH",
        color: initialData.accentColor,
        isRecurring: initialData.isRecurring || false,
        frequency: (initialData.frequency as "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY") || "MONTHLY",
        dueDay: initialData.dueDay || 1,
        reminderDays: initialData.reminderDays || 3,
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

  const activeColor = useWatch({ control, name: "color", defaultValue: "#613BBF" });
  const isRecurring = useWatch({ control, name: "isRecurring", defaultValue: false });

  const onSubmit = useCallback(
    async (data: CategoryFormValues) => {
      try {
        const lowerCaseType = data.type.toLowerCase() as "income" | "expense" | "both";

        const completeCategoryRecord: CategoryRecord = {
          id: initialData ? initialData.id : `cat-${Date.now()}`,
          name: data.name,
          type: lowerCaseType,
          iconSlug: lowerCaseType === "income" ? "FiBriefcase" : "FiShoppingCart",
          accentColor: data.color,
          transactionCount: initialData ? initialData.transactionCount : 0,
          workspaceId: initialData ? initialData.workspaceId : "active-workspace",
          isRecurring: data.isRecurring || false,
          frequency: data.frequency || "MONTHLY",
          dueDay: data.dueDay || 1,
          reminderDays: data.reminderDays || 3,
        };

        onAddCategory(completeCategoryRecord);

        if (initialData) {
          toast.success("Category changes saved successfully!");
        } else {
          toast.success("Custom spending category added!");
        }

        if (!initialData) {
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
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("Could not save category.");
      }
    },
    [initialData, onAddCategory, reset]
  );

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.formCard}>
      <h3 className={styles.formTitle}>
        {isEditMode ? `Edit Category: ${initialData?.name}` : "Create New Category"}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formLayout}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="name">Category Name</label>
          <input
            id="name"
            type="text"
            className={styles.inputField}
            placeholder="e.g., Groceries, Rent, Salary"
            {...register("name")}
          />
          {errors.name && <span className={styles.errorMessage}>{errors.name.message}</span>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="type">Transaction Type</label>
          <select id="type" className={styles.selectField} {...register("type")}>
            <option value="EXPENSE">Expense (Money Out)</option>
            <option value="INCOME">Income (Money In)</option>
            <option value="BOTH">Both (Income & Expense)</option>
          </select>
          {errors.type && <span className={styles.errorMessage}>{errors.type.message}</span>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Color</label>
          <div className={styles.colorPickerWrapper}>
            <input
              type="color"
              className={styles.colorInput}
              value={activeColor}
              onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })}
            />
            <input
              type="text"
              className={styles.inputField}
              maxLength={7}
              placeholder="#000000"
              value={activeColor}
              onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })}
            />
          </div>
          {errors.color && <span className={styles.errorMessage}>{errors.color.message}</span>}
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.recurringToggleRow}>
            <label className={styles.label} htmlFor="isRecurring">Recurring Payment?</label>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                id="isRecurring"
                {...register("isRecurring")}
                className={styles.toggleCheckbox}
              />
              <label htmlFor="isRecurring" className={styles.toggleLabel}>
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
          <p className={styles.hintText}>Enable for bills, subscriptions, and other regular payments.</p>
        </div>

        {isRecurring && (
          <div className={styles.recurringDetailsPanel}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="frequency">Frequency</label>
              <select id="frequency" className={styles.selectField} {...register("frequency")}>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Bi-Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
              {errors.frequency && <span className={styles.errorMessage}>{errors.frequency.message}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="dueDay">Due Day (of the month)</label>
              <select
                id="dueDay"
                className={styles.selectField}
                {...register("dueDay", { valueAsNumber: true })}
              >
                {[...Array(28)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
                <option value="31">31 (Last day)</option>
              </select>
              {errors.dueDay && <span className={styles.errorMessage}>{errors.dueDay.message}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="reminderDays">Remind Me</label>
              <select
                id="reminderDays"
                className={styles.selectField}
                {...register("reminderDays", { valueAsNumber: true })}
              >
                <option value="0">Same day</option>
                <option value="1">1 day before</option>
                <option value="2">2 days before</option>
                <option value="3">3 days before</option>
                <option value="5">5 days before</option>
                <option value="7">1 week before</option>
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