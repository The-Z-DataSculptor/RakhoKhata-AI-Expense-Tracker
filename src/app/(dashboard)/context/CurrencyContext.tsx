// src/app/(dashboard)/context/CurrencyContext.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
// FIX: Changed "QAT" back to "QAR". QAR is the universally accepted standard code for Qatar.
export type CurrencyType = "PKR" | "USD" | "EUR" | "GBP" | "INR" | "AED" | "SAR" | "KWD" | "OMR" | "QAR" | "BHD";

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  formatAmount: (amount: number, sourceCurrency?: CurrencyType) => string;
  convertAmount: (amount: number, from: CurrencyType, to: CurrencyType) => number;
}

// Define how the symbols look when printed on the screen
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

// Static conversion rates (Base: 1 USD)
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

// A simple array to check if a saved currency is safe to use
const VALID_CURRENCIES: CurrencyType[] = ["PKR", "USD", "EUR", "GBP", "INR", "AED", "SAR", "KWD", "OMR", "QAR", "BHD"];
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // We start with PKR as the default before the browser has time to check saved settings
  const [currency, setCurrencyState] = useState<CurrencyType>("PKR");

  // We use this reference to make sure we only read from the browser's memory once
  const isMountedRef = useRef(false);

  // When the app first loads, check if the user has a saved currency from a previous visit
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      const savedCurrency = localStorage.getItem("dashboard_currency");

      // If they have a saved currency and it's in our approved list, use it!
      if (savedCurrency && VALID_CURRENCIES.includes(savedCurrency as CurrencyType)) {
        setCurrencyState(savedCurrency as CurrencyType);
      }
    }
  }, []);

  // Action: Updates the currency on screen AND saves it to the browser for next time
  const setCurrency = (newCurrency: CurrencyType) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("dashboard_currency", newCurrency);
  };

  // Action: Does the math to convert money from one country's value to another
  const convertAmount = (amount: number, from: CurrencyType, to: CurrencyType): number => {
    if (from === to) return amount; // No math needed if they are the same!

    // Step 1: Convert original money into US Dollars first (as a middle ground)
    const amountInUSD = amount / EXCHANGE_RATES_TO_1_USD[from];

    // Step 2: Convert those US Dollars into the final target currency
    return amountInUSD * EXCHANGE_RATES_TO_1_USD[to];
  };

  // Action: Takes a raw number, converts it to the active currency, and adds commas and symbols
  const formatAmount = (amount: number, sourceCurrency: CurrencyType = "PKR") => {
    // Math: get the updated value based on what currency the user has chosen to view
    const convertedValue = convertAmount(amount, sourceCurrency, currency);

    // Visuals: Make the numbers look pretty (show cents for USD/EUR, whole numbers for others)
    const formattedNumber = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: currency === "USD" || currency === "EUR" ? 2 : 0,
      maximumFractionDigits: currency === "USD" || currency === "EUR" ? 2 : 0,
    }).format(convertedValue);

    // Attach the correct symbol (like $ or Rs.) to the front of the number
    const symbolPrefix = CURRENCY_SYMBOLS[currency] || "";
    return `${symbolPrefix}${formattedNumber}`;
  };

  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, convertAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Hook to use these tools easily in any other file
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
/* === SECTION 4 END === */