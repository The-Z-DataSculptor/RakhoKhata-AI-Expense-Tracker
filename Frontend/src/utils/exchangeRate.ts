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
   === SECTION 2: CACHE HELPERS ===
   ========================================================================== */
// Cache expires after 1 hour (3600000 ms)
const CACHE_EXPIRY_MS = 60 * 60 * 1000;

// In-memory cache (cleared on page refresh)
let cachedRates: CachedRates | null = null;

/**
 * Get the API key from environment variables.
 */
function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_EXCHANGE_RATE_API_KEY environment variable. " +
      "Please add it to your .env.local file."
    );
  }
  return key;
}

/**
 * Check if the cached rates are still valid.
 */
function isCacheValid(): boolean {
  if (!cachedRates) return false;
  const now = Date.now();
  return (now - cachedRates.timestamp) < CACHE_EXPIRY_MS;
}

/**
 * Fetch fresh exchange rates from the API.
 */
async function fetchFreshRates(): Promise<Record<string, number>> {
  const apiKey = getApiKey();
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Exchange Rate API error: ${response.status} - ${errorText}`);
  }

  const data: ExchangeRateResponse = await response.json();

  if (data.result !== "success") {
    throw new Error(`Exchange Rate API returned an error: ${data.result}`);
  }

  return data.conversion_rates;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PUBLIC API ===
   ========================================================================== */
/**
 * Get exchange rates with caching.
 * Returns a Record of currency codes to their USD rate.
 * Example: { "USD": 1, "PKR": 280.5, "EUR": 0.92 }
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  // If cache is valid, return cached data
  if (isCacheValid()) {
    return cachedRates!.rates;
  }

  // Otherwise, fetch fresh data
  try {
    const rates = await fetchFreshRates();
    cachedRates = {
      rates,
      timestamp: Date.now(),
    };
    return rates;
  } catch (error) {
    // If we have stale cache (even if expired), use it as a fallback
    if (cachedRates) {
      console.warn("Failed to fetch fresh rates, using stale cache:", error);
      return cachedRates.rates;
    }
    // If no cache exists, re-throw the error
    throw error;
  }
}

/**
 * Convert an amount from one currency to another using live rates.
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getExchangeRates();

  // Normalize to uppercase
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  // If we don't have the target currency, throw an error
  if (!rates[from]) {
    throw new Error(`Currency code "${from}" not found.`);
  }
  if (!rates[to]) {
    throw new Error(`Currency code "${to}" not found.`);
  }

  // Convert: amount / rateFrom * rateTo
  const rateFrom = rates[from];
  const rateTo = rates[to];

  const converted = (amount / rateFrom) * rateTo;
  return Math.round(converted * 100) / 100; // Round to 2 decimal places
}
/* === SECTION 3 END === */