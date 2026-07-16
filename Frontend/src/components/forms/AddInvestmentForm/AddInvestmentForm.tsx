// src/components/forms/AddInvestmentForm/AddInvestmentForm.tsx
"use client";

import React, { useState } from "react";
import { FaArrowRight, FaHeart } from "react-icons/fa6";
import { BsToggleOff, BsToggleOn } from "react-icons/bs";
import { toast } from "sonner";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import styles from "./AddInvestmentForm.module.css";

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface InvestmentTypeOption {
  id: string;
  label: string;
  symbolDefault: string;
  category: string;
  iconString: string;
}

export interface InvestmentHistoryNode {
  id: string;
  date: string;
  title: string;
  note: string;
  amountAtTime: string;
  investedAtTime: number;
  valueAtTime: number;
  roiAtTime: string;
  isProfitAtTime: boolean;
}

export interface InvestmentAssetPayload {
  name: string;
  symbol: string;
  icon: string;
  categoryClass: string;
  userNote: string;
  currentPrice: number;
  quantityOwned: number;
  originalAmount: number;
  originalCurrency: string;
  baseAmountUSD: number;
  history: InvestmentHistoryNode[];
}

export interface InitialInvestmentData {
  id: string;
  name?: string;
  symbol?: string;
  icon?: string;
  categoryClass?: string;
  userNote?: string;
  currentPrice?: number;
  quantityOwned?: number;
  totalInvested?: number;
  history?: InvestmentHistoryNode[];
}

interface AddInvestmentFormProps {
  onClose: () => void;
  onSave: (data: InvestmentAssetPayload) => void;
  initialData?: InitialInvestmentData | null;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
const INVESTMENT_TYPES: InvestmentTypeOption[] = [
  { id: "crypto", label: "Crypto / Coins", symbolDefault: "BTC", category: "Digital", iconString: "₿" },
  { id: "defi", label: "Staking Pools", symbolDefault: "YLD", category: "Digital", iconString: "⚡" },
  { id: "nfts", label: "NFTs / Digital Art", symbolDefault: "NFT", category: "Digital", iconString: "🎭" },
  { id: "stocks", label: "Company Stocks", symbolDefault: "STK", category: "Traditional", iconString: "📈" },
  { id: "etfs", label: "ETFs / Stock Bundles", symbolDefault: "ETF", category: "Traditional", iconString: "💼" },
  { id: "bonds", label: "Bonds / Loans", symbolDefault: "BND", category: "Traditional", iconString: "💵" },
  { id: "mutual_funds", label: "Mutual Funds", symbolDefault: "MF", category: "Traditional", iconString: "👥" },
  { id: "real_estate", label: "Houses & Buildings", symbolDefault: "PROP", category: "Physical Items", iconString: "🏢" },
  { id: "precious_metals", label: "Gold & Silver", symbolDefault: "GOLD", category: "Physical Items", iconString: "💎" },
  { id: "commodities", label: "Farming Crops / Energy", symbolDefault: "CMD", category: "Physical Items", iconString: "🌾" },
  { id: "collectibles", label: "Art, Wine, & Watches", symbolDefault: "ALT", category: "Collectibles", iconString: "🍷" },
  { id: "exotic_cars", label: "Rare & Luxury Cars", symbolDefault: "CAR", category: "Collectibles", iconString: "🚗" },
  { id: "intellectual_property", label: "Copyrights & Royalties", symbolDefault: "ROY", category: "Collectibles", iconString: "🔑" },
  { id: "cash_savings", label: "Bank Savings Accounts", symbolDefault: "CASH", category: "Cash", iconString: "🐷" },
];

export function AddInvestmentForm({ onClose, onSave, initialData }: AddInvestmentFormProps) {
  const { convertAmount } = useCurrency();
  const { activeWorkspace } = useWorkspace();
  const workspaceCurrency = activeWorkspace?.currency || "PKR";

  const initialName = initialData?.name || "";
  const initialSymbol = initialData?.symbol || "";
  const initialQty = initialData?.quantityOwned?.toString() || "";
  const initialNote = initialData?.userNote || "";

  const matchedTypeOnMount = initialData
    ? INVESTMENT_TYPES.find(item => item.iconString === initialData.icon)
    : null;

  const initialSelectedType = matchedTypeOnMount ? matchedTypeOnMount.id : INVESTMENT_TYPES[0].id;
  const initialIsCustomMode = !!(initialData && !matchedTypeOnMount);
  const initialCustomType = initialIsCustomMode ? (initialData?.categoryClass || "Custom Item") : "";

  // 🚀 FIXED: We no longer convert an already converted string. We display the exact raw amount.
  const rawTotalInvested = initialData?.totalInvested || 0;
  const initialMoneyStr = initialData ? rawTotalInvested.toString() : "";

  const [formStep, setFormStep] = useState<number>(1);
  const [assetName, setAssetName] = useState<string>(initialName);
  const [assetSymbol, setAssetSymbol] = useState<string>(initialSymbol || INVESTMENT_TYPES[0].symbolDefault);
  const [selectedType, setSelectedType] = useState<string>(initialSelectedType);
  const [customType, setCustomType] = useState<string>(initialCustomType);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(initialIsCustomMode);
  
  const [totalMoneySpent, setTotalMoneySpent] = useState<string>(initialMoneyStr);
  const [amountReceived, setAmountReceived] = useState<string>(initialQty);
  const [userNote, setUserNote] = useState<string>(initialNote);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    const matched = INVESTMENT_TYPES.find(item => item.id === typeId);
    if (matched) setAssetSymbol(matched.symbolDefault);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formStep === 1) {
      if (!assetName.trim() || !assetSymbol.trim()) {
        toast.error("Please provide a valid name and ticker symbol.");
        return;
      }
      setFormStep(2);
      return;
    }

