// src/hooks/useTheme.ts
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { useEffect, useState } from "react";

// Allowed theme values – prevents accidental misspellings
export type ThemeMode = "light" | "dark" | "system";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/**
 * Applies the given theme to the root <html> element by setting a data
 * attribute that is consumed by CSS variables.
 */
function applyThemeToDom(targetTheme: "light" | "dark"): void {
  document.documentElement.setAttribute("data-theme", targetTheme);
}

/**
 * Reads the saved theme preference from localStorage.
 * Returns the stored value if valid, otherwise undefined.
 */
function readSavedTheme(): ThemeMode | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage may be disabled – ignore
  }
  return undefined;
}

/**
 * Persists the chosen theme to localStorage.
 * Silently ignores write failures.
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
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

export function useTheme() {
  // Initialise from localStorage, defaulting to "system"
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return readSavedTheme() ?? "system";
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    /**
     * Synchronises the actual DOM and localStorage with the current theme choice.
     * When "system" is selected, it listens to OS‑level changes.
     */
    function syncTheme() {
      persistTheme(theme);

      if (theme !== "system") {
        applyThemeToDom(theme);
        return;
      }

      // "system" – follow the OS preference
      applyThemeToDom(mediaQuery.matches ? "dark" : "light");
    }

    // Run immediately
    syncTheme();

    // Listen for OS‑level changes when in "system" mode
    if (theme === "system") {
      mediaQuery.addEventListener("change", syncTheme);
    }

    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, [theme]);

  return {
    activeTheme: theme,
    changeTheme: setTheme,
  };
}
/* === SECTION 3 END === */