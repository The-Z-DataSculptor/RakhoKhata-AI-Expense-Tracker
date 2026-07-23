// src/utils/dashboardHelpers.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";

// ---------- Core domain types ----------
export interface Transaction {
  id: string;
  originalAmount: number;   // exact amount entered by the user
  originalCurrency: string; // e.g., "PKR"
  baseAmountUSD: number;    // immutable USD anchor
  amount?: number;          // legacy field (kept for backward compatibility)
  type: "INCOME" | "EXPENSE";
  description: string;
  date: string;
  workspaceId: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    type: string;
    color: string;
    isFixed: boolean;
    isRecurring: boolean;
    frequency?: string;
    dueDay?: number;
    reminderDays?: number;
  };
}

export interface DashboardMetrics {
  totalIncome: number;
  totalExpenses: number;
  fixedExpenses: number;
  flexibleExpenses: number;
  safeToSpend: number;
  projected: {
    totalIncome: number;
    totalExpenses: number;
    fixedExpenses: number;
    flexibleExpenses: number;
    safeToSpend: number;
  };
}

export interface CategoryBreakdownItem {
  name: string;
  value: number;   // in original currency
  color: string;
  isFixed: boolean;
}

export interface CashFlowDataPoint {
  label: string;
  Income: number;   // in original currency
  Expenses: number; // in original currency
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: DATE UTILITIES ===
   ========================================================================== */

/**
 * Returns the first and last day of the current calendar month.
 * ⚠️ Important: All dates are calculated using the user's local timezone.
 * This means that for users in different timezones the "month" boundaries
 * may differ from the UTC timestamps stored in the database.
 * In a future update we may want to make this timezone‑configurable.
 */
function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // First day of the month (local time)
  const start = new Date(year, month, 1);
  // Last day of the month (local time) – day 0 of next month is the last day
  const end = new Date(year, month + 1, 0);
  return { start, end };
}

/** Returns the date range for a given time period. */
function getPeriodDateRange(period: TimePeriod): {
  start: Date;
  end: Date;
} | null {
  if (period === "all") return null; // No range filter needed
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  let dayEnd: number;
  switch (period) {
    case "7d":
      dayEnd = 7;
      break;
    case "14d":
      dayEnd = 14;
      break;
    case "30d":
      dayEnd = 30;
      break;
    default:
      dayEnd = 30;
  }
  // Make sure we don't exceed the actual number of days in the month
  const lastDay = new Date(year, month + 1, 0).getDate();
  const actualEnd = Math.min(dayEnd, lastDay);
  // Set the end time to the very end of that day
  const end = new Date(year, month, actualEnd, 23, 59, 59);
  return { start, end };
}

/** Returns the number of days in the period and in the current month. */
function getPeriodDaysAndMonthDays(period: TimePeriod): {
  periodDays: number;
  monthDays: number;
} {
  const { start, end } = getCurrentMonthRange();
  // Calculate total days in the month (inclusive)
  const monthDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  switch (period) {
    case "7d":
      return { periodDays: 7, monthDays };
    case "14d":
      return { periodDays: 14, monthDays };
    case "30d":
      return { periodDays: monthDays, monthDays };
    case "all":
      return { periodDays: monthDays, monthDays };
    default:
      return { periodDays: 30, monthDays };
  }
}

/** Human‑readable label for the selected period. */
export function getPeriodLabel(period: TimePeriod): string {
  switch (period) {
    case "7d":
      return "this week";
    case "14d":
      return "in the first half";
    case "30d":
      return "this month";
    case "all":
      return "overall";
    default:
      return "this month";
  }
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: FILTERING & METRICS ===
   ========================================================================== */

/** Filters transactions that fall within a given date range. */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  start: Date,
  end: Date
): Transaction[] {
  return transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate >= start && txDate <= end;
  });
}

/** Filters transactions for a specific period. */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: TimePeriod
): Transaction[] {
  const range = getPeriodDateRange(period);
  if (!range) return transactions; // "all" period – return everything
  return filterTransactionsByDateRange(transactions, range.start, range.end);
}

