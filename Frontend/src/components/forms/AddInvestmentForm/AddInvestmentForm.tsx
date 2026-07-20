// src/components/forms/AddInvestmentForm/AddInvestmentForm.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
/* === SECTION 1: IMPORTS & DATA CONTRACTS === */
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
/* === SECTION 2: TYPES, INTERFACES & UTILITIES === */
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

// Static tracking configuration matrix mapping asset classification behaviors safely
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
/* === SECTION 3: CORE LOGIC ENGINE & HANDLERS === */
export function AddInvestmentForm({ onClose, onSave, initialData }: AddInvestmentFormProps) {
  // Pull centralized multi-currency formatting calculations out of the active store contexts
  const { convertAmount } = useCurrency();
  const { activeWorkspace } = useWorkspace();
  const workspaceCurrency = activeWorkspace?.currency || "PKR";

  // Parse baseline fallback text constants from initial data profiles where available
  const initialName = initialData?.name || "";
  const initialSymbol = initialData?.symbol || "";
  const initialQty = initialData?.quantityOwned?.toString() || "";
  const initialNote = initialData?.userNote || "";

  // Scan cross references on component construction to preserve asset selection indicators
  const matchedTypeOnMount = initialData
    ? INVESTMENT_TYPES.find(item => item.iconString === initialData.icon)
    : null;

  const initialSelectedType = matchedTypeOnMount ? matchedTypeOnMount.id : INVESTMENT_TYPES[0].id;
  const initialIsCustomMode = Boolean(initialData && !matchedTypeOnMount);
  const initialCustomType = initialIsCustomMode ? (initialData?.categoryClass || "Custom Item") : "";

  // Display raw numerical figures directly without nested operational conversion leaks
  const rawTotalInvested = initialData?.totalInvested || 0;
  const initialMoneyStr = initialData ? rawTotalInvested.toString() : "";

  // --- LOCAL REACTION COMPONENT STATE HOOKS ---
  const [formStep, setFormStep] = useState<number>(1);
  const [assetName, setAssetName] = useState<string>(initialName);
  const [assetSymbol, setAssetSymbol] = useState<string>(initialSymbol || INVESTMENT_TYPES[0].symbolDefault);
  const [selectedType, setSelectedType] = useState<string>(initialSelectedType);
  const [customType, setCustomType] = useState<string>(initialCustomType);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(initialIsCustomMode);
  
  const [totalMoneySpent, setTotalMoneySpent] = useState<string>(initialMoneyStr);
  const [amountReceived, setAmountReceived] = useState<string>(initialQty);
  const [userNote, setUserNote] = useState<string>(initialNote);

  /** Maps the standard shorthand tickers automatically when changing preset type dropdown rows */
  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    const matchedOption = INVESTMENT_TYPES.find(item => item.id === typeId);
    if (matchedOption) {
      setAssetSymbol(matchedOption.symbolDefault);
    }
  };

  /** Validates form step constraints and structures the data object payload for persistence hooks */
  const handleFormWorkflowSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // STEP 1: Verify identity fields are within parameters before sliding forward
    if (formStep === 1) {
      if (!assetName.trim() || !assetSymbol.trim()) {
        toast.error("Please provide a valid name and ticker symbol.");
        return;
      }
      setFormStep(2);
      return;
    }

    // STEP 2: Process numeric matrix logs defensively
    try {
      const activeTypeObj = INVESTMENT_TYPES.find(item => item.id === selectedType);
      const finalIconChar = isCustomMode ? "📦" : (activeTypeObj?.iconString || "💰");
      const finalCategoryClass = isCustomMode ? (customType.trim() || "Custom Position") : (activeTypeObj?.category || "Traditional");

      const rawMoneySpent = parseFloat(totalMoneySpent);
      const finalQuantityOwned = parseFloat(amountReceived);

      if (isNaN(rawMoneySpent) || rawMoneySpent <= 0 || isNaN(finalQuantityOwned) || finalQuantityOwned <= 0) {
        toast.error("Monetary values and quantities owned must be positive numerical digits.");
        return;
      }

      // Convert capital values cleanly into USD for normalized portfolio data storage metrics
      const normalizedTotalInvested = convertAmount(rawMoneySpent, workspaceCurrency, "USD");
      const calculatedUnitPrice = finalQuantityOwned > 0 ? (rawMoneySpent / finalQuantityOwned) : 0;

      let updatedHistory: InvestmentHistoryNode[] = [];
      const localizedDateString = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      // Generate history log snapshots dynamically based on profile modification contexts
      if (initialData) {
        const existingHistory = initialData.history ? [...initialData.history] : [];
        const isBalanceShifted = Math.abs((initialData.totalInvested || 0) - rawMoneySpent) > 0.001 || initialData.quantityOwned !== finalQuantityOwned;
        
        if (isBalanceShifted) {
          const historySnapshot: InvestmentHistoryNode = {
            id: `node-${Date.now()}-update`,
            date: localizedDateString,
            title: "Balance Adjusted",
            note: userNote.trim() || "Asset balances adjusted via secure portfolio manager.",
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
        // Build the initial ledger logging timeline baseline node elements
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

      // Consolidate properties into a production ready data transfer contract object
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

      // Bubble verified payload properties back up to parent execution managers
      onSave(builtAssetPayload);

    } catch (error: unknown) {
      console.error("Investment allocation exception hook event details:", error);
      toast.error("Could not secure investment entry records. Verify numeric parameter scales.");
    }
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPORTS / RENDER COMPONENT ===
   ========================================================================== */
/* === SECTION 4: EXPORTS / RENDER COMPONENT === */
  return (
    <form onSubmit={handleFormWorkflowSubmit} className={styles.formContainer} noValidate>
      {/* FLOW TIMELINE PROGRESS BAR HEADER */}
      <div className={styles.progressHeader}>
        <div className={`${styles.progressTab} ${formStep >= 1 ? styles.activeTab : ""}`}>
          <span className={styles.tabIndex}>1</span> Identify Asset
        </div>
        <div className={styles.tabLine} />
        <div className={`${styles.progressTab} ${formStep === 2 ? styles.activeTab : ""}`}>
          <span className={styles.tabIndex}>2</span> Configure Balances
        </div>
      </div>

      {/* STEP 1 ARCHITECTURE: IDENTITY PRESETS AND CLASSIFICATIONS */}
      {formStep === 1 && (
        <div className={styles.stepWrapper}>
          <div className={styles.promptSpeechBubble}>
            <h3 className={styles.speechTitle}>Establish Asset Identity</h3>
            <p className={styles.speechText}>Define your asset name and shorthand ticker symbol.</p>
          </div>

          {/* ASSET NAME TEXT INPUT */}
          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel} htmlFor="assetNameInputField">Asset Name</label>
            <input
              id="assetNameInputField"
              type="text"
              placeholder="e.g., S&P 500 Index, Ethereum Wallet"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              maxLength={60} // Buffer limit safety block
              required
              className={styles.primaryTextInput}
            />
          </div>

          {/* TICKER SYMBOL TEXT INPUT */}
          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel} htmlFor="assetTickerInputField">Asset Ticker Symbol</label>
            <input
              id="assetTickerInputField"
              type="text"
              placeholder="e.g., SPY, ETH, PROP"
              value={assetSymbol}
              onChange={(e) => setAssetSymbol(e.target.value)}
              maxLength={12} // Strict length cap for ticker symbols
              required
              className={styles.primaryTextInput}
            />
          </div>

          {/* MANUAL OVERRIDE OVERLAY SLIDER CONTROL CHANNELS */}
          <div className={styles.customToggleBox}>
            <div className={styles.toggleContext}>
              <span className={styles.toggleMainTitle}>Is this a unique custom profile?</span>
              <p className={styles.toggleSubtitle}>Enable manual override to record specific collectible variants or off‑market items.</p>
            </div>
            <button
              type="button"
              className={styles.toggleActionBtn}
              onClick={() => setIsCustomMode(!isCustomMode)}
              aria-label="Toggle custom asset classification mode"
            >
              {isCustomMode ? <BsToggleOn className={styles.toggleOnIcon} /> : <BsToggleOff className={styles.toggleOffIcon} />}
            </button>
          </div>

          {/* CONDITIONAL SELECTION BLOCK: PRESETS VS CUSTOM INPUT LAYOUT FIELDS */}
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

          {/* STEP 1 NAVIGATION ROUTING ACTION BUTTONS */}
          <div className={styles.actionFooter}>
            <button type="button" onClick={onClose} className={styles.secondaryBtn}>Cancel</button>
            <button type="submit" className={styles.primaryBtn}>
              Next Step <FaArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 ARCHITECTURE: MONETARY HOLDINGS QUANTITY AND STRATEGY BALANCES */}
      {formStep === 2 && (
        <div className={styles.stepWrapper}>
          <div className={styles.promptSpeechBubble}>
            <h3 className={styles.speechTitle}>Calculate Investment Metrics</h3>
            <p className={styles.speechText}>Provide the values below. Your performance yield and progress totals will initialize automatically.</p>
          </div>

          {/* CAPITAL SPENT MONETARY INPUT */}
          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel} htmlFor="capitalSpentMonetaryInput">Total Invested (Capital Spent)</label>
            <div className={styles.currencyInputWrapper}>
              <span className={styles.currencyPrefixTag}>{workspaceCurrency}</span>
              <input
                id="capitalSpentMonetaryInput"
                type="number"
                step="0.01"
                min="0.01"
                max={999999999} // Guard against arbitrary multi-billion value integer processing errors
                placeholder="0.00"
                value={totalMoneySpent}
                onChange={(e) => setTotalMoneySpent(e.target.value)}
                required
                className={styles.monetaryTextInput}
              />
            </div>
          </div>

          {/* QUANTITY OWNED FRACTIONAL VALUE INPUT */}
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

          {/* STRATEGIC NOTE PARSING FIELD */}
          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel} htmlFor="investmentStrategyNotesArea">
              <span className={styles.noteTitleLine}><FaHeart /> Asset Strategy & Progress Note</span>
            </label>
            <textarea
              id="investmentStrategyNotesArea"
              placeholder="e.g., Initial entry cost basis locked."
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              maxLength={250} // Restrict length sizes to avoid buffer database exhaustion states
              className={styles.textareaFieldElement}
              rows={3}
            />
          </div>

          {/* STEP 2 COMMIT TRIGGERS DECK */}
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
/* === SECTION 4 END === */