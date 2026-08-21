// src/utils/dashboardHelpers.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";

export interface Transaction {
  id: string;
  originalAmount: number;
  originalCurrency: string;
  baseAmountUSD: number;
  amount?: number;
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
  value: number;
  color: string;
  isFixed: boolean;
}

export interface CashFlowDataPoint {
  label: string;
  Income: number;
  Expenses: number;
}

export type ConvertFn = (amount: number, from: string, to: string) => number;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: DATE UTILITIES ===
   ========================================================================== */

function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * FIX #3: For 7d and 14d, accurately look back 7 or 14 days from today 
 * rather than hardcoding the 1st through 7th of the calendar month.
 */
function getPeriodDateRange(period: TimePeriod): {
  start: Date;
  end: Date;
} | null {
  if (period === "all") return null;

  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "7d") {
    start.setDate(start.getDate() - 6); // Look back 7 rolling days
  } else if (period === "14d") {
    start.setDate(start.getDate() - 13); // Look back 14 rolling days
  } else if (period === "30d") {
    // Current calendar month range
    return getCurrentMonthRange();
  }

  return { start, end };
}

function getPeriodDaysAndMonthDays(period: TimePeriod): {
  periodDays: number;
  monthDays: number;
} {
  const { start, end } = getCurrentMonthRange();
  const monthDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  switch (period) {
    case "7d": return { periodDays: 7, monthDays };
    case "14d": return { periodDays: 14, monthDays };
    case "30d": return { periodDays: monthDays, monthDays };
    case "all": return { periodDays: monthDays, monthDays };
    default: return { periodDays: 30, monthDays };
  }
}

export function getPeriodLabel(period: TimePeriod): string {
  switch (period) {
    case "7d": return "past 7 days";
    case "14d": return "past 14 days";
    case "30d": return "this month";
    case "all": return "overall";
    default: return "this month";
  }
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: FILTERING & METRICS ===
   ========================================================================== */

export function filterTransactionsByDateRange(
  transactions: Transaction[],
  start: Date,
  end: Date
): Transaction[] {
  return (transactions || []).filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate >= start && txDate <= end;
  });
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: TimePeriod
): Transaction[] {
  const safeTransactions = transactions || [];
  const range = getPeriodDateRange(period);
  if (!range) return safeTransactions;
  return filterTransactionsByDateRange(safeTransactions, range.start, range.end);
}

function isFixedExpense(tx: Transaction): boolean {
  return Boolean(
    tx.category?.isRecurring ||
      tx.category?.isFixed ||
      tx.category?.name?.toLowerCase().includes("bill") ||
      tx.description?.toLowerCase().includes("bill")
  );
}

