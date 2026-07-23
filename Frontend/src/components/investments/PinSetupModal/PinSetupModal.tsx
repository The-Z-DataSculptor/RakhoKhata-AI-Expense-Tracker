// src/components/investments/PinSetupModal/PinSetupModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { vaultAuthService } from "@/utils/api";
import styles from "./PinSetupModal.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "SETUP" | "DISABLE" | "CHANGE";
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC & HANDLERS ===
   ========================================================================== */
export function PinSetupModal({ isOpen, onClose, onSuccess, mode }: PinSetupModalProps) {
  const getInitialStep = useCallback(() => {
    if (mode === "DISABLE" || mode === "CHANGE") return "VERIFY_CURRENT";
    return "CREATE";
  }, [mode]);

  const [step, setStep] = useState<"VERIFY_CURRENT" | "CREATE" | "CONFIRM">(getInitialStep);
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [firstPin, setFirstPin] = useState<string>("");
  const [savedCurrentPin, setSavedCurrentPin] = useState<string>("");
  
  const [isError, setIsError] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
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

  useEffect(() => {
    if (isOpen) {
      registerTimeout(() => focusInput(0), 100);
    }
    return () => {
      clearAllTimeouts();
    };
  }, [isOpen, focusInput, registerTimeout, clearAllTimeouts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  const handleCloseModal = useCallback(() => {
    if (isProcessing) return;
    clearAllTimeouts();
    setSavedCurrentPin("");
    onClose();
  }, [onClose, isProcessing, clearAllTimeouts]);

  const handleVerifyCurrentPin = async (pin: string): Promise<boolean> => {
    try {
      const response = await vaultAuthService.verifyPin(pin);
      if (response && response.success === false) return false;
      return true;
    } catch {
      return false;
    }
  };

  const handleSetupNewPin = async (pin: string, currentPin?: string): Promise<void> => {
    // WHY THIS FIX WAS MADE: Forwards currentPin (2 arguments) matching updated vaultAuthService.setupPin signature.
    await vaultAuthService.setupPin(pin, currentPin);
  };

  const handleDisablePin = async (pin: string): Promise<void> => {
    // WHY THIS FIX WAS MADE: Transmits verified pin (1 argument) matching updated vaultAuthService.disablePin signature.
    await vaultAuthService.disablePin(pin);
  };

  const handleChange = useCallback(
    async (index: number, value: string) => {
      if (!/^\d*$/.test(value) || isProcessing) return;

      const newDigits = [...digits];
      newDigits[index] = value.slice(-1);
      setDigits(newDigits);

      if (value !== "" && index < 3) {
        focusInput(index + 1);
      }

      if (value !== "" && index === 3) {
        const completePin = newDigits.join("");
        setIsProcessing(true);

        try {
          if (step === "VERIFY_CURRENT") {
            const isValid = await handleVerifyCurrentPin(completePin);
            if (!isValid) throw new Error("Incorrect PIN");

            setSavedCurrentPin(completePin);

            if (mode === "DISABLE") {
              await handleDisablePin(completePin);
              toast.success("Security lock disabled successfully.");
              onSuccess();
              handleCloseModal();
            } else if (mode === "CHANGE") {
              setStep("CREATE");
              setDigits(["", "", "", ""]);
              registerTimeout(() => focusInput(0), 50);
              toast.info("Now enter your new PIN.");
            }
          } else if (step === "CREATE") {
            setFirstPin(completePin);
            setStep("CONFIRM");
            setDigits(["", "", "", ""]);
            registerTimeout(() => focusInput(0), 50);
          } else if (step === "CONFIRM") {
            if (completePin !== firstPin) throw new Error("PINs do not match");

            await handleSetupNewPin(completePin, savedCurrentPin);
            toast.success(mode === "CHANGE" ? "PIN updated successfully!" : "Security lock enabled!");
            onSuccess();
            handleCloseModal();
          }
        } catch (err: unknown) {
          setIsError(true);
          setDigits(["", "", "", ""]);
          registerTimeout(() => focusInput(0), 50);
          const msg = err instanceof Error ? err.message : "Something went wrong.";
          toast.error(msg);
          registerTimeout(() => setIsError(false), 500);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [digits, step, firstPin, savedCurrentPin, mode, focusInput, onSuccess, handleCloseModal, isProcessing, registerTimeout]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && digits[index] === "" && index > 0) {
        focusInput(index - 1);
      }
    },
    [digits, focusInput]
  );

  const getModalTitle = () => {
    if (step === "VERIFY_CURRENT") {
      return mode === "DISABLE" ? "Confirm to Disable" : "Verify Current PIN";
    }
    if (step === "CREATE") {
      return mode === "CHANGE" ? "Set New PIN" : "Set Your PIN";
    }
    return "Confirm New PIN";
  };

  const getModalSubtitle = () => {
    if (step === "VERIFY_CURRENT") {
      return mode === "DISABLE"
        ? "Enter your current 4-digit PIN to remove the lock."
        : "Enter your current PIN before setting a new one.";
    }
    if (step === "CREATE") {
      return "Choose a 4-digit number you will remember.";
    }
    return "Re‑enter the same 4 digits to confirm.";
  };

  if (!isOpen) return null;
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.modalOverlay} onClick={handleCloseModal} role="dialog" aria-modal="true">
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTextStack}>
            <h2 className={styles.modalTitle}>{getModalTitle()}</h2>
            <p className={styles.modalSubtitle}>{getModalSubtitle()}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleCloseModal}
            disabled={isProcessing}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <div
            className={`${styles.pinBoxesContainer} ${isError ? styles.shakeError : ""} ${
              isProcessing ? styles.processingFade : ""
            }`}
          >
            {digits.map((digit, index) => (
              <input
                key={`modal-pin-box-${index}`}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
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

          <div className={styles.messageArea}>
            {isError ? (
              <span className={styles.errorMessage} role="alert">Invalid PIN. Please try again.</span>
            ) : (
              <span className={styles.helperMessage}>
                {mode === "DISABLE"
                  ? "Enter current PIN to remove lock."
                  : mode === "CHANGE" && step === "VERIFY_CURRENT"
                  ? "Enter old PIN to proceed."
                  : "Enter 4 digits."}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
/* === SECTION 4 END === */