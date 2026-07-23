// src/components/categories/CategoryGrid/CategoryGrid.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { 
  FiBriefcase, 
  FiTarget, 
  FiShoppingCart, 
  FiCpu, 
  FiZap, 
  FiHelpCircle,
  FiEdit2,
  FiTrash2,
  FiLock
} from "react-icons/fi";
import { CategoryRecord } from "@/app/(dashboard)/dashboard/categories/page";
import styles from "./CategoryGrid.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface CategoryGridProps {
  categoriesList: CategoryRecord[];
  onEditClick: (category: CategoryRecord) => void;
  onDeleteClick: (id: string) => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & HELPERS ===
   ========================================================================== */
function getIconComponent(iconSlug: string) {
  switch (iconSlug) {
    case "FiBriefcase":
      return <FiBriefcase size={16} />;
    case "FiTarget":
      return <FiTarget size={16} />;
    case "FiShoppingCart":
      return <FiShoppingCart size={16} />;
    case "FiCpu":
      return <FiCpu size={16} />;
    case "FiZap":
      return <FiZap size={16} />;
    default:
      return <FiHelpCircle size={16} />;
  }
}

// WHY THIS FIX WAS MADE: Safely constructs background tint styling without string-appending "12",
// preventing invalid CSS syntax when category accent colors are in shorthand hex (#fff) or RGB format.
function getSafeBackgroundStyle(colorHex?: string): React.CSSProperties {
  if (!colorHex || typeof colorHex !== "string") {
    return { backgroundColor: "rgba(128, 128, 128, 0.12)", color: "#888888" };
  }
  
  let cleanHex = colorHex.trim().replace("#", "");
  
  // Convert 3-digit shorthand hex (#fff) to 6-digit hex (#ffffff)
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((char) => char + char).join("");
  }
  
  if (cleanHex.length === 6) {
    const red = parseInt(cleanHex.substring(0, 2), 16);
    const green = parseInt(cleanHex.substring(2, 4), 16);
    const blue = parseInt(cleanHex.substring(4, 6), 16);
    if (!isNaN(red) && !isNaN(green) && !isNaN(blue)) {
      return {
        backgroundColor: `rgba(${red}, ${green}, ${blue}, 0.12)`,
        color: `#${cleanHex}`,
      };
    }
  }

  return { backgroundColor: "rgba(128, 128, 128, 0.12)", color: colorHex };
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
export default function CategoryGrid({ categoriesList, onEditClick, onDeleteClick }: CategoryGridProps) {
  // WHY THIS FIX WAS MADE: Guards against null/undefined categoriesList prop to prevent UI crashes.
  const safeCategories = Array.isArray(categoriesList) ? categoriesList : [];

  if (safeCategories.length === 0) {
    return (
      <div className={styles.gridCanvasWrapper}>
        <div className={styles.emptyGridNotice}>
          <p>No spending or income categories configured in this workspace yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridCanvasWrapper}>
      {safeCategories.map((categoryItem, index) => {
        // WHY THIS FIX WAS MADE: Composite fallback key prevents React reconciliation key collisions.
        const uniqueKey = categoryItem.id || `category-card-${index}`;

        return (
          <div key={uniqueKey} className={styles.categoryCardPlatform}>
            
            {/* ROW 1: CORE IDENTITY (ICON + LABEL TITLE + TYPE BADGE) */}
            <div className={styles.cardHeaderRow}>
              <div className={styles.identityGroup}>
                <div 
                  className={styles.iconCircleStage}
                  style={getSafeBackgroundStyle(categoryItem.accentColor)}
                >
                  {getIconComponent(categoryItem.iconSlug)}
                </div>
                <h4 className={styles.categoryLabelTitle} title={categoryItem.name || "Untitled Category"}>
                  {categoryItem.name || "Untitled Category"}
                </h4>
              </div>
              
              <span 
                className={`${styles.typeBadge} ${
                  categoryItem.type === "income" 
                    ? styles.incomeBadge 
                    : categoryItem.type === "expense" 
                    ? styles.expenseBadge 
                    : styles.bothBadge
                }`}
              >
                {categoryItem.type === "both" ? "Mixed" : categoryItem.type || "Expense"}
              </span>
            </div>

            {/* ROW 2: ACCOUNTABILITY METRICS & ACTIONS */}
            <div className={styles.cardMetaRow}>
              <p className={styles.counterLogText}>
                Used <span className={styles.darkTextCount}>{Number(categoryItem.transactionCount) || 0}</span> times
              </p>

              <div className={styles.cardActionsDeck}>
                {categoryItem.isFixed ? (
                  <span className={styles.systemLockIndicator} title="System Protected Anchor">
                    <FiLock size={11} />
                    <span>Locked</span>
                  </span>
                ) : (
                  <>
                    <button 
                      type="button"
                      className={`${styles.actionButton} ${styles.editButton}`}
                      onClick={() => onEditClick(categoryItem)}
                      title="Edit category"
                      aria-label={`Edit ${categoryItem.name || "category"}`}
                    >
                      <FiEdit2 size={12} />
                    </button>
                    
                    <button 
                      type="button"
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => onDeleteClick(categoryItem.id)}
                      title="Delete category"
                      aria-label={`Delete ${categoryItem.name || "category"}`}
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
/* === SECTION 4 END === */