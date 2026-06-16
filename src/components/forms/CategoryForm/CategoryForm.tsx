// src/app/(dashboard)/dashboard/categories/_components/CategoryForm.tsx
"use client";
"use no memo";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoryFormSchema, CategoryFormValues } from "@/schemas/categories";
import { CategoryRecord } from "../../../app/(dashboard)/dashboard/categories/page";
import styles from "./CategoryForm.module.css";

interface CategoryFormProps {
  onAddCategory: (newCategory: CategoryRecord) => void;
  initialData?: CategoryRecord | null; 
  onCancel?: () => void; // FIXED: Explicitly added optional onCancel parameter layout signature
}

export function CategoryForm({ onAddCategory, initialData, onCancel }: CategoryFormProps) {
  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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

  const activeColor = watch("color");

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      const lowerCaseType = data.type.toLowerCase() as "income" | "expense" | "both";

      const completeCategoryRecord: CategoryRecord = {
        id: initialData ? initialData.id : `cat-${Date.now()}`,
        name: data.name,
        type: lowerCaseType,
        iconSlug: lowerCaseType === "income" ? "FiBriefcase" : "FiShoppingCart",
        accentColor: data.color,
        transactionCount: initialData ? initialData.transactionCount : 0,
      };

      onAddCategory(completeCategoryRecord);
      reset({ name: "", type: "EXPENSE", color: "#613BBF" });
    } catch (error) {
      console.error("Form execution routine tracking failure:", error);
    }
  };

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