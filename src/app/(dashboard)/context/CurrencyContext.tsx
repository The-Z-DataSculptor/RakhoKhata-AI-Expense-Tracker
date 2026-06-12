// src/app/(dashboard)/context/CurrencyContext.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES START ===
   ========================================================================== */
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES AND INTERFACES START ===
   ========================================================================== */
export type CurrencyType = "PKR" | "USD" | "EUR" | "GBP" | "INR" | "AED" | "SAR" | "KWD" | "OMR" | "QAR" | "BHD";

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  formatAmount: (amount: number, sourceCurrency?: CurrencyType) => string;
  convertAmount: (amount: number, from: CurrencyType, to: CurrencyType) => number;
}

// WHY: Custom English-friendly display symbols. 
// This guarantees that text always renders left-to-right with exact spacing constraints.
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
  QAR: "QAR ",
  BHD: "BHD ",
};

// WHY: Using 1 USD as the absolute baseline master anchor standard value.
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
  QAR: 3.64,
  BHD: 0.38,
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC START ===
   ========================================================================== */
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyType>("PKR");

  // WHY: Converts any numeric coordinate safely from one currency to another using the USD anchor rule.
  const convertAmount = (amount: number, from: CurrencyType, to: CurrencyType): number => {
    if (from === to) return amount;
    
    // Step 1: Normalize incoming transaction values to base USD
    const amountInUSD = amount / EXCHANGE_RATES_TO_1_USD[from];
    
    // Step 2: Multiply base USD balance against target country multiplier exchange rate index
    const convertedValue = amountInUSD * EXCHANGE_RATES_TO_1_USD[to];
    
    return convertedValue;
  };

  // WHY: Formats numbers cleanly into uniform English typography with static symbol prefix positions.
  const formatAmount = (amount: number, sourceCurrency: CurrencyType = "USD") => {
    // 1. Calculate the active cross-currency conversion value
    const convertedValue = convertAmount(amount, sourceCurrency, currency);

    // 2. Format the number using a static 'en-US' engine locale layout rule.
    // This locks all digits to English numbers (1, 2, 3) and standard decimal commas.
    const formattedNumber = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: currency === "USD" || currency === "EUR" ? 2 : 0, // Keep cents for USD/EUR, clear for others
      maximumFractionDigits: currency === "USD" || currency === "EUR" ? 2 : 0,
    }).format(convertedValue);

    // 3. Extract our uniform English-facing symbol prefix token
    const symbolPrefix = CURRENCY_SYMBOLS[currency] || "";

    // 4. Return the combined string. Symbol is ALWAYS at the start, numbers are ALWAYS English.
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