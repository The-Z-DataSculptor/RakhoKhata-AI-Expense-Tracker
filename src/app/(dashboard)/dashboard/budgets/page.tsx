// K:\Developer\expense-tracker\src\app\(dashboard)\dashboard\budgets\page.tsx
"use client";

import React, { useState } from "react";
import { BudgetHeader } from "@/components/budgets/BudgetHeader/BudgetHeader";
import { BudgetDonutGrid, type MockDonutItem } from "@/components/budgets/BudgetDonutGrid/BudgetDonutGrid";
import { type TimePeriod } from "@/components/dashboard/TimeSwitcher/TimeSwitcher";
import { CreateBudgetModal, type NewBudgetFormData } from "@/components/forms/CreateBudgetModal/CreateBudgetModal";
import styles from "./page.module.css";

// 1. Single Master List: The same budgets exist across all time views
interface MasterBudget {
  id: string;
  categoryName: string;
  totalLimit: number;
  // Simulated database transactions grouped by timeframe
  spentData: Record<TimePeriod, number>;
  // The absolute custom boundaries set during creation
  absoluteStart: string; // YYYY-MM-DD
  absoluteEnd: string;   // YYYY-MM-DD
}

const MASTER_BUDGETS_COLLECTION: MasterBudget[] = [
  {
    id: "b1",
    categoryName: "Marketing Ads",
    totalLimit: 30000,
    absoluteStart: "2026-06-01",
    absoluteEnd: "2026-06-30",
    spentData: { "7d": 2500, "14d": 6000, "30d": 12000, "all": 12000 }
  },
  {
    id: "b2",
    categoryName: "Cloud Servers",
    totalLimit: 15000,
    absoluteStart: "2026-06-01",
    absoluteEnd: "2026-06-30",
    spentData: { "7d": 3500, "14d": 7000, "30d": 14500, "all": 14500 }
  },
  {
    id: "b3",
    categoryName: "Office Supplies",
    totalLimit: 5000,
    absoluteStart: "2026-06-05",
    absoluteEnd: "2026-06-25",
    spentData: { "7d": 200, "14d": 1200, "30d": 3100, "all": 3100 }
  }
];

export default function BudgetsPage() {
  const [activeRange, setActiveRange] = useState<TimePeriod>("30d");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [masterBudgets, setMasterBudgets] = useState<MasterBudget[]>(MASTER_BUDGETS_COLLECTION);

  // Helper helper to turn date objects into standard clean cards display labels (e.g. "Jun 16")
  const formatShortDisplay = (date: Date): string => {
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  };

  // 2. Dynamic Calculation Engine
  // This takes your master cards list and recalculates internal boundaries on the fly!
  const computedBudgetItems: MockDonutItem[] = masterBudgets.map((budget) => {
    const today = new Date("2026-06-16"); // Anchor target simulation date frame
    let displayStart = new Date(budget.absoluteStart);
    let displayEnd = new Date(budget.absoluteEnd);
    let calculatedLimit = budget.totalLimit;

    // Adjust dates and limits conditionally based on the active top bar filter selection
    if (activeRange === "7d") {
      displayStart = new Date(today);
      displayStart.setDate(today.getDate() - 7);
      displayEnd = today;
      calculatedLimit = budget.totalLimit / 4; // cut budget limit down to a single week target pacing line
    } else if (activeRange === "14d") {
      displayStart = new Date(today);
      displayStart.setDate(today.getDate() - 14);
      displayEnd = today;
      calculatedLimit = budget.totalLimit / 2; // cut budget limit down to a bi-weekly block
    } else if (activeRange === "30d") {
      displayStart = new Date(today);
      displayStart.setDate(today.getDate() - 30);
      displayEnd = today;
    }

    return {
      id: budget.id,
      categoryName: budget.categoryName,
      spentAmount: budget.spentData[activeRange], // Pulls specific context spending matching timeframe
      limitAmount: Math.round(calculatedLimit),
      startDate: formatShortDisplay(displayStart),
      endDate: formatShortDisplay(displayEnd),
    };
  });

  const handleCreateBudgetSubmit = (formData: NewBudgetFormData) => {
    const newEntry: MasterBudget = {
      id: `budget_${Date.now()}`,
      categoryName: formData.categoryName,
      totalLimit: formData.limitAmount,
      absoluteStart: formData.startDate,
      absoluteEnd: formData.endDate,
      spentData: { "7d": 0, "14d": 0, "30d": 0, "all": 0 } // Freshly initialized tracking sets
    };

    setMasterBudgets((prev) => [newEntry, ...prev]);
  };

  return (
    <main className={styles.pageViewport}>
      
      <BudgetHeader 
        activeRange={activeRange} 
        onRangeChange={(range) => setActiveRange(range)} 
        onCreateBudgetClick={() => setIsModalOpen(true)} 
      />

      {/* Render the calculated items list output */}
      <div className={styles.contentContainer}>
        <BudgetDonutGrid items={computedBudgetItems} />
      </div>

      <CreateBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBudgetSubmit}
      />

    </main>
  );
}