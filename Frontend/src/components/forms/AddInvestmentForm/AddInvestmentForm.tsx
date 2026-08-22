// src/components/forms/AddInvestmentForm/AddInvestmentForm.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, { useState } from "react";
import { FaArrowRight, FaHeart } from "react-icons/fa6";
import { BsToggleOff, BsToggleOn } from "react-icons/bs";
import { toast } from "sonner";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import styles from "./AddInvestmentForm.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
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
  onSave: (data: InvestmentAssetPayload) => Promise<void> | void;
  initialData?: InitialInvestmentData | null;
}

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
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */
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
  const initialIsCustomMode = Boolean(initialData && !matchedTypeOnMount);
  const initialCustomType = initialIsCustomMode ? (initialData?.categoryClass || "Custom Item") : "";

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    const matchedOption = INVESTMENT_TYPES.find(item => item.id === typeId);
    if (matchedOption) {
      setAssetSymbol(matchedOption.symbolDefault);
    }
  };

  const handleFormWorkflowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (formStep === 1) {
      if (!assetName.trim() || !assetSymbol.trim()) {
        toast.error("Please provide a valid name and ticker symbol.");
        return;
      }
      setFormStep(2);
      return;
    }

    try {
      setIsSubmitting(true);

      const activeTypeObj = INVESTMENT_TYPES.find(item => item.id === selectedType);
      const finalIconChar = isCustomMode ? "📦" : (activeTypeObj?.iconString || "💰");
      const finalCategoryClass = isCustomMode ? (customType.trim() || "Custom Position") : (activeTypeObj?.category || "Traditional");

      const cleanMoneySpent = totalMoneySpent.replace(/,/g, "").trim();
      const cleanQuantity = amountReceived.replace(/,/g, "").trim();

      const rawMoneySpent = parseFloat(cleanMoneySpent);
      const finalQuantityOwned = parseFloat(cleanQuantity);

      if (isNaN(rawMoneySpent) || rawMoneySpent <= 0 || isNaN(finalQuantityOwned) || finalQuantityOwned <= 0) {
        toast.error("Monetary values and quantities owned must be positive numerical digits.");
        setIsSubmitting(false);
        return;
      }

      const normalizedTotalInvested = convertAmount(rawMoneySpent, workspaceCurrency, "USD");
      const calculatedUnitPrice = finalQuantityOwned > 0 ? (rawMoneySpent / finalQuantityOwned) : 0;

      let updatedHistory: InvestmentHistoryNode[] = [];
      const localizedDateString = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const nodeUniqueSuffix = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 7);

      if (initialData) {
        const existingHistory = initialData.history ? [...initialData.history] : [];
        const isBalanceShifted = Math.abs((initialData.totalInvested || 0) - rawMoneySpent) > 0.001 || initialData.quantityOwned !== finalQuantityOwned;
        
        if (isBalanceShifted) {
          const historySnapshot: InvestmentHistoryNode = {
            id: `node-${Date.now()}-${nodeUniqueSuffix}`,
            date: localizedDateString,
            title: "Balance Adjusted",
            note: userNote.trim() || "Asset balances adjusted.",
            amountAtTime: `${finalQuantityOwned} ${assetSymbol.trim().toUpperCase()}`,
            investedAtTime: rawMoneySpent,
            valueAtTime: rawMoneySpent,
            roiAtTime: "0.0% ROI",
            isProfitAtTime: true
          };
          updatedHistory = [historySnapshot, ...existingHistory];
        } else {
          updatedHistory = existingHistory;
        }
      } else {
        updatedHistory = [{
          id: `node-${Date.now()}-${nodeUniqueSuffix}`,
          date: localizedDateString,
          title: "Initial Log",
          note: userNote.trim() || "Asset profile logged in vault.",
          amountAtTime: `${finalQuantityOwned} ${assetSymbol.trim().toUpperCase()}`,
          investedAtTime: rawMoneySpent,
          valueAtTime: rawMoneySpent,
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

      await onSave(builtAssetPayload);

    } catch (error: unknown) {
      console.error("Investment allocation exception:", error);
      const detailedMessage = error instanceof Error ? error.message : "Could not save investment entry.";
      toast.error(detailedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormWorkflowSubmit} className={styles.formContainer} noValidate>
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
            <p className={styles.speechText}>Define your asset name and shorthand ticker symbol.</p>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel} htmlFor="assetNameInputField">Asset Name</label>
            <input
              id="assetNameInputField"
              type="text"
              placeholder="e.g., S&P 500 Index, Ethereum Wallet"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              maxLength={60}
              required
              className={styles.primaryTextInput}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel} htmlFor="assetTickerInputField">Asset Ticker Symbol</label>
            <input
              id="assetTickerInputField"
              type="text"
              placeholder="e.g., SPY, ETH, PROP"
              value={assetSymbol}
              onChange={(e) => setAssetSymbol(e.target.value)}
              maxLength={12}
              required
              className={styles.primaryTextInput}
            />
          </div>

          <div className={styles.customToggleBox}>
            <div className={styles.toggleContext}>
              <span className={styles.toggleMainTitle}>Is this a unique custom profile?</span>
              <p className={styles.toggleSubtitle}>Enable manual override to record custom assets.</p>
            </div>
            <button
              type="button"
              className={styles.toggleActionBtn}
              onClick={() => setIsCustomMode(!isCustomMode)}
              aria-label="Toggle custom classification mode"
            >
              {isCustomMode ? <BsToggleOn className={styles.toggleOnIcon} /> : <BsToggleOff className={styles.toggleOffIcon} />}
            </button>
          </div>

          {!isCustomMode ? (
            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel} htmlFor="assetCategoryPresetSelect">Asset Category Class</label>
              <div className={styles.selectBoxFrame}>
                <select
                  id="assetCategoryPresetSelect"
                  value={selectedType}
                  onChange={(e) => handleTypeSelect(e.target.value)}
                  className={styles.cleanDropdownInput}
                >
                  {Array.from(new Set(INVESTMENT_TYPES.map(item => item.category))).map(categoryGroup => (
                    <optgroup key={categoryGroup} label={`${categoryGroup} Assets`} className={styles.dropdownGroupHead}>
                      {INVESTMENT_TYPES.filter(item => item.category === categoryGroup).map(filteredType => (
                        <option key={filteredType.id} value={filteredType.id}>
                          {filteredType.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel} htmlFor="customClassificationTextInput">Custom Asset Classification</label>
              <input
                id="customClassificationTextInput"
                type="text"
                placeholder="e.g., Vintage Sports Memorabilia"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                maxLength={40}
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
            <p className={styles.speechText}>Provide the values below to track performance.</p>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel} htmlFor="capitalSpentMonetaryInput">Total Invested (Capital Spent)</label>
            <div className={styles.currencyInputWrapper}>
              <span className={styles.currencyPrefixTag}>{workspaceCurrency}</span>
              <input
                id="capitalSpentMonetaryInput"
                type="number"
                step="0.01"
                min="0.01"
                max={999999999}
                placeholder="0.00"
                value={totalMoneySpent}
                onChange={(e) => setTotalMoneySpent(e.target.value)}
                required
                className={styles.monetaryTextInput}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel} htmlFor="assetQuantityOwnedInput">Total Quantity Owned</label>
            <div className={styles.currencyInputWrapper}>
              <input
                id="assetQuantityOwnedInput"
                type="number"
                step="any"
                min="0.00000001"
                max={999999999}
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
            <label className={styles.fieldLabel} htmlFor="investmentStrategyNotesArea">
              <span className={styles.noteTitleLine}><FaHeart /> Asset Strategy & Progress Note</span>
            </label>
            <textarea
              id="investmentStrategyNotesArea"
              placeholder="e.g., Initial entry cost basis locked."
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              maxLength={250}
              className={styles.textareaFieldElement}
              rows={3}
            />
          </div>

          <div className={styles.actionFooter}>
            <button 
              type="button" 
              onClick={() => setFormStep(1)} 
              className={styles.secondaryBtn}
              disabled={isSubmitting}
            >
              Go Back
            </button>
            <button 
              type="submit" 
              className={styles.submitVaultBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Securing Asset..." : "Secure Into Vault"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}