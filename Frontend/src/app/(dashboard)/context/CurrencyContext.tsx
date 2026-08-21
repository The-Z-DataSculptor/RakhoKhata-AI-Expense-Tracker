// src/app/(dashboard)/context/CurrencyContext.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getExchangeRates } from "@/utils/exchangeRate";
import { workspaceService } from "@/utils/api";
import { useWorkspace } from "./WorkspaceContext";
import { toast } from "sonner";

// ----- Fallback exchange rates used when the API is unavailable -----
const FALLBACK_RATES: Record<string, number> = {
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
  JPY: 155.5,
  CAD: 1.37,
  AUD: 1.51,
  SGD: 1.35,
  CHF: 0.9,
  CNY: 7.25,
  HKD: 7.8,
  NZD: 1.65,
  SEK: 10.6,
  KRW: 1380,
  NOK: 10.7,
  MXN: 18.2,
  RUB: 88.0,
  ZAR: 18.1,
  TRY: 32.8,
  BRL: 5.4,
  TWD: 32.4,
  PLN: 4.02,
  THB: 36.7,
  IDR: 16400,
  HUF: 368,
  DKK: 6.95,
  ILS: 3.72,
  CLP: 930,
  PHP: 58.7,
  COP: 4150,
  MYR: 4.71,
  RON: 4.6,
  VND: 25400,
};
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

interface CurrencyContextType {
  currency: string;
  setCurrencyWithWorkspace: (
    newCurrency: string,
    workspaceId: string
  ) => Promise<void>;
  initializeWorkspaceCurrency: (initialCurrency: string) => void;
  formatAmount: (amount: number, sourceCurrency?: string) => string;
  convertAmount: (amount: number, from: string, to: string) => number;
  isLoadingRates: boolean;
}

interface CurrencyProviderProps {
  children: React.ReactNode;
  initialCurrency?: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PROVIDER & HANDLERS ===
   ========================================================================== */

export function CurrencyProvider({
  children,
  initialCurrency = "USD",
}: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<string>(
    initialCurrency.toUpperCase()
  );
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(true);
  const { updateWorkspaceInState } = useWorkspace();

  // 1. Load fresh exchange rates on mount
  useEffect(() => {
    let cancelled = false;
    const fetchRates = async () => {
      try {
        const freshRates = await getExchangeRates();
        if (!cancelled) {
          setRates(freshRates);
          setIsLoadingRates(false);
        }
      } catch (error: unknown) {
        console.warn(
          "Failed to fetch live exchange rates; using fallback values.",
          error
        );
        if (!cancelled) setIsLoadingRates(false);
      }
    };
    void fetchRates();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Synchronise currency after workspace hydration
  const initializeWorkspaceCurrency = useCallback(
    (incomingCurrency: string) => {
      if (incomingCurrency) {
        setCurrency(incomingCurrency.toUpperCase());
      }
    },
    []
  );

  // 3. Change currency for active workspace and persist to backend via workspaceService
  const setCurrencyWithWorkspace = useCallback(
    async (newCurrency: string, workspaceId: string) => {
      const formattedCurrency = newCurrency.toUpperCase();

      setCurrency(formattedCurrency);
      setIsLoadingRates(true);

      if (!workspaceId) {
        console.warn("Workspace ID missing – currency change not persisted.");
        setIsLoadingRates(false);
        return;
      }

      try {
        const freshRates = await getExchangeRates();
        setRates(freshRates);

        await workspaceService.update(workspaceId, {
          currency: formattedCurrency,
        });

        // Synchronize currency update across WorkspaceContext state as well
        updateWorkspaceInState(workspaceId, { currency: formattedCurrency });

        toast.success(
          `Currency switched to ${formattedCurrency} and saved!`
        );
      } catch (error: unknown) {
        console.error("Currency synchronization error:", error);
        toast.error("Could not save currency selection to the database.");
      } finally {
        setIsLoadingRates(false);
      }
    },
    [updateWorkspaceInState]
  );

  // 4. Convert amount between currencies
  const convertAmount = useCallback(
    (amount: number, from: string, to: string): number => {
      if (amount === 0 || from === to) return amount;

      const fromUpper = from.toUpperCase();
      const toUpper = to.toUpperCase();

      const rateFrom = rates[fromUpper] ?? FALLBACK_RATES[fromUpper] ?? 1;
      const rateTo = rates[toUpper] ?? FALLBACK_RATES[toUpper] ?? 1;

      return Math.round(((amount / rateFrom) * rateTo) * 100) / 100;
    },
    [rates]
  );

  // 5. Format amount as currency string
  const formatAmount = useCallback(
    (amount: number, sourceCurrency?: string): string => {
      const finalAmount =
        sourceCurrency &&
        sourceCurrency.toUpperCase() === currency.toUpperCase()
          ? amount
          : sourceCurrency
            ? convertAmount(amount, sourceCurrency, currency)
            : amount;

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(isFinite(finalAmount) ? finalAmount : 0);
    },
    [currency, convertAmount]
  );

  const contextValue: CurrencyContextType = {
    currency,
    setCurrencyWithWorkspace,
    initializeWorkspaceCurrency,
    formatAmount,
    convertAmount,
    isLoadingRates,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPORTED HOOK ===
   ========================================================================== */

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error(
      "useCurrency must be used within a CurrencyProvider"
    );
  }
  return context;
}
/* === SECTION 4 END === */