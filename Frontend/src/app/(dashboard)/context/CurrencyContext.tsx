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
   === SECTION 3: FALLBACK RATES & CACHE HELPERS ===
   ========================================================================== */
// Hardcoded fallback rates (approximate, used only if API and cache fail)
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

/**
 * Load cached rates from localStorage if they are still valid.
 */
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

/**
 * Save rates to localStorage with a timestamp.
 */
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
  // Load currency preference from localStorage (optional)
  const [currency, setCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem("preferredCurrency") || "USD";
    } catch {
      return "USD";
    }
  });

  // Initialize rates from cache or fallback
  const cachedRates = loadCachedRates();
  const [rates, setRates] = useState<RateMap>(cachedRates || FALLBACK_RATES);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(!cachedRates);

  // Save currency preference
  useEffect(() => {
    try {
      localStorage.setItem("preferredCurrency", currency);
    } catch {
      // ignore
    }
  }, [currency]);

  // Fetch live exchange rates
  useEffect(() => {
    let isMounted = true;

    const fetchRates = async () => {
      try {
        const exchangeRates = await getExchangeRates();
        if (isMounted) {
          setRates(exchangeRates);
          saveCachedRates(exchangeRates);
          setIsLoadingRates(false);
        }
      } catch (error) {
        console.warn("Failed to fetch exchange rates:", error);
        // If we have cached rates, keep them; otherwise fallback
        if (isMounted) {
          const cached = loadCachedRates();
          if (cached) {
            setRates(cached);
          } else {
            setRates(FALLBACK_RATES);
          }
          setIsLoadingRates(false);
        }
      }
    };

    fetchRates();

    // Refresh rates every hour
    const interval = setInterval(fetchRates, CACHE_EXPIRY_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  /**
   * Convert an amount from one currency to another.
   * Always uses the latest available rates (cached, fallback, or live).
   */
  const convertAmount = (amount: number, from: string, to: string): number => {
    if (amount === 0 || from === to) return amount;

    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    const rateFrom = rates[fromUpper];
    const rateTo = rates[toUpper];

    // If either rate is missing, try to use fallback rates as a last resort
    if (!rateFrom || !rateTo) {
      console.warn(`Missing exchange rate for ${fromUpper} or ${toUpper}, using fallback.`);
      const fallbackFrom = FALLBACK_RATES[fromUpper];
      const fallbackTo = FALLBACK_RATES[toUpper];
      if (fallbackFrom && fallbackTo) {
        return Math.round((amount / fallbackFrom) * fallbackTo * 100) / 100;
      }
      // If still missing, return the original amount (no conversion)
      return amount;
    }

    const converted = (amount / rateFrom) * rateTo;
    return Math.round(converted * 100) / 100;
  };

  /**
   * Format an amount with the current currency symbol.
   */
  const formatAmount = (amount: number, sourceCurrency?: string): string => {
    const finalAmount = sourceCurrency
      ? convertAmount(amount, sourceCurrency, currency)
      : amount;

    // If the final amount is NaN or Infinity, show 0
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
/* === SECTION 4 END === */