// src/hooks/useTheme.ts
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { useEffect, useState } from "react";

// Allowed theme values – prevents accidental misspellings
export type ThemeMode = "light" | "dark" | "system";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: UTILITY HELPERS ===
   ========================================================================== */

/**
 * WHY THIS IS NEEDED:
 * Our CSS variables are all scoped under `[data-theme]` on the <html> tag.
 * Changing the attribute instantly switches the whole colour palette.
 */
function applyThemeToHtmlElement(targetTheme: "light" | "dark"): void {
  document.documentElement.setAttribute("data-theme", targetTheme);
}

/**
 * Safely reads the saved theme preference from localStorage.
 * Returns a valid ThemeMode or `undefined` if nothing is stored.
 *
 * WHY the try/catch is inside the function:
 * Some browsers' privacy settings block localStorage access,
 * causing a SecurityError. We catch it and treat the preference
 * as absent so the app still works.
 */
function readSavedTheme(): ThemeMode | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const storedTheme = localStorage.getItem("theme");
    // Only accept known values – any other garbage is ignored
    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      return storedTheme;
    }
  } catch {
    // localStorage may be disabled – ignore
  }
  return undefined;
}

/**
 * Persists the chosen theme to localStorage.
 * "system" is not stored because it means "follow the OS preference".
 *
 * WHY "system" is removed instead of stored:
 * If the user selects "system", we want the OS setting to be the
 * sole source of truth. Removing the key ensures a clean state.
 */
function persistTheme(theme: ThemeMode): void {
  try {
    if (theme !== "system") {
      localStorage.setItem("theme", theme);
    } else {
      localStorage.removeItem("theme");
    }
  } catch {
    // storage full or unavailable – not critical
  }
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: THEME HOOK ===
   ========================================================================== */

/**
 * useTheme – the single source of truth for the application's colour scheme.
 *
 * Returns:
 * - activeTheme: the currently selected theme ("light" | "dark" | "system")
 * - changeTheme:  a setter to switch themes (automatically persists to localStorage)
 */
export function useTheme() {
  // Initialize from localStorage, defaulting to "system" if nothing is saved.
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return readSavedTheme() ?? "system";
  });

  /**
   * This effect runs every time the user changes the theme.
   * It performs three jobs:
   * 1. Persists the new value to localStorage.
   * 2. Applies the correct CSS attribute to <html>.
   * 3. Adds/removes a listener for OS‑level changes when "system" is selected.
   */
  useEffect(() => {
    // Grab the OS dark‑mode media query once.
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    /**
     * syncTheme – called immediately AND whenever the OS preference changes.
     * WHY we need a named function:
     * We must attach it as an event listener, so it cannot be inlined.
     */
    function syncTheme() {
      // Always persist the current choice (even "system" – which clears the key)
      persistTheme(theme);

      if (theme !== "system") {
        // User chose a specific theme → apply it directly
        applyThemeToHtmlElement(theme);
        return;
      }

      // "system" mode → follow the OS preference
      applyThemeToHtmlElement(
        darkModeMediaQuery.matches ? "dark" : "light"
      );
    }

    // --- Execute the sync immediately so the UI is correct ---
    syncTheme();

    // --- Listen for future OS‑level changes (only needed in "system" mode) ---
    if (theme === "system") {
      darkModeMediaQuery.addEventListener("change", syncTheme);
    }

    // --- Cleanup: remove the listener when the effect re‑runs or unmounts ---
    return () => {
      darkModeMediaQuery.removeEventListener("change", syncTheme);
    };
  }, [theme]);

  return {
    activeTheme: theme,
    changeTheme: setTheme,
  };
}
/* === SECTION 3 END === */