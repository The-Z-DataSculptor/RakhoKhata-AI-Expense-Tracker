// src/utils/dashboardHelpers.ts

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
  value: number;   // in original currency
  color: string;
  isFixed: boolean;
}

export interface CashFlowDataPoint {
  label: string;
  Income: number;   // in original currency
  Expenses: number; // in original currency
}

/* ==========================================================================
   === DATE HELPERS ===
   ========================================================================== */
function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}

function getPeriodDateRange(period: TimePeriod): { start: Date; end: Date } | null {
  if (period === "all") return null;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  let dayEnd: number;
  switch (period) {
    case "7d": dayEnd = 7; break;
    case "14d": dayEnd = 14; break;
    case "30d": dayEnd = 30; break;
    default: dayEnd = 30;
  }
  const lastDay = new Date(year, month + 1, 0).getDate();
  const actualEnd = Math.min(dayEnd, lastDay);
  const end = new Date(year, month, actualEnd, 23, 59, 59);
  return { start, end };
}

function getPeriodDaysAndMonthDays(period: TimePeriod): { periodDays: number; monthDays: number } {
  const { start, end } = getCurrentMonthRange();
  const monthDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

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
    case "7d": return "this week";
    case "14d": return "in the first half";
    case "30d": return "this month";
    case "all": return "overall";
    default: return "this month";
  }
}

/* ==========================================================================
   === FILTERING HELPERS ===
   ========================================================================== */
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

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: TimePeriod
): Transaction[] {
  const range = getPeriodDateRange(period);
  if (!range) return transactions;
  return filterTransactionsByDateRange(transactions, range.start, range.end);
}

/* ==========================================================================
   === METRICS COMPUTATION (using originalAmount) ===
   ========================================================================== */
