"use client";

import React, { useState } from "react";
import { 
  FiGlobe, 
  FiTrendingUp, 
  FiArrowUpRight, 
  FiArrowDownLeft, 
  FiBriefcase, 
  FiUser, 
  FiCheck 
} from "react-icons/fi";
import styles from "./FeaturePreview.module.css";

interface FeaturePreviewProps {
  id?: string;
  headline?: string;
  subheadline?: string;
}

type CurrencyKey = "USD" | "PKR" | "AED";

interface CurrencyDemoData {
  code: CurrencyKey;
  symbol: string;
  flag: string;
  rateVsUSD: number;
  workspace: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  safeToSpend: number;
  recentTx: {
    title: string;
    original: string;
    category: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
  }[];
}

const DEMO_PRESETS: Record<CurrencyKey, CurrencyDemoData> = {
  USD: {
    code: "USD",
    symbol: "$",
    flag: "🇺🇸",
    rateVsUSD: 1,
    workspace: "Freelance Agency (USD)",
    monthlyIncome: 4250,
    monthlyExpenses: 1120,
    safeToSpend: 3130,
    recentTx: [
      { title: "Upwork Client Retainer", original: "$2,500.00", category: "Client Invoice", amount: 2500, type: "INCOME" },
      { title: "Vercel Pro & AWS Cloud", original: "$65.00", category: "Software Subscriptions", amount: 65, type: "EXPENSE" },
      { title: "Stripe Payout: Web Design", original: "$1,750.00", category: "Client Invoice", amount: 1750, type: "INCOME" },
    ],
  },
  PKR: {
    code: "PKR",
    symbol: "₨",
    flag: "🇵🇰",
    rateVsUSD: 278.5,
    workspace: "Personal Household (PKR)",
    monthlyIncome: 1183625,
    monthlyExpenses: 311920,
    safeToSpend: 871705,
    recentTx: [
      { title: "Upwork Client Retainer", original: "$2,500.00 (₨696,250)", category: "Client Invoice", amount: 696250, type: "INCOME" },
      { title: "Electricity & Solar Maintenance", original: "₨45,000", category: "Utilities", amount: 45000, type: "EXPENSE" },
      { title: "Grocery Mart Weekly Stock", original: "₨28,500", category: "Groceries", amount: 28500, type: "EXPENSE" },
    ],
  },
  AED: {
    code: "AED",
    symbol: "د.إ",
    flag: "🇦🇪",
    rateVsUSD: 3.67,
    workspace: "Dubai Consulting (AED)",
    monthlyIncome: 15597,
    monthlyExpenses: 4110,
    safeToSpend: 11487,
    recentTx: [
      { title: "Dubai Trade License Retainer", original: "د.إ 9,175.00", category: "Consulting", amount: 9175, type: "INCOME" },
      { title: "Co-Working Desk Marina", original: "د.إ 1,200.00", category: "Office Rent", amount: 1200, type: "EXPENSE" },
      { title: "Software Subscriptions", original: "$65.00 (د.إ 238)", category: "Software Subscriptions", amount: 238, type: "EXPENSE" },
    ],
  },
};

