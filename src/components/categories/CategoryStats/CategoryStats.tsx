// src/components/categories/CategoryStats/CategoryStats.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiActivity, 
  FiZap 
} from "react-icons/fi";
// WHY: Used to format numbers into clean currency strings based on the user's settings
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./CategoryStats.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface CategoryStatData {
  /** 1. Top Expense Category data fields */
  topExpenseName: string;
  topExpenseAmount: number;
  topExpensePercentage: number;

  /** 2. Main Income Source data fields */
  topIncomeName: string;
  topIncomeAmount: number;
  topIncomePercentage: number;

  /** 3. Fastest Growing Category data fields */
  fastClimberName: string;
  fastClimberGrowthPercentage: number;

  /** 4. Most Frequent Category data fields */
  habitTrackerName: string;
  habitTrackerCount: number;
}

interface CategoryStatsProps {
  /** Live calculation data passed down from the parent page */
  statsData: CategoryStatData;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function CategoryStats({ statsData }: CategoryStatsProps) {
  // WHY: Connects to the global state to format currency symbols dynamically ($ or Rs.)
  const { formatAmount } = useCurrency();

  // Basic backup data to prevent errors if the server hasn't loaded the real data yet
  const data = statsData || {
    topExpenseName: "None",
    topExpenseAmount: 0,
    topExpensePercentage: 0,
    topIncomeName: "None",
    topIncomeAmount: 0,
    topIncomePercentage: 0,
    fastClimberName: "None",
    fastClimberGrowthPercentage: 0,
    habitTrackerName: "None",
    habitTrackerCount: 0
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.statsGridContainer}>
      
      {/* CARD 1: TOP EXPENSE */}
      <div className={styles.insightCard}>
        <div className={styles.cardHeaderRow}>
          <div className={`${styles.iconContainer} ${styles.dangerIconTheme}`}>
            <FiTrendingDown size={20} />
          </div>
          <span className={`${styles.badgeIndicator} ${styles.dangerBadgeTheme}`}>
            {data.topExpensePercentage}% of total spend
          </span>
        </div>
        <div className={styles.cardMetricContent}>
          <p className={styles.metricLabel}>Top Expense Category</p>
          <h3 className={styles.metricHeading}>{data.topExpenseName}</h3>
          <p className={styles.metricSubtext}>
            Total Spent: <span className={styles.boldHighlight}>{formatAmount(data.topExpenseAmount, "PKR")}</span>
          </p>
        </div>
      </div>

      {/* CARD 2: MAIN INCOME */}
      <div className={styles.insightCard}>
        <div className={styles.cardHeaderRow}>
          <div className={`${styles.iconContainer} ${styles.successIconTheme}`}>
            <FiTrendingUp size={20} />
          </div>
          <span className={`${styles.badgeIndicator} ${styles.successBadgeTheme}`}>
            {data.topIncomePercentage}% of total income
          </span>
        </div>
        <div className={styles.cardMetricContent}>
          <p className={styles.metricLabel}>Main Income Source</p>
          <h3 className={styles.metricHeading}>{data.topIncomeName}</h3>
          <p className={styles.metricSubtext}>
            Total Earned: <span className={styles.boldHighlight}>{formatAmount(data.topIncomeAmount, "PKR")}</span>
          </p>
        </div>
      </div>

      {/* CARD 3: FASTEST GROWING EXPENSE */}
      <div className={styles.insightCard}>
        <div className={styles.cardHeaderRow}>
          <div className={`${styles.iconContainer} ${styles.warningIconTheme}`}>
            <FiZap size={20} />
          </div>
          <span className={`${styles.badgeIndicator} ${styles.warningBadgeTheme}`}>
            +{data.fastClimberGrowthPercentage}% increase
          </span>
        </div>
        <div className={styles.cardMetricContent}>
          <p className={styles.metricLabel}>Fastest Growing Expense</p>
          <h3 className={styles.metricHeading}>{data.fastClimberName}</h3>
          <p className={styles.metricSubtext}>
            Spending rose the most compared to last month
          </p>
        </div>
      </div>

      {/* CARD 4: MOST FREQUENTLY USED */}
      <div className={styles.insightCard}>
        <div className={styles.cardHeaderRow}>
          <div className={`${styles.iconContainer} ${styles.infoIconTheme}`}>
            <FiActivity size={20} />
          </div>
          <span className={`${styles.badgeIndicator} ${styles.infoBadgeTheme}`}>
            {data.habitTrackerCount} times
          </span>
        </div>
        <div className={styles.cardMetricContent}>
          <p className={styles.metricLabel}>Most Frequent Category</p>
          <h3 className={styles.metricHeading}>{data.habitTrackerName}</h3>
          <p className={styles.metricSubtext}>
            The category you added items to most often
          </p>
        </div>
      </div>

    </div>
  );
}
/* === SECTION 4 END === */