/* src/components/marketing/features/receipt-scanner/FeaturePreview.tsx */
"use client";

import React, { useState } from "react";
import {
  FiZap,
  FiFileText,
  FiCamera,
  FiCheckCircle,
  FiLoader,
  FiShoppingBag,
  FiCoffee,
  FiHardDrive,
  FiChevronDown,
} from "react-icons/fi";
import styles from "./FeaturePreview.module.css";

export interface FeaturePreviewProps {
  id?: string;
  headline?: string;
  subheadline?: string;
}

interface SampleReceipt {
  id: string;
  label: string;
  icon: React.ReactNode;
  rawSlipText: string;
  extracted: {
    description: string;
    date: string;
    amount: number;
    currency: string;
    type: "EXPENSE" | "INCOME";
    categoryId: string;
  };
}

const SAMPLE_CATEGORIES = [
  { id: "cat-1", name: "Dining & Coffee" },
  { id: "cat-2", name: "Groceries & Supermarket" },
  { id: "cat-3", name: "Software & Cloud" },
  { id: "cat-4", name: "Utilities & Bills" },
];

const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: "rec-1",
    label: "Cafe Receipt",
    icon: <FiCoffee size={16} />,
    rawSlipText: `ESPRESSO LAB #1042
DATE: 2026-08-12  09:14 AM
1x OAT MILK LATTE ... Rs 650.00
1x CROISSANT ........ Rs 480.00
GST (16%): Rs 180.80
TOTAL: Rs 1,310.80
PAID VIA VISA **** 9012`,
    extracted: {
      description: "Espresso Lab",
      date: "2026-08-12",
      amount: 1310.8,
      currency: "PKR",
      type: "EXPENSE",
      categoryId: "cat-1",
    },
  },
  {
    id: "rec-2",
    label: "Grocery Invoice",
    icon: <FiShoppingBag size={16} />,
    rawSlipText: `AL-FATAH MEGASTORE PK
DATE: 2026-08-18  04:22 PM
MILK 1L (x2) ........ $4.20
ORGANIC EGGS ........ $5.50
FRESH PRODUCE ....... $14.80
TOTAL CHARGED: $24.50
AUTH CODE: #994820`,
    extracted: {
      description: "Al-Fatah Supermarket",
      date: "2026-08-18",
      amount: 24.5,
      currency: "USD",
      type: "EXPENSE",
      categoryId: "cat-2",
    },
  },
  {
    id: "rec-3",
    label: "SaaS PDF Bill",
    icon: <FiHardDrive size={16} />,
    rawSlipText: `DIGITALOCEAN LLC INVOICE
INVOICE ID: #DO-8839210
BILLING DATE: 2026-08-01
BASIC DROPLET 4GB ... $24.00
SPACES STORAGE CDN .. $5.00
TOTAL CHARGED: $29.00
STATUS: PAID IN FULL`,
    extracted: {
      description: "DigitalOcean Cloud Hosting",
      date: "2026-08-01",
      amount: 29.0,
      currency: "USD",
      type: "EXPENSE",
      categoryId: "cat-3",
    },
  },
];

