// src/utils/exchangeRate.ts

/* ==========================================================================
   === SECTION 1: TYPES & DATA CONTRACTS ===
   ========================================================================== */
/**
 * Raw response shape from the backend exchange‑rate proxy.
 * The backend hides the real API key and always returns this format.
 */
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

/**
 * Cache entry that can be stored in memory or in the browser's localStorage.
 * The timestamp tells us when the rates were fetched, so we can decide if
 * they are still fresh enough to use.
 */
interface CachedRates {
  rates: Record<string, number>;
  timestamp: number; // milliseconds since Unix epoch (Date.now())
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CACHE & FALLBACK UTILITIES ===
   ========================================================================== */
// Key used to store/retrieve the cached rate map in localStorage
const LOCAL_STORAGE_KEY = "rakho_khata_live_rates";

// Maximum age of cached rates before they are considered stale (1 hour)
const CACHE_TTL_MS = 60 * 60 * 1000;

/*
 * Dynamically resolve the API base URL so the same code works in
 * development, Docker containers, and production environments.
 * - Server‑side (SSR / middleware): prefers INTERNAL_API_URL, falls back
 *   to NEXT_PUBLIC_API_URL, then localhost.
 * - Client‑side: uses NEXT_PUBLIC_API_URL, falls back to localhost.
 */
const API_BASE_URL =
  typeof window === "undefined"
    ? (process.env.INTERNAL_API_URL ||
       process.env.NEXT_PUBLIC_API_URL ||
       "http://localhost:5000")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

/*
 * WHY THIS IS NEEDED:
 * If the backend proxy is completely unreachable AND no cache exists,
 * the app would otherwise crash. These hard‑coded fallback rates keep
 * the UI working with approximate values until a fresh connection can
 * be re‑established.
 */
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

// In‑memory cache that survives page reloads only if the browser tab stays open
let memoryCache: CachedRates | null = null;

/**
 * Persists the given rate map in both the in‑memory cache and,
 * when available, the browser's localStorage.
 */
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

/**
 * Retrieves a valid cached rate map from localStorage or the in‑memory cache.
 * Returns `null` when no fresh cache is available.
 */
function loadCachedRates(): Record<string, number> | null {
  const now = Date.now();

  // 1. Try browser localStorage
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
      // Corrupted data – remove it so we don't keep hitting the error
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  // 2. Fall back to in‑memory cache
  if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.rates;
  }

  return null;
}

/**
 * Fetches fresh exchange rates from the backend proxy (which hides the API key).
 *
 * WHY THIS IS NEEDED:
 * We never expose the real ExchangeRate API key in the browser.
 * The backend proxy handles that securely.
 */
async function fetchFreshRates(): Promise<Record<string, number>> {
  const endpoint = `${API_BASE_URL}/api/auth/exchange-rates`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // "no-store" ensures we always get a fresh copy from the proxy
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(
        `Backend exchange rate proxy warning (${response.status}): ${errorBody}`
      );
      // Use fallback rates when the server returns an error
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
    // 🛡️ Catches network errors ("Failed to fetch") without throwing
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

/**
 * Returns the best available exchange rates, using the cache when possible
 * and falling back to stale data or default rates if the server is offline.
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  // 1. Use fresh cache if available
  const cached = loadCachedRates();
  if (cached) return cached;

  // 2. Fetch from backend proxy
  try {
    const fresh = await fetchFreshRates();
    persistRates(fresh);
    return fresh;
  } catch (error: unknown) {
    console.warn(
      "Failed to fetch fresh exchange rates, checking stale cache:",
      error
    );

    // 3. Last resort: return stale cache (even if expired)
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

    // 4. Safe offline fallback if no cache or connection exists
    console.warn("Using default fallback exchange rates.");
    return FALLBACK_RATES;
  }
}

/**
 * Converts an amount from one currency to another using the live (or cached) rates.
 * If the source and target currencies are the same, the original amount is returned.
 *
 * WHY THIS IS NEEDED:
 * Every transaction and budget must be displayed in the user's chosen currency.
 * This function provides a reliable way to do that conversion without crashing
 * when the rate is missing (it falls back to the FALLBACK_RATES map).
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // No conversion needed when the currencies are identical or the amount is zero
  if (amount === 0 || fromCurrency === toCurrency) return amount;

  const rates = await getExchangeRates();
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  // Safely retrieve the exchange rate, using the fallback map as a second layer
  const rateFrom = rates[from] || FALLBACK_RATES[from] || 1;
  const rateTo = rates[to] || FALLBACK_RATES[to] || 1;

  // Perform the conversion and round to 2 decimal places
  const converted = (amount / rateFrom) * rateTo;
  return Math.round(converted * 100) / 100;
}
/* === SECTION 3 END === */