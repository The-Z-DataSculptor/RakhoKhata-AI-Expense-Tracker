// src/components/investments/VaultLockScreen/VaultLockScreen.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useRef, useEffect, useCallback } from "react"; 
import { vaultAuthService } from "@/utils/api"; 
import { toast } from "sonner"; 
import styles from "./VaultLockScreen.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface VaultLockScreenProps {
  /** Function that runs when the user successfully enters the correct PIN */
  onUnlock: () => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & HANDLERS ===
   ========================================================================== */
export function VaultLockScreen({ onUnlock }: VaultLockScreenProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [isError, setIsError] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // WHY THIS FIX WAS MADE: Stores scheduled timeout IDs to ensure clean teardown
  // on component unmount and prevent updates on unmounted components.
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const registerTimeout = useCallback((fn: () => void, delayMs: number) => {
    const timerId = setTimeout(fn, delayMs);
    timeoutRefs.current.push(timerId);
    return timerId;
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach((id) => clearTimeout(id));
    timeoutRefs.current = [];
  }, []);

  const focusInput = useCallback((index: number) => {
    const targetInput = inputRefs.current[index];
    if (targetInput) {
      targetInput.focus();
    }
  }, []);

  /* ==========================================================================
     === LIFECYCLE DETECTION PIPELINE ===
     ========================================================================== */
  useEffect(() => {
    let isMounted = true;

    const checkSecurityStatus = async () => {
      try {
        const status = await vaultAuthService.checkStatus();
        if (isMounted) {
          setHasPin(status.hasPin);
          
          if (!status.hasPin) {
            registerTimeout(() => {
              if (isMounted) onUnlock();
            }, 10);
          } else {
            registerTimeout(() => focusInput(0), 100);
          }
        }
      } catch (error: unknown) {
        console.error("Vault status verification error:", error);
        if (isMounted) {
          toast.error("Failed to verify vault security status.");
        }
      }
    };

    checkSecurityStatus();

    return () => {
      isMounted = false;
      clearAllTimeouts();
    };
  }, [focusInput, onUnlock, registerTimeout, clearAllTimeouts]);

  /* ==========================================================================
     === SECURITY ENGINE PROCESSOR ===
     ========================================================================== */
  const validatePin = useCallback(async (enteredPin: string) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      const response = await vaultAuthService.verifyPin(enteredPin);
      
      if (response.success) {
        toast.success("Access granted.");
        onUnlock();
      }
    } catch (error: unknown) {
      setIsError(true);
      setDigits(["", "", "", ""]);
      registerTimeout(() => focusInput(0), 50);
      
      const msg = error instanceof Error ? error.message : "Invalid PIN entered.";
      toast.error(msg);
      
      registerTimeout(() => setIsError(false), 500);
    } finally {
      setIsProcessing(false);
    }
  }, [onUnlock, focusInput, isProcessing, registerTimeout]);

  /* ==========================================================================
     === KEYBOARD INPUT TRACKERS ===
     ========================================================================== */
  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value) || isProcessing) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value !== "" && index < 3) {
      focusInput(index + 1);
    }

    if (value !== "" && index === 3) {
      const compiledPinString = newDigits.join("");
      validatePin(compiledPinString);
    }
  }, [digits, focusInput, validatePin, isProcessing]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits[index] === "" && index > 0) {
      focusInput(index - 1);
    }
  }, [digits, focusInput]);

  // WHY THIS FIX WAS MADE: Replaced native window.alert with Sonner toast notice
  // to avoid blocking browser event threads during user interactions.
  const handleForgotPin = useCallback(() => {
    toast.info("Navigate to account settings or contact workspace admin to reset PIN lock.");
  }, []);

  if (hasPin === null || !hasPin) {
    return (
      <div className={styles.lockScreenContainer} role="status" aria-live="polite">
        <div className={styles.lockBoxPanel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <p className="text-gray-400 font-medium tracking-wide animate-pulse text-sm">Verifying vault authorization state...</p>
        </div>
      </div>
    );
  }
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.lockScreenContainer}>
      <div className={styles.lockBoxPanel} role="form" aria-label="Vault Authentication Panel">
        
        {/* Top Icon Display Stack */}
        <div className={styles.headerStack}>
          <div className={styles.iconCircle}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={styles.lockIcon}
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          
          <h2 className={styles.titleText}>Vault Locked</h2>
          <p className={styles.subtitleText}>Enter your 4-digit PIN to see your investments.</p>
        </div>

        {/* Interactive PIN Boxes Array */}
        <div className={`${styles.pinBoxesWrapper} ${isError ? styles.shakeError : ""} ${isProcessing ? styles.processingFade : ""}`}>
          {digits.map((digit, index) => (
            <input
              key={`pin-input-${index}`}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              disabled={isProcessing}
              className={`${styles.pinBox} ${isError ? styles.pinBoxError : ""}`}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              autoComplete="off"
              aria-label={`Digit ${index + 1} of 4`}
            />
          ))}
        </div>

        {/* Footer Helper Actions Area */}
        <div className={styles.footerArea}>
          {isError ? (
            <p className={styles.errorMessage} role="alert">Incorrect PIN. Please try again.</p>
          ) : (
            <button 
              type="button" 
              className={styles.forgotPinButton} 
              onClick={handleForgotPin}
              disabled={isProcessing}
            >
              Forgot your PIN?
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
/* === SECTION 4 END === */