export default function FeaturePreview({
  id = "preview",
  headline = "Interactive Receipt Scanner Simulator",
  subheadline = "Select a sample receipt below to see how our Gemini Vision engine analyzes image data and auto-fills ledger fields in real time.",
}: FeaturePreviewProps) {
  const [activeReceipt, setActiveReceipt] = useState<SampleReceipt>(SAMPLE_RECEIPTS[0]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMethod, setScanMethod] = useState<"file" | "camera">("file");

  // Editable Form Mockup State
  const [formData, setFormData] = useState(SAMPLE_RECEIPTS[0].extracted);
  const [isCommitted, setIsCommitted] = useState<boolean>(false);

  const handleSelectSample = (sample: SampleReceipt, method: "file" | "camera" = scanMethod) => {
    setIsScanning(true);
    setIsCommitted(false);
    setScanMethod(method);

    setTimeout(() => {
      setActiveReceipt(sample);
      setFormData(sample.extracted);
      setIsScanning(false);
    }, 750);
  };

  return (
    <section id={id} className={styles.previewSection} aria-label="Interactive Receipt Scanner Simulator">
      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <div className={styles.interactiveIndicator}>
            <FiZap className={styles.zapIcon} size={15} />
            <span>Multimodal Vision Simulator</span>
          </div>
          <h2 className={styles.previewTitle}>{headline}</h2>
          <p className={styles.previewSubtitle}>{subheadline}</p>
        </div>

        {/* CONTROLS BAR */}
        <div className={styles.switcherBar}>
          <div className={styles.sampleButtonGroup}>
            <span className={styles.switchLabel}>Sample Document:</span>
            {SAMPLE_RECEIPTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className={`${styles.sampleBtn} ${activeReceipt.id === sample.id ? styles.sampleBtnActive : ""}`}
                onClick={() => handleSelectSample(sample, scanMethod)}
              >
                {sample.icon}
                <span>{sample.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.methodToggleGroup}>
            <button
              type="button"
              className={`${styles.methodBtn} ${scanMethod === "file" ? styles.methodBtnActive : ""}`}
              onClick={() => handleSelectSample(activeReceipt, "file")}
            >
              <FiFileText size={14} />
              <span>Upload Document</span>
            </button>
            <button
              type="button"
              className={`${styles.methodBtn} ${scanMethod === "camera" ? styles.methodBtnActive : ""}`}
              onClick={() => handleSelectSample(activeReceipt, "camera")}
            >
              <FiCamera size={14} />
              <span>Use Camera</span>
            </button>
          </div>
        </div>

        {/* MOCKUP WINDOW FRAME */}
        <div className={styles.mockupFrame}>
          {/* WINDOW TOP BAR */}
          <div className={styles.windowTopBar}>
            <div className={styles.windowControls}>
              <span className={`${styles.circleDot} ${styles.dotRed}`} />
              <span className={`${styles.circleDot} ${styles.dotYellow}`} />
              <span className={`${styles.circleDot} ${styles.dotGreen}`} />
            </div>
            <div className={styles.windowUrlField}>
              app.rakhokhata.com/dashboard/transactions • Model: <strong>gemini-3.1-flash-lite (Multimodal)</strong>
            </div>
          </div>

          {/* DASHBOARD BODY */}
          <div className={styles.dashboardBody}>
            {/* AI SCANNING OVERLAY BACKDROP */}
            {isScanning && (
              <div className={styles.scanningOverlayBackdrop}>
                <div className={styles.scanningCoreCard}>
                  <FiLoader className={styles.scanningSpinnerVector} size={36} />
                  <h4 className={styles.scanningCardTitle}>Reading Receipt Matrix</h4>
                  <p className={styles.scanningCardSubtitle}>
                    Gemini LLM is mapping variables and structuring ledger lines...
                  </p>
                </div>
              </div>
            )}

            <div className={styles.scannerSplitGrid}>
              {/* LEFT: RAW PHYSICAL SLIP BUFFER */}
              <div className={styles.paperReceiptCard}>
                <div className={styles.receiptTopHeader}>
                  <span className={styles.slipTypeBadge}>
                    {scanMethod === "camera" ? <FiCamera size={13} /> : <FiFileText size={13} />}
                    {scanMethod === "camera" ? "Camera Shutter Capture" : "Document File Buffer"}
                  </span>
                  <span className={styles.timestampMuted}>Aug 2026</span>
                </div>
                <pre className={styles.rawTextDisplay}>{activeReceipt.rawSlipText}</pre>
                <div className={styles.paperFooterNotch} />
              </div>

              {/* RIGHT: EXACT TRANSACTION FORM VERIFICATION */}
              <div className={styles.formCard}>
                <div className={styles.headerArea}>
                  <div className={styles.formTitleRow}>
                    <h3 className={styles.formTitle}>Verify Scanned Receipt</h3>
                    <span className={styles.aiVerifiedPill}>
                      <FiZap size={12} /> AI Pre-filled
                    </span>
                  </div>
                  <p className={styles.formSubtitle}>Log financial cash flows into your accounting ledger.</p>
                </div>

                <div className={styles.formLayout}>
                  {/* ROW 1: DATE & FLOW TYPE */}
                  <div className={styles.formRowSideBySide}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Transaction Date</label>
                      <input
                        type="date"
                        className={styles.inputField}
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <span className={styles.label}>Flow Classification</span>
                      <div className={styles.segmentedControl}>
                        <label
                          className={`${styles.segmentOption} ${formData.type === "EXPENSE" ? styles.segmentActiveExpense : ""}`}
                          onClick={() => setFormData({ ...formData, type: "EXPENSE" })}
                        >
                          Expense
                        </label>
                        <label
                          className={`${styles.segmentOption} ${formData.type === "INCOME" ? styles.segmentActiveIncome : ""}`}
                          onClick={() => setFormData({ ...formData, type: "INCOME" })}
                        >
                          Income
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* ROW 2: DESCRIPTION */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Ledger Description</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g., Office Supplies, Client Retainer, Cloud hosting"
                    />
                  </div>

                  {/* ROW 3: CATEGORY & VALUE */}
                  <div className={styles.formRowSideBySide}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Category Allocation</label>
                      <div className={styles.selectWrapper}>
                        <select
                          className={styles.selectField}
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        >
                          <optgroup label="Actions">
                            <option value="__ADD__">➕ Create New Category...</option>
                          </optgroup>
                          <optgroup label="Available Categories">
                            {SAMPLE_CATEGORIES.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        <FiChevronDown className={styles.selectChevron} size={14} />
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Transaction Value</label>
                      <div className={styles.currencyInputContainer}>
                        <input
                          type="number"
                          step="0.01"
                          className={styles.inputFieldCurrency}
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        />
                        <span className={styles.currencyBadge}>{formData.currency}</span>
                      </div>
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className={styles.buttonGroup}>
                    <button
                      type="button"
                      className={styles.submitBtn}
                      onClick={() => setIsCommitted(true)}
                    >
                      {isCommitted ? (
                        <>
                          <FiCheckCircle size={16} />
                          <span>Logged to Ledger!</span>
                        </>
                      ) : (
                        "Verify & Save"
                      )}
                    </button>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setFormData(activeReceipt.extracted)}
                    >
                      Reset Fields
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}