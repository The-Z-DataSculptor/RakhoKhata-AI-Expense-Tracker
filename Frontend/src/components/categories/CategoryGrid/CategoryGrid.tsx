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
   === SECTION 3: COMPONENT LOGIC ===
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
            
            {/* 🚀 ROW 1: CORE IDENTITY (ICON + LABEL TITLE + TYPE BADGE) */}
            <div className={styles.cardHeaderRow}>
              <div className={styles.identityGroup}>
                <div 
                  className={styles.iconCircleStage}
                  style={{ 
                    backgroundColor: `${categoryItem.accentColor}12`, 
                    color: categoryItem.accentColor 
                  }}
                >
                  {getIconComponent(categoryItem.iconSlug)}
                </div>
                <h4 className={styles.categoryLabelTitle} title={categoryItem.name}>
                  {categoryItem.name}
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
                {categoryItem.type === "both" ? "Mixed" : categoryItem.type}
              </span>
            </div>

            {/* 🚀 ROW 2: ACCOUNTABILITY METRICS & LOW-PROFILE ACTIONS COMBINED */}
            <div className={styles.cardMetaRow}>
              <p className={styles.counterLogText}>
                Used <span className={styles.darkTextCount}>{categoryItem.transactionCount}</span> times
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
                      className={`${styles.actionButton} ${styles.editButton}`}
                      onClick={() => onEditClick(categoryItem)}
                      title="Edit category"
                      aria-label={`Edit ${categoryItem.name}`}
                    >
                      <FiEdit2 size={12} />
                    </button>
                    
                    <button 
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => onDeleteClick(categoryItem.id)}
                      title="Delete category"
                      aria-label={`Delete ${categoryItem.name}`}
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