/**
 * Checks whether a transaction belongs to a fixed/recurring bill.
 * 🔍 This is a best‑guess heuristic:
 *   - A transaction is considered "fixed" if its category is marked as fixed/recurring,
 *     OR if the category name or description contains the word "bill".
 *   - In the future, we may want to replace this with a proper flag on each transaction.
 */
function isFixedExpense(tx: Transaction): boolean {
  return Boolean(
    tx.category?.isRecurring ||
      tx.category?.isFixed ||
      tx.category?.name?.toLowerCase().includes("bill") ||
      tx.description?.toLowerCase().includes("bill")
  );
}

/** Computes income, expenses, and safe‑to‑spend metrics. */
export function computeMetrics(
  transactions: Transaction[],
  period: TimePeriod
): DashboardMetrics {
  // Get the current month's date range (for the "projected" values)
  const { start, end } = getCurrentMonthRange();
  const monthTxs = filterTransactionsByDateRange(transactions, start, end);

  let monthIncome = 0;
  let monthExpenses = 0;
  let monthFixed = 0;
  let monthFlexible = 0;

  monthTxs.forEach((tx) => {
    const value = Number(tx.originalAmount);
    if (tx.type === "INCOME") {
      monthIncome += value;
    } else if (tx.type === "EXPENSE") {
      monthExpenses += value;
      if (isFixedExpense(tx)) {
        monthFixed += value;
      } else {
        monthFlexible += value;
      }
    }
  });

  const monthSafe = Math.max(0, monthIncome - (monthFixed + monthFlexible));

  // Variables for the actual (scaled) and projected values
  let actualIncome: number,
    actualExpenses: number,
    actualFixed: number,
    actualFlexible: number,
    actualSafe: number;
  let projectedIncome: number,
    projectedExpenses: number,
    projectedFixed: number,
    projectedFlexible: number,
    projectedSafe: number;

  if (period === "all") {
    let totalIncome = 0,
      totalExpenses = 0,
      totalFixed = 0,
      totalFlexible = 0;
    transactions.forEach((tx) => {
      const value = Number(tx.originalAmount);
      if (tx.type === "INCOME") totalIncome += value;
      else {
        totalExpenses += value;
        if (isFixedExpense(tx)) totalFixed += value;
        else totalFlexible += value;
      }
    });
    const totalSafe = Math.max(0, totalIncome - (totalFixed + totalFlexible));
    actualIncome = totalIncome;
    actualExpenses = totalExpenses;
    actualFixed = totalFixed;
    actualFlexible = totalFlexible;
    actualSafe = totalSafe;
    projectedIncome = totalIncome;
    projectedExpenses = totalExpenses;
    projectedFixed = totalFixed;
    projectedFlexible = totalFlexible;
    projectedSafe = totalSafe;
  } else {
    const { periodDays, monthDays } = getPeriodDaysAndMonthDays(period);
    // Scale the month totals to the selected period length
    const scale = periodDays / monthDays;
    const round = (n: number) => Math.round(n * 100) / 100;
    actualIncome = round(monthIncome * scale);
    actualExpenses = round(monthExpenses * scale);
    actualFixed = round(monthFixed * scale);
    actualFlexible = round(monthFlexible * scale);
    actualSafe = round(monthSafe * scale);
    // Projected values are simply the full month totals
    projectedIncome = monthIncome;
    projectedExpenses = monthExpenses;
    projectedFixed = monthFixed;
    projectedFlexible = monthFlexible;
    projectedSafe = monthSafe;
  }

  return {
    totalIncome: actualIncome,
    totalExpenses: actualExpenses,
    fixedExpenses: actualFixed,
    flexibleExpenses: actualFlexible,
    safeToSpend: actualSafe,
    projected: {
      totalIncome: projectedIncome,
      totalExpenses: projectedExpenses,
      fixedExpenses: projectedFixed,
      flexibleExpenses: projectedFlexible,
      safeToSpend: projectedSafe,
    },
  };
}

