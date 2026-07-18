// src/app/(dashboard)/context/CurrencyContext.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getExchangeRates } from "@/utils/exchangeRate";
import { toast } from "sonner";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES ===
   ========================================================================== */
interface CurrencyContextType {
  currency: string;
  setCurrencyWithWorkspace: (newCurrency: string, workspaceId: string) => Promise<void>;
  initializeWorkspaceCurrency: (initialCurrency: string) => void;
  formatAmount: (amount: number, sourceCurrency?: string) => string;
  convertAmount: (amount: number, from: string, to: string) => number;
  isLoadingRates: boolean;
}

interface CurrencyProviderProps {
  children: React.ReactNode;
  initialCurrency?: string; // 🚀 FIXED: Prop addition receives true database workspace state from the server layout
}

type RateMap = Record<string, number>;
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: FALLBACK RATES ===
   ========================================================================== */
const FALLBACK_RATES: RateMap = {
  USD: 1, PKR: 278, EUR: 0.92, GBP: 0.78, INR: 83,
  AED: 3.67, SAR: 3.75, KWD: 0.31, OMR: 0.38, QAR: 3.64, BHD: 0.38,
  // 🚀 FIXED: Added mathematical fallback baselines for advanced currencies added during registration
  JPY: 155.5, CAD: 1.37, AUD: 1.51, SGD: 1.35, CHF: 0.90, CNY: 7.25,
  HKD: 7.80, NZD: 1.65, SEK: 10.60, KRW: 1380, NOK: 10.70, MXN: 18.20,
  RUB: 88.0, ZAR: 18.10, TRY: 32.80, BRL: 5.40, TWD: 32.40, PLN: 4.02,
  THB: 36.7, IDR: 16400, HUF: 368, DKK: 6.95, ILS: 3.72, CLP: 930,
  PHP: 58.7, COP: 4150, MYR: 4.71, RON: 4.60, VND: 25400
};
/* === SECTION 3 END === */

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children, initialCurrency = "USD" }: CurrencyProviderProps) {
  // 🚀 FIXED: Initializes state with the true server configuration instantly, avoiding the client-side flash of USD
  const [currency, setCurrency] = useState<string>(initialCurrency.toUpperCase());
  const [rates, setRates] = useState<RateMap>(FALLBACK_RATES);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(true);

  // Load global conversion rates on mount
  useEffect(() => {
    let cancelled = false;
    const initRates = async () => {
      try {
        const exchangeRates = await getExchangeRates();
        if (!cancelled) {
          setRates(exchangeRates);
          setIsLoadingRates(false);
        }
      } catch (error) {
        console.warn("Failed to fetch fresh live rates, using fallback system rates.", error);
        if (!cancelled) setIsLoadingRates(false);
      }
    };
    initRates();
    return () => { cancelled = true; };
  }, []);

  /**
   * Seeds the context with a dynamic preference structure if called post-hydration
   */
  const initializeWorkspaceCurrency = useCallback((incomingCurrency: string) => {
    if (incomingCurrency) {
      setCurrency(incomingCurrency.toUpperCase());
    }
  }, []);

  /**
   * Saves choice to cross-origin server layers securely with token authentication parameters
   */
  const setCurrencyWithWorkspace = useCallback(async (newCurrency: string, workspaceId: string) => {
    const formattedCurrency = newCurrency.toUpperCase();
    
    // 1. Instantly update UI text so charts and balance logs transform instantly
    setCurrency(formattedCurrency);
    setIsLoadingRates(true);

    if (!workspaceId) {
      console.warn("Workspace ID context missing. Skipping remote database sync.");
      setIsLoadingRates(false);
      return;
    }

    try {
      // 2. Fetch fresh exchange configurations in the background
      const exchangeRates = await getExchangeRates();
      setRates(exchangeRates);

      // 3. Dispatch persistent PUT route transaction straight across your backend framework layout
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Forces token authorization verification tracks to parse on cross-origin pipelines
        body: JSON.stringify({ currency: formattedCurrency }),
      });

      if (!response.ok) {
        throw new Error("Database update transaction failed.");
      }

      toast.success(`Currency switched to ${formattedCurrency} and saved!`);

    } catch (error) {
      console.error("Currency synchronization error:", error);
      toast.error("Could not save currency selection to database.");
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  const convertAmount = (amount: number, from: string, to: string): number => {
    if (amount === 0 || from === to) return amount;
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    const rateFrom = rates[fromUpper] || FALLBACK_RATES[fromUpper] || 1;
    const rateTo = rates[toUpper] || FALLBACK_RATES[toUpper] || 1;

    return Math.round(((amount / rateFrom) * rateTo) * 100) / 100;
  };

  const formatAmount = (amount: number, sourceCurrency?: string): string => {
    const finalAmount = sourceCurrency
      ? sourceCurrency.toUpperCase() === currency.toUpperCase()
        ? amount
        : convertAmount(amount, sourceCurrency, currency)
      : amount;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(isFinite(finalAmount) ? finalAmount : 0);
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrencyWithWorkspace,
      initializeWorkspaceCurrency,
      formatAmount,
      convertAmount,
      isLoadingRates
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}