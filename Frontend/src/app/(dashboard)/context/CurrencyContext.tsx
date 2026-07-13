// src/app/(dashboard)/context/CurrencyContext.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { createContext, useContext, useState, useEffect } from "react";
import { getExchangeRates } from "@/utils/exchangeRate";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES ===
   ========================================================================== */
interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatAmount: (amount: number, sourceCurrency?: string) => string;
  convertAmount: (amount: number, from: string, to: string) => number;
  isLoadingRates: boolean;
}

interface CurrencyProviderProps {
  children: React.ReactNode;
}

type RateMap = Record<string, number>;
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CONTEXT ===
   ========================================================================== */
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<string>("USD");
  const [rates, setRates] = useState<RateMap>({ USD: 1 });
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(true);

  // Fetch live exchange rates on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRates = async () => {
      try {
        const exchangeRates = await getExchangeRates();
        if (isMounted) {
          setRates(exchangeRates);
          setIsLoadingRates(false);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        // Fallback to USD-only (no conversion) if API fails
        if (isMounted) {
          setRates({ USD: 1 });
          setIsLoadingRates(false);
        }
      }
    };
    fetchRates();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Convert an amount from one currency to another.
   * If rates are still loading, falls back to a 1:1 conversion.
   */
  const convertAmount = (amount: number, from: string, to: string): number => {
    if (isLoadingRates || amount === 0 || from === to) {
      return amount;
    }

    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    const rateFrom = rates[fromUpper];
    const rateTo = rates[toUpper];

    // If we don't have rates for these currencies, return the original amount
    if (!rateFrom || !rateTo) {
      return amount;
    }

    const converted = (amount / rateFrom) * rateTo;
    return Math.round(converted * 100) / 100;
  };

  /**
   * Format an amount with the current currency symbol.
   */
  const formatAmount = (amount: number, sourceCurrency?: string): string => {
    // If a source currency is provided, convert it to the active currency
    const finalAmount = sourceCurrency
      ? convertAmount(amount, sourceCurrency, currency)
      : amount;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(finalAmount);
  };

  const value = {
    currency,
    setCurrency,
    formatAmount,
    convertAmount,
    isLoadingRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
/* === SECTION 3 END === */