/** Groups expenses by category and returns a sorted breakdown. */
export function computeCategoryBreakdown(
  transactions: Transaction[]
): CategoryBreakdownItem[] {
  const expenses = transactions.filter((tx) => tx.type === "EXPENSE");
  const categoryMap = new Map<string, CategoryBreakdownItem>();

  expenses.forEach((tx) => {
    const name = tx.category?.name || "Uncategorized";
    const color = tx.category?.color || "var(--text-muted)";
    const amount = Number(tx.originalAmount);
    const existing = categoryMap.get(name);
    if (existing) {
      existing.value += amount;
    } else {
      categoryMap.set(name, {
        name,
        value: amount,
        color,
        isFixed: isFixedExpense(tx),
      });
    }
  });

  return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: CASH FLOW TIME‑SERIES ===
   ========================================================================== */

/** Calculates the ISO week number for a given date. */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor(
    (date.getTime() - firstDayOfYear.getTime()) / 86400000
  );
  return Math.ceil((days + firstDayOfYear.getDay() + 1) / 7);
}

/** Sorts the keys of a grouped map according to the chosen time bucket. */
function sortGroupKeys(
  groups: Map<string, { income: number; expenses: number }>,
  groupBy: "day" | "week" | "month"
): string[] {
  const keys = Array.from(groups.keys());
  if (groupBy === "day") {
    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return keys.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  }
  if (groupBy === "month") {
    const monthOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return keys.sort(
      (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );
  }
  // groupBy === "week" – sort by numeric week number
  return keys.sort(
    (a, b) =>
      parseInt(a.replace("Week ", ""), 10) -
      parseInt(b.replace("Week ", ""), 10)
  );
}

export function computeCashFlowData(
  transactions: Transaction[],
  period: TimePeriod
): CashFlowDataPoint[] {
  const range = getPeriodDateRange(period);

  // Helper: aggregate transactions into groups by day/week/month
  const aggregate = (
    txs: Transaction[],
    groupBy: "day" | "week" | "month"
  ) => {
    const groups = new Map<
      string,
      { income: number; expenses: number }
    >();
    txs.forEach((tx) => {
      const date = new Date(tx.date);
      let key: string;
      if (groupBy === "day") {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        key = dayNames[date.getDay()];
      } else if (groupBy === "week") {
        key = `Week ${getWeekNumber(date)}`;
      } else {
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        key = monthNames[date.getMonth()];
      }
      const entry = groups.get(key) || { income: 0, expenses: 0 };
      const amount = Number(tx.originalAmount);
      if (tx.type === "INCOME") entry.income += amount;
      else entry.expenses += amount;
      groups.set(key, entry);
    });
    return groups;
  };

  if (!range) {
    // "all" period – group by month
    if (transactions.length === 0) return [];
    const dates = transactions.map((tx) => new Date(tx.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const filtered = transactions.filter(
      (tx) => new Date(tx.date) >= minDate
    );
    const groups = aggregate(filtered, "month");
    const monthOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const sorted = Array.from(groups.keys()).sort((a, b) => {
      const [ma, ya] = a.split(" ");
      const [mb, yb] = b.split(" ");
      return (
        new Date(parseInt(ya), monthOrder.indexOf(ma), 1).getTime() -
        new Date(parseInt(yb), monthOrder.indexOf(mb), 1).getTime()
      );
    });
    return sorted.map((key) => {
      const g = groups.get(key)!;
      return {
        label: key,
        Income: Math.round(g.income * 100) / 100,
        Expenses: Math.round(g.expenses * 100) / 100,
      };
    });
  }

  const { start, end } = range;
  const filtered = filterTransactionsByDateRange(
    transactions,
    start,
    end
  );
  if (filtered.length === 0) return [];

  // Choose the grouping granularity
  const groupBy: "day" | "week" | "month" =
    period === "30d" ? "week" : "day";
  const groups = aggregate(filtered, groupBy);
  const sortedKeys = sortGroupKeys(groups, groupBy);

  return sortedKeys.map((key) => {
    const g = groups.get(key)!;
    return {
      label: key,
      Income: Math.round(g.income * 100) / 100,
      Expenses: Math.round(g.expenses * 100) / 100,
    };
  });
}
/* === SECTION 4 END === */