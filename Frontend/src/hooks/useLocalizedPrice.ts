"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & HELPERS ===
   ========================================================================== */
import { useState, useEffect } from "react";
import { WORLD_CURRENCIES, WORLD_COUNTRIES } from "@/constants/geoData";
import { convertCurrency } from "@/utils/exchangeRate";

export interface LocalizedPriceData {
  currencyCode: string;
  currencySymbol: string;
  flag: string;
  freePrice: number;
  proPrice: string;
  isLoading: boolean;
}

/**
 * Rounds converted rates into clean, attractive consumer pricing.
 */
function roundToCleanPrice(amount: number, currencyCode: string): string {
  if (currencyCode === "USD") return "6";

  // Large denomination currencies (e.g., PKR, INR, JPY, KRW, VND)
  if (amount >= 1000) {
    // Round to nearest 50 or 100
    const rounded = Math.round(amount / 50) * 50;
    return rounded.toLocaleString();
  }

  if (amount >= 100) {
    // Round to nearest 10
    const rounded = Math.round(amount / 10) * 10;
    return rounded.toLocaleString();
  }

  if (amount >= 20) {
    // Round to nearest 5 or integer
    const rounded = Math.round(amount / 5) * 5;
    return rounded.toLocaleString();
  }

  // Small currencies (EUR, GBP, AUD, CAD) -> clean round or single decimal
  const rounded = Math.round(amount);
  return (rounded || 6).toLocaleString();
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: USE LOCALIZED PRICE HOOK ===
   ========================================================================== */
export function useLocalizedPrice(baseUsdPrice: number = 6): LocalizedPriceData {
  const [priceData, setPriceData] = useState<LocalizedPriceData>({
    currencyCode: "USD",
    currencySymbol: "$",
    flag: "🇺🇸",
    freePrice: 0,
    proPrice: baseUsdPrice.toString(),
    isLoading: true,
  });

  useEffect(() => {
    let isCancelled = false;

    async function detectAndConvert() {
      let targetCurrencyCode = "USD";

      // Step 1: Detect user's country from timezone / browser locale or IP
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

        if (timeZone.includes("Karachi") || timeZone.includes("Pakistan")) {
          targetCurrencyCode = "PKR";
        } else if (timeZone.includes("Calcutta") || timeZone.includes("India")) {
          targetCurrencyCode = "INR";
        } else if (timeZone.includes("London")) {
          targetCurrencyCode = "GBP";
        } else if (timeZone.includes("Europe") || timeZone.includes("Berlin") || timeZone.includes("Paris")) {
          targetCurrencyCode = "EUR";
        } else if (timeZone.includes("Dubai")) {
          targetCurrencyCode = "AED";
        } else if (timeZone.includes("Riyadh")) {
          targetCurrencyCode = "SAR";
        } else if (timeZone.includes("Tokyo")) {
          targetCurrencyCode = "JPY";
        } else if (timeZone.includes("Toronto") || timeZone.includes("Vancouver")) {
          targetCurrencyCode = "CAD";
        } else if (timeZone.includes("Sydney") || timeZone.includes("Melbourne")) {
          targetCurrencyCode = "AUD";
        } else {
          // Fallback to rapid lightweight IP lookup
          const res = await fetch("https://ipapi.co/json/", { cache: "force-cache" });
          if (res.ok) {
            const data = await res.json();
            if (data.currency) {
              targetCurrencyCode = data.currency;
            } else if (data.country_name) {
              const matched = WORLD_COUNTRIES.find(
                (c) => c.name.toLowerCase() === data.country_name.toLowerCase()
              );
              if (matched) targetCurrencyCode = matched.defaultCurrency;
            }
          }
        }
      } catch {
        // Defaults to USD gracefully on network failure
        targetCurrencyCode = "USD";
      }

      // Step 2: Match with WORLD_CURRENCIES for symbol & flag
      const matchedConfig = WORLD_CURRENCIES.find(
        (c) => c.code.toUpperCase() === targetCurrencyCode.toUpperCase()
      ) || {
        code: "USD",
        symbol: "$",
        flag: "🇺🇸",
        label: "US Dollar",
      };

      // Step 3: Convert base amount via exchange rate engine
      try {
        const converted = await convertCurrency(baseUsdPrice, "USD", matchedConfig.code);
        const formattedCleanPrice = roundToCleanPrice(converted, matchedConfig.code);

        if (!isCancelled) {
          setPriceData({
            currencyCode: matchedConfig.code,
            currencySymbol: matchedConfig.symbol,
            flag: matchedConfig.flag,
            freePrice: 0,
            proPrice: formattedCleanPrice,
            isLoading: false,
          });
        }
      } catch {
        if (!isCancelled) {
          setPriceData({
            currencyCode: "USD",
            currencySymbol: "$",
            flag: "🇺🇸",
            freePrice: 0,
            proPrice: baseUsdPrice.toString(),
            isLoading: false,
          });
        }
      }
    }

    detectAndConvert();

    return () => {
      isCancelled = true;
    };
  }, [baseUsdPrice]);

  return priceData;
}