export function computeMetrics(
  transactions: Transaction[],
  period: TimePeriod,
  workspaceCurrency: string,
  convertAmount: ConvertFn
): DashboardMetrics {
  const safeTransactions = transactions || [];
  const { start, end } = getCurrentMonthRange();
  const monthTxs = filterTransactionsByDateRange(safeTransactions, start, end);

  let monthIncome = 0;
  let monthExpenses = 0;
  let monthFixed = 0;
  let monthFlexible = 0;

  (monthTxs || []).forEach((tx) => {
    const rawValue = Number(tx.originalAmount);
    const value = tx.originalCurrency.toUpperCase() === workspaceCurrency.toUpperCase()
      ? rawValue
      : convertAmount(rawValue, tx.originalCurrency, workspaceCurrency);

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

  let actualIncome: number, actualExpenses: number, actualFixed: number, actualFlexible: number, actualSafe: number;
  let projectedIncome: number, projectedExpenses: number, projectedFixed: number, projectedFlexible: number, projectedSafe: number;

  if (period === "all") {
    let totalIncome = 0, totalExpenses = 0, totalFixed = 0, totalFlexible = 0;

    safeTransactions.forEach((tx) => {
      const rawValue = Number(tx.originalAmount);
      const value = tx.originalCurrency.toUpperCase() === workspaceCurrency.toUpperCase()
        ? rawValue
        : convertAmount(rawValue, tx.originalCurrency, workspaceCurrency);

      if (tx.type === "INCOME") totalIncome += value;
      else {
        totalExpenses += value;
        if (isFixedExpense(tx)) totalFixed += value;
        else totalFlexible += value;
      }
    });

    const totalSafe = Math.max(0, totalIncome - (totalFixed + totalFlexible));
    actualIncome = projectedIncome = totalIncome;
    actualExpenses = projectedExpenses = totalExpenses;
    actualFixed = projectedFixed = totalFixed;
    actualFlexible = projectedFlexible = totalFlexible;
    actualSafe = projectedSafe = totalSafe;
  } else {
    const { periodDays, monthDays } = getPeriodDaysAndMonthDays(period);
    const scale = periodDays / monthDays;
    const round = (n: number) => Math.round(n * 100) / 100;

    actualIncome = round(monthIncome * scale);
    actualExpenses = round(monthExpenses * scale);
    actualFixed = round(monthFixed * scale);
    actualFlexible = round(monthFlexible * scale);
    actualSafe = round(monthSafe * scale);

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

export function computeCategoryBreakdown(
  transactions: Transaction[],
  workspaceCurrency: string,
  convertAmount: ConvertFn
): CategoryBreakdownItem[] {
  const safeTransactions = transactions || [];
  const expenses = safeTransactions.filter((tx) => tx.type === "EXPENSE");
  const categoryMap = new Map<string, CategoryBreakdownItem>();

  expenses.forEach((tx) => {
    const name = tx.category?.name || "Uncategorized";
    const color = tx.category?.color || "var(--text-muted)";
    const rawAmount = Number(tx.originalAmount);

    const amount = tx.originalCurrency.toUpperCase() === workspaceCurrency.toUpperCase()
      ? rawAmount
      : convertAmount(rawAmount, tx.originalCurrency, workspaceCurrency);

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

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - firstDayOfYear.getTime()) / 86400000);
  return Math.ceil((days + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * FIX #2: Corrected day ordering so index 0 corresponds to Sunday (`getDay()`), 
 * matching standard JS Date indexing.
 */
function sortGroupKeys(groups: Map<string, { income: number; expenses: number }>, groupBy: "day" | "week" | "month"): string[] {
  const keys = Array.from(groups.keys());
  if (groupBy === "day") {
    const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return keys.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  }
  if (groupBy === "month") {
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return keys.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
  }
  return keys.sort((a, b) => parseInt(a.replace("Week ", ""), 10) - parseInt(b.replace("Week ", ""), 10));
}

export function computeCashFlowData(
  transactions: Transaction[],
  period: TimePeriod,
  workspaceCurrency: string,
  convertAmount: ConvertFn
): CashFlowDataPoint[] {
  const safeTransactions = transactions || [];
  const range = getPeriodDateRange(period);

  const aggregate = (txs: Transaction[], groupBy: "day" | "week" | "month", includeYearKey = false) => {
    const groups = new Map<string, { income: number; expenses: number }>();
    (txs || []).forEach((tx) => {
      const date = new Date(tx.date);
      let key: string;
      if (groupBy === "day") {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        key = dayNames[date.getDay()];
      } else if (groupBy === "week") {
        key = `Week ${getWeekNumber(date)}`;
      } else {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        // FIX #1: Include year in key for all-time data to prevent NaN sorting crashes
        key = includeYearKey ? `${monthNames[date.getMonth()]} ${date.getFullYear()}` : monthNames[date.getMonth()];
      }

      const entry = groups.get(key) || { income: 0, expenses: 0 };
      const rawAmount = Number(tx.originalAmount);

      const amount = tx.originalCurrency.toUpperCase() === workspaceCurrency.toUpperCase()
        ? rawAmount
        : convertAmount(rawAmount, tx.originalCurrency, workspaceCurrency);

      if (tx.type === "INCOME") entry.income += amount;
      else entry.expenses += amount;
      groups.set(key, entry);
    });
    return groups;
  };

  if (!range) {
    if (safeTransactions.length === 0) return [];
    const dates = safeTransactions.map((tx) => new Date(tx.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const filtered = safeTransactions.filter((tx) => new Date(tx.date) >= minDate);
    const groups = aggregate(filtered, "month", true);
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const sorted = Array.from(groups.keys()).sort((a, b) => {
      const [ma, ya] = a.split(" ");
      const [mb, yb] = b.split(" ");
      return (
        new Date(parseInt(ya || "2026", 10), monthOrder.indexOf(ma), 1).getTime() -
        new Date(parseInt(yb || "2026", 10), monthOrder.indexOf(mb), 1).getTime()
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
  const filtered = filterTransactionsByDateRange(safeTransactions, start, end);
  if ((filtered || []).length === 0) return [];

  const groupBy: "day" | "week" | "month" = period === "30d" ? "week" : "day";
  const groups = aggregate(filtered, groupBy, false);
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