export function computeMetrics(
  transactions: Transaction[],
  period: TimePeriod
): DashboardMetrics {
  const { start, end } = getCurrentMonthRange();
  const monthTxs = filterTransactionsByDateRange(transactions, start, end);

  let monthIncome = 0;
  let monthExpenses = 0;
  let monthFixed = 0;
  let monthFlexible = 0;

  monthTxs.forEach((tx) => {
    const base = Number(tx.originalAmount);   // <-- FIXED: use originalAmount
    if (tx.type === "INCOME") {
      monthIncome += base;
    } else if (tx.type === "EXPENSE") {
      monthExpenses += base;
      const isFixedBill = 
        tx.category?.isRecurring || 
        tx.category?.isFixed || 
        tx.category?.name?.toLowerCase().includes("bill") || 
        tx.description?.toLowerCase().includes("bill");
      if (isFixedBill) {
        monthFixed += base;
      } else {
        monthFlexible += base;
      }
    }
  });

  const monthSafe = Math.max(0, monthIncome - (monthFixed + monthFlexible));

  let actualIncome, actualExpenses, actualFixed, actualFlexible, actualSafe;
  let projectedIncome, projectedExpenses, projectedFixed, projectedFlexible, projectedSafe;

  if (period === "all") {
    let totalIncome = 0, totalExpenses = 0, totalFixed = 0, totalFlexible = 0;
    transactions.forEach((tx) => {
      const base = Number(tx.originalAmount);   // <-- FIXED
      if (tx.type === "INCOME") {
        totalIncome += base;
      } else if (tx.type === "EXPENSE") {
        totalExpenses += base;
        const isFixedBill = 
          tx.category?.isRecurring || 
          tx.category?.isFixed || 
          tx.category?.name?.toLowerCase().includes("bill") || 
          tx.description?.toLowerCase().includes("bill");
        if (isFixedBill) {
          totalFixed += base;
        } else {
          totalFlexible += base;
        }
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
    const scaleFactor = periodDays / monthDays;
    actualIncome = Math.round(monthIncome * scaleFactor * 100) / 100;
    actualExpenses = Math.round(monthExpenses * scaleFactor * 100) / 100;
    actualFixed = Math.round(monthFixed * scaleFactor * 100) / 100;
    actualFlexible = Math.round(monthFlexible * scaleFactor * 100) / 100;
    actualSafe = Math.round(monthSafe * scaleFactor * 100) / 100;
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

/* ==========================================================================
   === CATEGORY BREAKDOWN ===
   ========================================================================== */
export function computeCategoryBreakdown(
  transactions: Transaction[]
): CategoryBreakdownItem[] {
  const expenses = transactions.filter((tx) => tx.type === "EXPENSE");
  const categoryMap = new Map<string, CategoryBreakdownItem>();

  expenses.forEach((tx) => {
    const categoryName = tx.category?.name || "Uncategorized";
    const color = tx.category?.color || "var(--text-muted)";
    const isFixed = 
      tx.category?.isFixed || 
      tx.category?.isRecurring || 
      categoryName.toLowerCase().includes("bill") ||
      tx.description?.toLowerCase().includes("bill");
    const amount = Number(tx.originalAmount);   // <-- FIXED

    if (categoryMap.has(categoryName)) {
      const existing = categoryMap.get(categoryName)!;
      existing.value += amount;
    } else {
      categoryMap.set(categoryName, {
        name: categoryName,
        value: amount,
        color,
        isFixed,
      });
    }
  });

  return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
}

/* ==========================================================================
   === CASH FLOW TIME-SERIES ===
   ========================================================================== */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - firstDayOfYear.getTime()) / 86400000);
  return Math.ceil((days + firstDayOfYear.getDay() + 1) / 7);
}

function sortKeysByDate(
  groups: Map<string, { income: number; expenses: number }>,
  groupBy: "day" | "week" | "month"
): string[] {
  if (groupBy === "day") {
    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const keys = Array.from(groups.keys());
    return keys.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  }
  if (groupBy === "month") {
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const keys = Array.from(groups.keys());
    return keys.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
  }
  const keys = Array.from(groups.keys());
  return keys.sort((a, b) => {
    const numA = parseInt(a.replace("Week ", ""), 10);
    const numB = parseInt(b.replace("Week ", ""), 10);
    return numA - numB;
  });
}

export function computeCashFlowData(
  transactions: Transaction[],
  period: TimePeriod
): CashFlowDataPoint[] {
  const range = getPeriodDateRange(period);
  if (!range) {
    if (transactions.length === 0) return [];
    const dates = transactions.map(tx => new Date(tx.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const startAll = minDate;
    const endAll = new Date();
    const filtered = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= startAll && txDate <= endAll;
    });
    const groups = new Map<string, { income: number; expenses: number }>();
    filtered.forEach((tx) => {
      const date = new Date(tx.date);
      const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!groups.has(key)) groups.set(key, { income: 0, expenses: 0 });
      const group = groups.get(key)!;
      const amount = Number(tx.originalAmount);   // <-- FIXED
      if (tx.type === "INCOME") group.income += amount;
      else group.expenses += amount;
    });
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const dA = new Date(parseInt(yearA), monthOrder.indexOf(monthA), 1);
      const dB = new Date(parseInt(yearB), monthOrder.indexOf(monthB), 1);
      return dA.getTime() - dB.getTime();
    });
    return sortedKeys.map((key) => {
      const group = groups.get(key)!;
      return {
        label: key,
        Income: Math.round(group.income * 100) / 100,
        Expenses: Math.round(group.expenses * 100) / 100,
      };
    });
  }

  const { start, end } = range;
  const filtered = filterTransactionsByDateRange(transactions, start, end);
  if (filtered.length === 0) return [];

  let groupBy: "day" | "week" | "month" = "day";
  if (period === "7d") groupBy = "day";
  else if (period === "14d") groupBy = "day";
  else if (period === "30d") groupBy = "week";

  const groups = new Map<string, { income: number; expenses: number }>();
  filtered.forEach((tx) => {
    const date = new Date(tx.date);
    let key: string;
    if (groupBy === "day") {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      key = dayNames[date.getDay()];
    } else if (groupBy === "week") {
      const weekNum = getWeekNumber(date);
      key = `Week ${weekNum}`;
    } else {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      key = monthNames[date.getMonth()];
    }
    if (!groups.has(key)) groups.set(key, { income: 0, expenses: 0 });
    const group = groups.get(key)!;
    const amount = Number(tx.originalAmount);   // <-- FIXED
    if (tx.type === "INCOME") group.income += amount;
    else group.expenses += amount;
  });

  const sortedKeys = sortKeysByDate(groups, groupBy);
  return sortedKeys.map((key) => {
    const group = groups.get(key)!;
    return {
      label: key,
      Income: Math.round(group.income * 100) / 100,
      Expenses: Math.round(group.expenses * 100) / 100,
    };
  });
}