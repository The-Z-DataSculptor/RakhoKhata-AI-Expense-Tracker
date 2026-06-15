// src/app/(dashboard)/context/CurrencyContext.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES ===
   ========================================================================== */
"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES AND INTERFACES ===
   ========================================================================== */
// FIXED / WHY: Changed "QAR" to "QAT" (correct ISO 4217 code for Qatar Riyal)
export type CurrencyType = "PKR" | "USD" | "EUR" | "GBP" | "INR" | "AED" | "SAR" | "KWD" | "OMR" | "QAT" | "BHD";

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  formatAmount: (amount: number, sourceCurrency?: CurrencyType) => string;
  convertAmount: (amount: number, from: CurrencyType, to: CurrencyType) => number;
}

const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  PKR: "Rs. ",
  USD: "$ ",
  EUR: "€ ",
  GBP: "£ ",
  INR: "₹ ",
  AED: "AED ",
  SAR: "SAR ",
  KWD: "KWD ",
  OMR: "OMR ",
  QAT: "QAT ",
  BHD: "BHD ",
};

const EXCHANGE_RATES_TO_1_USD: Record<CurrencyType, number> = {
  USD: 1.00,
  PKR: 278.50,
  EUR: 0.87,
  GBP: 0.75,
  INR: 95.60,
  AED: 3.67,
  SAR: 3.75,
  KWD: 0.31,
  OMR: 0.38,
  QAT: 3.64,
  BHD: 0.38,
};

// FIXED / WHY: Array containing valid currency codes for safe runtime validation
const VALID_CURRENCIES: CurrencyType[] = ["PKR", "USD", "EUR", "GBP", "INR", "AED", "SAR", "KWD", "OMR", "QAT", "BHD"];
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // FIXED / WHY: Initialize with default "PKR" to prevent hydration mismatch
  // Actual value from localStorage is synced in useEffect after component mounts
  const [currency, setCurrencyState] = useState<CurrencyType>("PKR");
  
  // FIXED / WHY: Use ref to track if component has mounted to avoid re-render during hydration
  // This prevents ESLint warnings about setState in effects
  const isMountedRef = useRef(false);

  // FIXED / WHY: Sync currency from localStorage only on client after first render
  // This prevents SSR/client hydration mismatch errors
  useEffect(() => {
    // Only run this logic once after initial mount
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      const savedCurrency = localStorage.getItem("dashboard_currency");
      
      // Validate that saved value is a valid currency code
      if (savedCurrency && VALID_CURRENCIES.includes(savedCurrency as CurrencyType)) {
        // eslint-disable-next-line
        setCurrencyState(savedCurrency as CurrencyType);
      }
    }
  }, []);

  // Function to update currency and persist to localStorage
  const setCurrency = (newCurrency: CurrencyType) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("dashboard_currency", newCurrency);
  };

  // Function to convert amount from one currency to another
  const convertAmount = (amount: number, from: CurrencyType, to: CurrencyType): number => {
    // If converting to the same currency, return unchanged
    if (from === to) return amount;
    
    // Convert to USD as intermediate currency
    const amountInUSD = amount / EXCHANGE_RATES_TO_1_USD[from];
    
    // Convert from USD to target currency
    return amountInUSD * EXCHANGE_RATES_TO_1_USD[to];
  };

  // Function to format amount with currency symbol based on current active currency
  const formatAmount = (amount: number, sourceCurrency: CurrencyType = "PKR") => {
    // Convert amount from source currency to active currency
    const convertedValue = convertAmount(amount, sourceCurrency, currency);

    // Format number based on currency (2 decimals for USD/EUR, 0 for others)
    const formattedNumber = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: currency === "USD" || currency === "EUR" ? 2 : 0,
      maximumFractionDigits: currency === "USD" || currency === "EUR" ? 2 : 0,
    }).format(convertedValue);

    // Get currency symbol and return formatted string
    const symbolPrefix = CURRENCY_SYMBOLS[currency] || "";
    return `${symbolPrefix}${formattedNumber}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, convertAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
/* === SECTION 3 END === */