// src/utils/exchangeRate.ts

/* ==========================================================================
   === SECTION 1: TYPES & DATA CONTRACTS ===
   ========================================================================== */
interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

interface CachedRates {
  rates: Record<string, number>;
  timestamp: number;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CACHE & FALLBACK UTILITIES ===
   ========================================================================== */
const LOCAL_STORAGE_KEY = "rakho_khaata_live_rates";
const CACHE_TTL_MS = 60 * 60 * 1000;

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  PKR: 278.50,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83.50,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.37,
  AUD: 1.50,
  CNY: 7.25,
  JPY: 155.5,
  KRW: 1380,
  MYR: 4.71,
  THB: 36.7,
  VND: 25400,
};

let memoryCache: CachedRates | null = null;

function persistRates(rates: Record<string, number>): void {
  const payload: CachedRates = { rates, timestamp: Date.now() };
  memoryCache = payload;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (error: unknown) {
      console.warn("Failed to write exchange rates to localStorage:", error);
    }
  }
}

function loadCachedRates(): Record<string, number> | null {
  const now = Date.now();

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed: CachedRates = JSON.parse(raw);
        if (parsed?.rates && now - parsed.timestamp < CACHE_TTL_MS) {
          return parsed.rates;
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.rates;
  }

  return null;
}

/**
 * Fetches fresh exchange rates using relative /api path for same-origin proxying.
 */
async function fetchFreshRates(): Promise<Record<string, number>> {
  // ⬇️ FIXED: Uses relative /api endpoint so server rewrites proxy the request
  const endpoint = "/api/auth/exchange-rates";

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(
        `Backend exchange rate proxy warning (${response.status}): ${errorBody}`
      );
      return FALLBACK_RATES;
    }

    const data: ExchangeRateResponse = await response.json();

    if (data.result !== "success" || !data.conversion_rates) {
      console.warn(
        `Exchange rate engine warning: result is "${data?.result}"`
      );
      return FALLBACK_RATES;
    }

    return data.conversion_rates;
  } catch (error: unknown) {
    console.warn(
      "⚠️ Unable to reach exchange rate server. Using offline fallback rates.",
      error
    );
    return FALLBACK_RATES;
  }
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PUBLIC API ===
   ========================================================================== */

export async function getExchangeRates(): Promise<Record<string, number>> {
  const cached = loadCachedRates();
  if (cached) return cached;

  try {
    const fresh = await fetchFreshRates();
    persistRates(fresh);
    return fresh;
  } catch (error: unknown) {
    console.warn(
      "Failed to fetch fresh exchange rates, checking stale cache:",
      error
    );

    if (memoryCache) {
      console.warn("Using stale in‑memory exchange rates.");
      return memoryCache.rates;
    }

    if (typeof window !== "undefined") {
      try {
        const historicalRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (historicalRaw) {
          const parsed: CachedRates = JSON.parse(historicalRaw);
          if (parsed?.rates) {
            console.warn("Using stale localStorage exchange rates.");
            return parsed.rates;
          }
        }
      } catch {
        // ignore
      }
    }

    console.warn("Using default fallback exchange rates.");
    return FALLBACK_RATES;
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (amount === 0 || fromCurrency === toCurrency) return amount;

  const rates = await getExchangeRates();
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  const rateFrom = rates[from] || FALLBACK_RATES[from] || 1;
  const rateTo = rates[to] || FALLBACK_RATES[to] || 1;

  const converted = (amount / rateFrom) * rateTo;
  return Math.round(converted * 100) / 100;
}
/* === SECTION 3 END === */