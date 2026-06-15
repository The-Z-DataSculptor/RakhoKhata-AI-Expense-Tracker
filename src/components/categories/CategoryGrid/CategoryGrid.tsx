// src/components/categories/CategoryGrid/CategoryGrid.tsx

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
  FiTrash2
} from "react-icons/fi";
import { CategoryRecord } from "@/app/(dashboard)/dashboard/categories/page";
import styles from "./CategoryGrid.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface CategoryGridProps {
  /** Array of category items passed down from the parent page state */
  categoriesList: CategoryRecord[];
  /** Triggers when user wants to change an existing category label */
  onEditClick: (category: CategoryRecord) => void;
  /** Triggers when user wants to clear out a category label */
  onDeleteClick: (id: string) => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
// Helper function to turn text string slugs into actual rendering React Icon elements
function getIconComponent(iconSlug: string) {
  switch (iconSlug) {
    case "FiBriefcase":
      return <FiBriefcase size={20} />;
    case "FiTarget":
      return <FiTarget size={20} />;
    case "FiShoppingCart":
      return <FiShoppingCart size={20} />;
    case "FiCpu":
      return <FiCpu size={20} />;
    case "FiZap":
      return <FiZap size={20} />;
    default:
      return <FiHelpCircle size={20} />;
  }
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
export default function CategoryGrid({ categoriesList, onEditClick, onDeleteClick }: CategoryGridProps) {
  return (
    <div className={styles.gridCanvasWrapper}>
      {categoriesList.map((categoryItem) => {
        return (
          <div key={categoryItem.id} className={styles.categoryCardPlatform}>
            
            {/* TOP ROW: ICON CIRCLE & BADGE */}
            <div className={styles.cardHeaderRow}>
              <div 
                className={styles.iconCircleStage}
                style={{ 
                  backgroundColor: `${categoryItem.accentColor}15`, // Adding alpha transparent tint
                  color: categoryItem.accentColor 
                }}
              >
                {getIconComponent(categoryItem.iconSlug)}
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
                {categoryItem.type === "both" ? "Income & Expense" : categoryItem.type}
              </span>
            </div>

            {/* MIDDLE ROW: INFORMATION DESCRIPTION METRICS */}
            <div className={styles.cardInfoBody}>
              <h4 className={styles.categoryLabelTitle} title={categoryItem.name}>
                {categoryItem.name}
              </h4>
              <p className={styles.counterLogText}>
                Used <span className={styles.darkTextCount}>{categoryItem.transactionCount}</span> times
              </p>
            </div>

            {/* BOTTOM ROW: INTERACTIVE BUTTON CONTROLS */}
            <div className={styles.cardActionsDeck}>
              <button 
                className={`${styles.actionButton} ${styles.editButton}`}
                onClick={() => onEditClick(categoryItem)}
                title="Edit this category"
                aria-label={`Edit ${categoryItem.name}`}
              >
                <FiEdit2 size={14} />
                <span>Edit</span>
              </button>
              
              <button 
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => onDeleteClick(categoryItem.id)}
                title="Delete this category"
                aria-label={`Delete ${categoryItem.name}`}
              >
                <FiTrash2 size={14} />
                <span>Delete</span>
              </button>
            </div>

          </div>
        );
      })}
    </div>
  );
}
/* === SECTION 4 END === */