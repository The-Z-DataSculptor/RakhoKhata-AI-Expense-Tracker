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
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function PinSetupModal({ isOpen, onClose, onSuccess, mode }: PinSetupModalProps) {
  // Determine initial step based on mode – runs only on mount/remount
  const getInitialStep = useCallback(() => {
    if (mode === "DISABLE" || mode === "CHANGE") return "VERIFY_CURRENT";
    return "CREATE";
  }, [mode]);

  const [step, setStep] = useState<"VERIFY_CURRENT" | "CREATE" | "CONFIRM">(getInitialStep);
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [firstPin, setFirstPin] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    const targetInput = inputRefs.current[index];
    if (targetInput) {
      targetInput.focus();
    }
  }, []);

  // Focus the first input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => focusInput(0), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, focusInput]);

  // Close handler: just call onClose – state will be reset by remount
  const handleCloseModal = useCallback(() => {
    onClose();
  }, [onClose]);

  // --- API interaction functions ---
  const handleVerifyCurrentPin = async (pin: string): Promise<boolean> => {
    try {
      await vaultAuthService.verifyPin(pin);
      return true;
    } catch {
      return false;
    }
  };

  const handleSetupNewPin = async (pin: string): Promise<void> => {
    await vaultAuthService.setupPin(pin);
  };

  const handleDisablePin = async (pin: string): Promise<void> => {
    await vaultAuthService.verifyPin(pin);
    await vaultAuthService.disablePin();
  };

  // --- Input handler ---
  const handleChange = useCallback(
    async (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

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

            if (mode === "DISABLE") {
              await handleDisablePin(completePin);
              toast.success("Security lock disabled successfully.");
              onSuccess();
              handleCloseModal();
            } else if (mode === "CHANGE") {
              setStep("CREATE");
              setDigits(["", "", "", ""]);
              focusInput(0);
              toast.info("Now enter your new PIN.");
            }
          } else if (step === "CREATE") {
            setFirstPin(completePin);
            setStep("CONFIRM");
            setDigits(["", "", "", ""]);
            focusInput(0);
          } else if (step === "CONFIRM") {
            if (completePin !== firstPin) throw new Error("PINs do not match");

            await handleSetupNewPin(completePin);
            toast.success(mode === "CHANGE" ? "PIN updated successfully!" : "Security lock enabled!");
            onSuccess();
            handleCloseModal();
          }
        } catch (err: unknown) {
          setIsError(true);
          setDigits(["", "", "", ""]);
          focusInput(0);
          const msg = err instanceof Error ? err.message : "Something went wrong.";
          toast.error(msg);
          setTimeout(() => setIsError(false), 500);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [digits, step, firstPin, mode, focusInput, onSuccess, handleCloseModal]
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

  return (
    <div className={styles.modalOverlay} onClick={handleCloseModal}>
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
                key={index}
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
              />
            ))}
          </div>

          <div className={styles.messageArea}>
            {isError ? (
              <span className={styles.errorMessage}>Invalid PIN. Please try again.</span>
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