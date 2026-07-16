// src/app/(dashboard)/context/CurrencyContext.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
   === SECTION 3: FALLBACK RATES & CACHE HELPERS ===
   ========================================================================== */
const FALLBACK_RATES: RateMap = {
  USD: 1,
  PKR: 278,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83,
  AED: 3.67,
  SAR: 3.75,
  KWD: 0.31,
  OMR: 0.38,
  QAR: 3.64,
  BHD: 0.38,
};

const CACHE_KEY = "exchangeRates";
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function loadCachedRates(): RateMap | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (parsed && parsed.timestamp && parsed.rates) {
      const age = Date.now() - parsed.timestamp;
      if (age < CACHE_EXPIRY_MS) {
        return parsed.rates;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function saveCachedRates(rates: RateMap): void {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), rates })
    );
  } catch {
    // ignore
  }
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: CONTEXT ===
   ========================================================================== */
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem("preferredCurrency") || "USD";
    } catch {
      return "USD";
    }
  });

  // Start with fallback rates; a later effect will load cached/live ones.
  const [rates, setRates] = useState<RateMap>(FALLBACK_RATES);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(true);

  // Save currency preference when it changes
  useEffect(() => {
    try {
      localStorage.setItem("preferredCurrency", currency);
    } catch {
      // ignore
    }
  }, [currency]);

  // Load rates on mount: try cache first, then fetch fresh.
  useEffect(() => {
    let cancelled = false;

    const initRates = async () => {
      // 1. Try to load from valid cache
      const cached = loadCachedRates();
      if (cached) {
        if (!cancelled) {
          setRates(cached);
          setIsLoadingRates(false);
        }
        return; // no need to fetch
      }

      // 2. No cache, fetch live
      try {
        const exchangeRates = await getExchangeRates();
        if (!cancelled) {
          setRates(exchangeRates);
          saveCachedRates(exchangeRates);
          setIsLoadingRates(false);
        }
      } catch (error) {
        console.warn("Failed to fetch exchange rates:", error);
        if (!cancelled) {
          // keep fallback rates
          setIsLoadingRates(false);
        }
      }
    };

    initRates();

    return () => {
      cancelled = true;
    };
  }, []); // runs once on mount

  /**
   * When the user changes currency, fetch fresh rates to ensure accurate conversion.
   */
  const changeCurrency = useCallback(async (newCurrency: string) => {
    setCurrency(newCurrency);
    setIsLoadingRates(true);
    try {
      const exchangeRates = await getExchangeRates();
      setRates(exchangeRates);
      saveCachedRates(exchangeRates);
    } catch (error) {
      console.warn("Failed to fetch fresh rates on currency change:", error);
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  /**
   * Convert an amount from one currency to another.
   */
  const convertAmount = (amount: number, from: string, to: string): number => {
    if (amount === 0 || from === to) return amount;

    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    const rateFrom = rates[fromUpper];
    const rateTo = rates[toUpper];

    if (!rateFrom || !rateTo) {
      console.warn(`Missing exchange rate for ${fromUpper} or ${toUpper}, using fallback.`);
      const fallbackFrom = FALLBACK_RATES[fromUpper];
      const fallbackTo = FALLBACK_RATES[toUpper];
      if (fallbackFrom && fallbackTo) {
        return Math.round((amount / fallbackFrom) * fallbackTo * 100) / 100;
      }
      return amount;
    }

    const converted = (amount / rateFrom) * rateTo;
    return Math.round(converted * 100) / 100;
  };

  /**
   * Format an amount with the current currency symbol.
   * 🔥 FIX: When sourceCurrency equals display currency, NO conversion is done.
   */
  const formatAmount = (amount: number, sourceCurrency?: string): string => {
    const finalAmount = sourceCurrency
      ? sourceCurrency.toUpperCase() === currency.toUpperCase()
        ? amount   // ← no conversion when displaying in the same currency
        : convertAmount(amount, sourceCurrency, currency)
      : amount;

    if (!isFinite(finalAmount)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(0);
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(finalAmount);
  };

  const value = {
    currency,
    setCurrency: changeCurrency,
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