"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { FiLoader } from "react-icons/fi";
import styles from "./ReceiptScannerOverlay.module.css";

export interface ReceiptScannerOverlayHandle {
  triggerFileInput: () => void;
  triggerCameraInput: () => void;
}

interface ReceiptScannerOverlayProps {
  isScanning: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ReceiptScannerOverlay = forwardRef<ReceiptScannerOverlayHandle, ReceiptScannerOverlayProps>(
  ({ isScanning, onFileSelect }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      triggerFileInput: () => fileInputRef.current?.click(),
      triggerCameraInput: () => cameraInputRef.current?.click(),
    }));

    return (
      <>
        {/* Hidden inputs */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*,application/pdf"
          onChange={onFileSelect}
        />
        <input
          type="file"
          ref={cameraInputRef}
          style={{ display: "none" }}
          accept="image/*"
          capture="environment"
          onChange={onFileSelect}
        />

        {/* Fullscreen Overlay */}
        {isScanning && (
          <div className={styles.scanningOverlayBackdrop}>
            <div className={styles.scanningCoreCard}>
              <FiLoader className={styles.scanningSpinnerVector} />
              <h4>Reading Receipt Matrix</h4>
              <p>Gemini LLM is mapping variables and structuring ledger lines...</p>
            </div>
          </div>
        )}
      </>
    );
  }
);

ReceiptScannerOverlay.displayName = "ReceiptScannerOverlay";
export default ReceiptScannerOverlay;