export default function FeaturePreview({
  id = "preview",
  headline = "Unified Global Financial Dashboard",
  subheadline = "Interactive simulation: Toggle currencies below to see how RakhoKhaata normalizes exchange rates on the fly.",
}: FeaturePreviewProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyKey>("USD");
  const data = DEMO_PRESETS[selectedCurrency];

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section id={id} className={styles.previewSection} aria-label="Interactive Dashboard Preview">
      <div className={styles.container}>
        
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <div className={styles.interactiveIndicator}>
            <FiGlobe className={styles.globeIcon} size={15} />
            <span>Interactive Demo Canvas</span>
          </div>
          <h2 className={styles.previewTitle}>{headline}</h2>
          <p className={styles.previewSubtitle}>{subheadline}</p>
        </div>

        {/* CURRENCY SWITCHER CONTROLS */}
        <div className={styles.switcherBar}>
          <span className={styles.switchLabel}>Simulate Base Currency:</span>
          <div className={styles.toggleGroup}>
            {(Object.keys(DEMO_PRESETS) as CurrencyKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`${styles.currencyBtn} ${selectedCurrency === key ? styles.currencyBtnActive : ""}`}
                onClick={() => setSelectedCurrency(key)}
              >
                <span>{DEMO_PRESETS[key].flag}</span>
                <span>{key} ({DEMO_PRESETS[key].symbol})</span>
                {selectedCurrency === key && <FiCheck className={styles.checkMini} size={13} />}
              </button>
            ))}
          </div>
        </div>

        {/* SIMULATED DASHBOARD CANVAS */}
        <div className={styles.mockupFrame}>
          
          {/* TOP BROWSER BAR */}
          <div className={styles.windowTopBar}>
            <div className={styles.windowControls}>
              <span className={`${styles.circleDot} ${styles.dotRed}`} />
              <span className={`${styles.circleDot} ${styles.dotYellow}`} />
              <span className={`${styles.circleDot} ${styles.dotGreen}`} />
            </div>
            <div className={styles.windowUrlField}>
              app.rakhokhata.com/dashboard • Workspace: <strong>{data.workspace}</strong>
            </div>
          </div>

          {/* DASHBOARD INNER BODY */}
          <div className={styles.dashboardBody}>
            
            {/* WORKSPACE HEADER BAR */}
            <div className={styles.workspaceRow}>
              <div className={styles.activeWorkspaceBadge}>
                {selectedCurrency === "USD" ? <FiBriefcase size={16} /> : <FiUser size={16} />}
                <span>{data.workspace}</span>
              </div>
              <div className={styles.exchangeRatePill}>
                <span className={styles.livePulse} />
                <span>1 USD = {data.rateVsUSD} {data.code} (Live Bank Rate)</span>
              </div>
            </div>

            {/* 3 METRIC CARDS */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabelRow}>
                  <span>Total Inflow</span>
                  <div className={`${styles.metricIconBox} ${styles.iconGreen}`}>
                    <FiArrowUpRight size={16} />
                  </div>
                </div>
                <p className={styles.metricValue}>
                  {data.symbol} {formatNumber(data.monthlyIncome)}
                </p>
                <span className={styles.metricMetaText}>+18.4% from last period</span>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricLabelRow}>
                  <span>Total Expenses</span>
                  <div className={`${styles.metricIconBox} ${styles.iconRed}`}>
                    <FiArrowDownLeft size={16} />
                  </div>
                </div>
                <p className={styles.metricValue}>
                  {data.symbol} {formatNumber(data.monthlyExpenses)}
                </p>
                <span className={styles.metricMetaText}>Normalized to {data.code}</span>
              </div>

              <div className={`${styles.metricCard} ${styles.highlightCard}`}>
                <div className={styles.metricLabelRow}>
                  <span>Safe To Spend</span>
                  <div className={`${styles.metricIconBox} ${styles.iconPurple}`}>
                    <FiTrendingUp size={16} />
                  </div>
                </div>
                <p className={`${styles.metricValue} ${styles.highlightText}`}>
                  {data.symbol} {formatNumber(data.safeToSpend)}
                </p>
                <span className={styles.metricMetaText}>Available unallocated cash</span>
              </div>
            </div>

            {/* RECENT TRANSACTION LEDGER TABLE */}
            <div className={styles.ledgerSection}>
              <div className={styles.ledgerHeader}>
                <h4 className={styles.ledgerTitle}>Recent Multi-Currency Transactions</h4>
                <span className={styles.autoConvertedBadge}>Auto-Converted to Base {data.code}</span>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.txTable}>
                  <thead>
                    <tr>
                      <th>Transaction Details</th>
                      <th>Category</th>
                      <th>Logged As</th>
                      <th style={{ textAlign: "right" }}>Converted Amount ({data.code})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTx.map((tx, idx) => (
                      <tr key={idx}>
                        <td className={styles.txNameCell}>
                          <div className={`${styles.txTypeIndicator} ${tx.type === "INCOME" ? styles.txGreen : styles.txRed}`} />
                          <span>{tx.title}</span>
                        </td>
                        <td>
                          <span className={styles.categoryBadge}>{tx.category}</span>
                        </td>
                        <td className={styles.originalCodeCell}>{tx.original}</td>
                        <td className={`${styles.txAmountCell} ${tx.type === "INCOME" ? styles.amountIncome : styles.amountExpense}`}>
                          {tx.type === "INCOME" ? "+" : "-"}{data.symbol}{formatNumber(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}