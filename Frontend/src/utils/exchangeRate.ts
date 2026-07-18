// src/utils/exchangeRate.ts

/* ==========================================================================
   === SECTION 1: TYPES ===
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
  timestamp: number; // Unix timestamp in milliseconds
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HYBRID CACHE HELPERS ===
   ========================================================================== */
const CACHE_KEY = "rakho_khata_live_rates";
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour persistent window

// In-memory fallback layer used when executing inside SSR server contexts
let memoryCache: CachedRates | null = null;

/**
 * Safely writes the retrieved rate matrix down to local storage tracks
 */
function saveRatesToCache(rates: Record<string, number>): void {
  const cachePayload: CachedRates = {
    rates,
    timestamp: Date.now(),
  };
  
  // Always update memory stack
  memoryCache = cachePayload;

  // Safely attempt to persist to browser storage if executing on the client
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
    } catch (e) {
      console.warn("Failed to write exchange rates to localStorage:", e);
    }
  }
}

/**
 * Attempts to retrieve valid cached rates from client storage or server memory tracks
 */
function loadRatesFromCache(): Record<string, number> | null {
  const now = Date.now();

  // 1. Check client browser storage first if environment permits
  if (typeof window !== "undefined") {
    try {
      const standardCache = localStorage.getItem(CACHE_KEY);
      if (standardCache) {
        const parsed: CachedRates = JSON.parse(standardCache);
        if (parsed && parsed.rates && (now - parsed.timestamp < CACHE_EXPIRY_MS)) {
          return parsed.rates;
        }
      }
    } catch {
      // Clear corrupt cache data silently
      localStorage.removeItem(CACHE_KEY);
    }
  }

  // 2. Fall back to internal memory frames if server layout is rendering
  if (memoryCache && (now - memoryCache.timestamp < CACHE_EXPIRY_MS)) {
    return memoryCache.rates;
  }

  return null;
}

/**
 * Extracts the API access keys from current execution runtime vectors
 */
function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_EXCHANGE_RATE_API_KEY environment variable. " +
      "Please map it inside your active .env.local file framework tracks."
    );
  }
  return key;
}

/**
 * Fires a network trip to pull fresh conversion maps from the external marketplace endpoints
 */
async function fetchFreshRates(): Promise<Record<string, number>> {
  const apiKey = getApiKey();
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

  const response = await fetch(url, {
    next: { revalidate: 3600 } // Instructs Next.js internal data fetching mechanisms to reuse tracks for 1hr
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Exchange Rate API connection breakdown: ${response.status} - ${errorText}`);
  }

  const data: ExchangeRateResponse = await response.json();

  if (data.result !== "success") {
    throw new Error(`Exchange Rate remote engine rejected signature parameter payload: ${data.result}`);
  }

  return data.conversion_rates;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PUBLIC API ===
   ========================================================================== */
/**
 * Resolves available exchange rates, testing persistent registries before hitting external network pipes.
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  // 1. Attempt lookup inside secure local cache maps
  const activeCachedMap = loadRatesFromCache();
  if (activeCachedMap) {
    return activeCachedMap;
  }

  // 2. Dispatch data requests across system boundaries if cache expired or is absent
  try {
    const freshRates = await fetchFreshRates();
    saveRatesToCache(freshRates);
    return freshRates;
  } catch (error) {
    console.error("Failed to synchronize fresh live exchange layers:", error);

    // Emergency Fallback: If network drops but an old stale cache map remains, treat it as a valid shield
    if (typeof window !== "undefined") {
      try {
        const historicalCache = localStorage.getItem(CACHE_KEY);
        if (historicalCache) {
          const parsed: CachedRates = JSON.parse(historicalCache);
          if (parsed && parsed.rates) {
            console.warn("Recovered connection layer metrics using stale browser historical tracks.");
            return parsed.rates;
          }
        }
      } catch {
        // Fall through to error handlers
      }
    }

    if (memoryCache) {
      console.warn("Recovered connection layer metrics using stale in-memory architecture maps.");
      return memoryCache.rates;
    }

    // Re-throw if layout has no baseline to stand on; Context models catch this and route to FALLBACK_RATES matrices
    throw error;
  }
}

/**
 * Evaluates raw inputs against global records and shifts balancing numbers cleanly
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (amount === 0 || fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getExchangeRates();

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (!rates[from]) {
    throw new Error(`Source validation tracker matching signature "${from}" is not registered inside currency matrices.`);
  }
  if (!rates[to]) {
    throw new Error(`Target tracking endpoint matching signature "${to}" is not registered inside currency matrices.`);
  }

  const rateFrom = rates[from];
  const rateTo = rates[to];

  // Mathematical balance transformation track: (amount / rateFrom) * rateTo
  const converted = (amount / rateFrom) * rateTo;
  return Math.round(converted * 100) / 100;
}
/* === SECTION 3 END === */