// src/utils/exchangeRate.ts

/* ==========================================================================
   === SECTION 1: TYPES & DATA CONTRACTS ===
   ========================================================================== */
/** Raw response shape from the backend exchange‑rate proxy */
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

/** Serialisable cache entry stored in memory or localStorage */
interface CachedRates {
  rates: Record<string, number>;
  timestamp: number; // milliseconds since Unix epoch
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CACHE UTILITIES ===
   ========================================================================== */
const LOCAL_STORAGE_KEY = "rakho_khata_live_rates";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// In‑memory fallback for server‑side rendering environments
let memoryCache: CachedRates | null = null;

/**
 * Persists the given rate map in both the in‑memory cache and, when available,
 * the browser's localStorage.
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
      localStorage.removeItem(LOCAL_STORAGE_KEY); // corrupted data
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
 */
async function fetchFreshRates(): Promise<Record<string, number>> {
  const endpoint = "http://localhost:5000/api/auth/exchange-rates";

  const response = await fetch(endpoint);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Backend exchange rate proxy error: ${response.status} – ${errorBody}`
    );
  }

  const data: ExchangeRateResponse = await response.json();

  if (data.result !== "success") {
    throw new Error(
      `Exchange rate engine returned unsuccessful result: ${data.result}`
    );
  }

  return data.conversion_rates;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PUBLIC API ===
   ========================================================================== */

/**
 * Returns the best available exchange rates, using the cache when possible
 * and falling back to a stale cache or throwing if completely unavailable.
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
    console.error("Failed to fetch fresh exchange rates:", error);

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

    throw error; // No rates available at all
  }
}

/**
 * Converts an amount from one currency to another using the live (or cached) rates.
 * If the source and target currencies are the same, the original amount is returned.
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (amount === 0 || fromCurrency === toCurrency) return amount;

  const rates = await getExchangeRates();
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  const rateFrom = rates[from];
  if (!rateFrom) {
    throw new Error(
      `Source currency "${from}" is not available in the exchange rate matrix.`
    );
  }
  const rateTo = rates[to];
  if (!rateTo) {
    throw new Error(
      `Target currency "${to}" is not available in the exchange rate matrix.`
    );
  }

  const converted = (amount / rateFrom) * rateTo;
  return Math.round(converted * 100) / 100;
}
/* === SECTION 3 END === */