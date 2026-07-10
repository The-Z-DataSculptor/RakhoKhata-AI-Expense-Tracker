// src/app/(dashboard)/dashboard/categories/_components/CategoryForm.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useEffect, useCallback } from "react"; // FIXED: Added useCallback to isolate event side-effects
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"; 
import { categoryFormSchema, CategoryFormValues } from "@/schemas/categories";
import { CategoryRecord } from "../../../app/(dashboard)/dashboard/categories/page";
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

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      type: "EXPENSE",
      color: "#613BBF",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        type: initialData.type.toUpperCase() as "INCOME" | "EXPENSE" | "BOTH",
        color: initialData.accentColor,
      });
    } else {
      reset({ name: "", type: "EXPENSE", color: "#613BBF" });
    }
  }, [initialData, reset]);

  const activeColor = useWatch({
    control,
    name: "color",
    defaultValue: "#613BBF",
  });

  // FIXED: Wrapped in useCallback to declare this safely as an event handler block to the compiler
  const onSubmit = useCallback(async (data: CategoryFormValues) => {
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
      };

      onAddCategory(completeCategoryRecord);

      if (initialData) {
        toast.success("Category changes saved successfully!");
      } else {
        toast.success("Custom spending category added!");
      }

      reset({ name: "", type: "EXPENSE", color: "#613BBF" });
    } catch (error) {
      console.error("Form execution routine tracking failure:", error);
      toast.error("Could not allocate category registry safely.");
    }
  }, [initialData, onAddCategory, reset]);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.formCard}>
      <h3 className={styles.formTitle}>
        {isEditMode ? `Edit Category: ${initialData?.name}` : "Create New Category"}
      </h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formLayout}>
        {/* NAME INPUT */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="name">Category Label Name</label>
          <input
            id="name"
            type="text"
            className={styles.inputField}
            placeholder="e.g., Marketing, Office Supplies"
            {...register("name")}
          />
          {errors.name && <span className={styles.errorMessage}>{errors.name.message}</span>}
        </div>

        {/* DIRECTION TYPE SELECTOR */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="type">Transaction Allocation Mapping</label>
          <select id="type" className={styles.selectField} {...register("type")}>
            <option value="EXPENSE">Expense (Cash Outflow)</option>
            <option value="INCOME">Income (Cash Inflow)</option>
            <option value="BOTH">Both (Shared Pipeline)</option>
          </select>
          {errors.type && <span className={styles.errorMessage}>{errors.type.message}</span>}
        </div>

        {/* HEX CHROMATIC CONFIGURATOR */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Visual Brand Accent Theme</label>
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

        {/* BUTTON ACTIONS GROUP */}
        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Processing Parameters..." : isEditMode ? "Save Changes" : "Create Category"}
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