    try {
      const activeTypeObj = INVESTMENT_TYPES.find(item => item.id === selectedType);
      const finalIconChar = isCustomMode ? "📦" : (activeTypeObj?.iconString || "💰");
      const finalCategoryClass = isCustomMode ? (customType.trim() || "Custom Position") : (activeTypeObj?.category || "Traditional");

      const rawMoneySpent = parseFloat(totalMoneySpent) || 0;
      const finalQuantityOwned = parseFloat(amountReceived) || 0;

      // Ensure base amounts are captured cleanly at time of form save
      const normalizedTotalInvested = convertAmount(rawMoneySpent, workspaceCurrency, "USD");
      const calculatedUnitPrice = finalQuantityOwned > 0 ? (rawMoneySpent / finalQuantityOwned) : 0;

      let updatedHistory: InvestmentHistoryNode[] = [];
      const localizedDateString = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (initialData) {
        const existingHistory = initialData.history ? [...initialData.history] : [];
        if (Math.abs((initialData.totalInvested || 0) - rawMoneySpent) > 0.001 || initialData.quantityOwned !== finalQuantityOwned) {
          const historySnapshot: InvestmentHistoryNode = {
            id: `node-${Date.now()}-update`,
            date: localizedDateString,
            title: "Balance Adjusted",
            note: userNote.trim() || "Asset balances adjusted via secure profile manager.",
            amountAtTime: `${finalQuantityOwned} ${assetSymbol.trim().toUpperCase()}`,
            investedAtTime: normalizedTotalInvested,
            valueAtTime: normalizedTotalInvested,
            roiAtTime: "0.0% ROI",
            isProfitAtTime: true
          };
          updatedHistory = [historySnapshot, ...existingHistory];
        } else {
          updatedHistory = existingHistory;
        }
      } else {
        updatedHistory = [{
          id: `node-${Date.now()}-initial`,
          date: localizedDateString,
          title: "Initial Log",
          note: userNote.trim() || "Asset profile successfully logged in safe vault.",
          amountAtTime: `${finalQuantityOwned} ${assetSymbol.trim().toUpperCase()}`,
          investedAtTime: normalizedTotalInvested,
          valueAtTime: normalizedTotalInvested,
          roiAtTime: "0.0% ROI",
          isProfitAtTime: true
        }];
      }

      const builtAssetPayload: InvestmentAssetPayload = {
        name: assetName.trim(),
        symbol: assetSymbol.trim().toUpperCase() || "ITEM",
        icon: finalIconChar,
        categoryClass: finalCategoryClass,
        userNote: userNote.trim(),
        currentPrice: calculatedUnitPrice,
        quantityOwned: finalQuantityOwned,
        originalAmount: rawMoneySpent,
        originalCurrency: workspaceCurrency,
        baseAmountUSD: normalizedTotalInvested,
        history: updatedHistory
      };

      onSave(builtAssetPayload);

    } catch (error) {
      console.error("Investment allocation error:", error);
      toast.error("Could not secure investment entry records. Verify numeric inputs.");
    }
  };

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <div className={styles.progressHeader}>
        <div className={`${styles.progressTab} ${formStep >= 1 ? styles.activeTab : ""}`}>
          <span className={styles.tabIndex}>1</span> Identify Asset
        </div>
        <div className={styles.tabLine} />
        <div className={`${styles.progressTab} ${formStep === 2 ? styles.activeTab : ""}`}>
          <span className={styles.tabIndex}>2</span> Configure Balances
        </div>
      </div>

      {formStep === 1 && (
        <div className={styles.stepWrapper}>
          <div className={styles.promptSpeechBubble}>
            <h3 className={styles.speechTitle}>Establish Asset Identity</h3>
            <p className={styles.speechText}>Define your asset name and shorthand symbol.</p>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>Asset Name</label>
            <input
              type="text"
              placeholder="e.g., S&P 500 Index, Ethereum Wallet"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              required
              className={styles.primaryTextInput}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>Asset Ticker Symbol</label>
            <input
              type="text"
              placeholder="e.g., SPY, ETH, PROP"
              value={assetSymbol}
              onChange={(e) => setAssetSymbol(e.target.value)}
              required
              className={styles.primaryTextInput}
            />
          </div>

          <div className={styles.customToggleBox}>
            <div className={styles.toggleContext}>
              <span className={styles.toggleMainTitle}>Is this a unique custom profile?</span>
              <p className={styles.toggleSubtitle}>Enable manual override to record specific collectible variants or off‑market items.</p>
            </div>
            <button
              type="button"
              className={styles.toggleActionBtn}
              onClick={() => setIsCustomMode(!isCustomMode)}
            >
              {isCustomMode ? <BsToggleOn className={styles.toggleOnIcon} /> : <BsToggleOff className={styles.toggleOffIcon} />}
            </button>
          </div>

          {!isCustomMode ? (
            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel}>Asset Category Class</label>
              <div className={styles.selectBoxFrame}>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeSelect(e.target.value)}
                  className={styles.cleanDropdownInput}
                >
                  {Array.from(new Set(INVESTMENT_TYPES.map(i => i.category))).map(cat => (
                    <optgroup key={cat} label={`${cat} Assets`} className={styles.dropdownGroupHead}>
                      {INVESTMENT_TYPES.filter(item => item.category === cat).map(type => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel}>Custom Asset Classification</label>
              <input
                type="text"
                placeholder="e.g., Vintage Sports Memorabilia"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                required={isCustomMode}
                className={styles.primaryTextInput}
              />
            </div>
          )}

          <div className={styles.actionFooter}>
            <button type="button" onClick={onClose} className={styles.secondaryBtn}>Cancel</button>
            <button type="submit" className={styles.primaryBtn}>
              Next Step <FaArrowRight />
            </button>
          </div>
        </div>
      )}

      {formStep === 2 && (
        <div className={styles.stepWrapper}>
          <div className={styles.promptSpeechBubble}>
            <h3 className={styles.speechTitle}>Calculate Investment Metrics</h3>
            <p className={styles.speechText}>Provide the values below. Your performance yield and progress totals will initialize automatically.</p>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>Total Invested (Capital Spent)</label>
            <div className={styles.currencyInputWrapper}>
              <span className={styles.currencyPrefixTag}>{workspaceCurrency}</span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={totalMoneySpent}
                onChange={(e) => setTotalMoneySpent(e.target.value)}
                required
                className={styles.monetaryTextInput}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>Total Quantity Owned</label>
            <div className={styles.currencyInputWrapper}>
              <input
                type="number"
                step="any"
                min="0.00000001"
                placeholder="0.00"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                required
                className={styles.monetaryTextInputNoPrefix}
              />
              {assetSymbol && <span className={styles.currencySuffixTag}>{assetSymbol.toUpperCase()}</span>}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>
              <span className={styles.noteTitleLine}><FaHeart /> Asset Strategy & Progress Note</span>
            </label>
            <textarea
              placeholder="e.g., Initial entry cost basis locked."
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              className={styles.textareaFieldElement}
              rows={3}
            />
          </div>

          <div className={styles.actionFooter}>
            <button type="button" onClick={() => setFormStep(1)} className={styles.secondaryBtn}>Go Back</button>
            <button type="submit" className={styles.submitVaultBtn}>
              Secure Into Vault
            </button>
          </div>
        </div>
      )}
    </form>
  );
}