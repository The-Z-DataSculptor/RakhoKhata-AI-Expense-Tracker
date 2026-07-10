// src/components/forms/AddInvestmentForm/AddInvestmentForm.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useCallback } from "react"; 
import { FaArrowRight, FaHeart } from "react-icons/fa6";
import { BsToggleOff, BsToggleOn } from "react-icons/bs";
import { toast } from "sonner"; 
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext"; 
import styles from "./AddInvestmentForm.module.css";
/* === SECTION 1 END === */

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
  userNote: string;
  currentPrice: number;
  quantityOwned: number;
  totalInvested: number;
  currency: string;
  history: InvestmentHistoryNode[];
}

// FIXED: Defined explicit blueprint contract layout parameters to completely remove 'any'
export interface InitialInvestmentData {
  id: string;
  name?: string;
  symbol?: string;
  icon?: string;
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
  const { currency } = useCurrency(); 
  const [formStep, setFormStep] = useState<number>(1);

  // Helper macro configures structural defaults instantly on initialization paint cycles
  const matchedTypeOnMount = initialData 
    ? INVESTMENT_TYPES.find(item => item.iconString === initialData.icon) 
    : null;

  /* FIXED: Initialize state variables DIRECTLY from props to comply with strict state management guidelines */
  const [assetName, setAssetName] = useState<string>(initialData?.name || "");
  const [assetSymbol, setAssetSymbol] = useState<string>(initialData?.symbol || (matchedTypeOnMount ? matchedTypeOnMount.symbolDefault : INVESTMENT_TYPES[0].symbolDefault));
  const [selectedType, setSelectedType] = useState<string>(matchedTypeOnMount ? matchedTypeOnMount.id : INVESTMENT_TYPES[0].id);
  const [customType, setCustomType] = useState<string>(initialData && !matchedTypeOnMount ? "Custom Item" : "");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(initialData && !matchedTypeOnMount ? true : false);

  const [totalMoneySpent, setTotalMoneySpent] = useState<string>(initialData?.totalInvested?.toString() || "");
  const [amountReceived, setAmountReceived] = useState<string>(initialData?.quantityOwned?.toString() || "");
  const [userNote, setUserNote] = useState<string>(initialData?.userNote || "");

  // Tracks the context lifecycle configuration parameters to see if profile shifts occur
  const [prevId, setPrevId] = useState<string | undefined>(initialData?.id);

  /* FIXED: Render-phase adjustment pattern replaces useEffect completely, 
     preventing cascading render warnings when parent props dynamically update */
  if (initialData?.id !== prevId) {
    setPrevId(initialData?.id);
    setAssetName(initialData?.name || "");
    setAssetSymbol(initialData?.symbol || "");
    setTotalMoneySpent(initialData?.totalInvested?.toString() || "");
    setAmountReceived(initialData?.quantityOwned?.toString() || "");
    setUserNote(initialData?.userNote || "");
    
    const match = INVESTMENT_TYPES.find(item => item.iconString === initialData?.icon);
    if (match) {
      setSelectedType(match.id);
      setIsCustomMode(false);
    } else {
      setIsCustomMode(initialData ? true : false);
      setCustomType(initialData ? "Custom Item" : "");
    }
  }

  const handleTypeSelect = useCallback((typeId: string) => {
    setSelectedType(typeId);
    const matched = INVESTMENT_TYPES.find(item => item.id === typeId);
    if (matched && !assetSymbol) {
      setAssetSymbol(matched.symbolDefault);
    }
  }, [assetSymbol]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
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
      
      const totalInvestedCash = parseFloat(totalMoneySpent) || 0;
      const finalQuantityOwned = parseFloat(amountReceived) || 0;
      const calculatedUnitPrice = finalQuantityOwned > 0 ? (totalInvestedCash / finalQuantityOwned) : 0;

      let updatedHistory: InvestmentHistoryNode[] = [];
      const activeCurrencyLabel = currency.toUpperCase();
      const localizedDateString = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (initialData) {
        const existingHistory = initialData.history ? [...initialData.history] : [];

        if (initialData.totalInvested !== totalInvestedCash || initialData.quantityOwned !== finalQuantityOwned) {
          const oldTotalValue = (initialData.quantityOwned || 0) * (initialData.currentPrice || 0);
          const oldProfitLoss = oldTotalValue - (initialData.totalInvested || 0);
          const oldRoi = (initialData.totalInvested || 0) > 0 ? (oldProfitLoss / (initialData.totalInvested || 0)) * 100 : 0;

          const historySnapshot: InvestmentHistoryNode = {
            id: `node-${Date.now()}-update`,
            date: localizedDateString,
            title: "Balance Adjusted",
            note: userNote.trim() || "Asset balances adjusted via secure profile manager.",
            amountAtTime: `${finalQuantityOwned} ${assetSymbol.trim().toUpperCase()}`,
            investedAtTime: totalInvestedCash,
            valueAtTime: oldTotalValue,
            roiAtTime: `${oldRoi >= 0 ? "+" : ""}${oldRoi.toFixed(1)}% ROI`,
            isProfitAtTime: oldProfitLoss >= 0
          };

          updatedHistory = [historySnapshot, ...existingHistory];
        } else {
          updatedHistory = existingHistory;
        }
      } else {
        updatedHistory = [
          {
            id: `node-${Date.now()}-initial`,
            date: localizedDateString,
            title: "Initial Log",
            note: userNote.trim() || "Asset profile successfully logged in safe vault.",
            amountAtTime: `${finalQuantityOwned} ${assetSymbol.trim().toUpperCase()}`,
            investedAtTime: totalInvestedCash,
            valueAtTime: totalInvestedCash,
            roiAtTime: "0.0% ROI",
            isProfitAtTime: true
          }
        ];
      }

      const builtAssetPayload: InvestmentAssetPayload = {
        name: assetName.trim(),
        symbol: assetSymbol.trim().toUpperCase() || "ITEM",
        icon: finalIconChar,
        userNote: userNote.trim(),
        currentPrice: calculatedUnitPrice, 
        quantityOwned: finalQuantityOwned,
        totalInvested: totalInvestedCash,
        currency: activeCurrencyLabel, 
        history: updatedHistory
      };

      onSave(builtAssetPayload);

      if (initialData) {
        toast.success("Investment asset modifications saved successfully!");
      } else {
        toast.success("Asset securely pinned to investment vault.");
      }
    } catch (error) {
      console.error("Investment allocation handling operational pipeline failure:", error);
      toast.error("Could not secure investment entry records. Verify numeric inputs.");
    }
  }, [
    formStep, 
    assetName, 
    assetSymbol, 
    selectedType, 
    isCustomMode, 
    totalMoneySpent, 
    amountReceived, 
    userNote, 
    currency, 
    initialData, 
    onSave
  ]);
/* === SECTION 3 END === */

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

      {/* STEP 1: ASSET INFORMATION & CATEGORY SELECTION */}
      {formStep === 1 && (
        <div className={styles.stepWrapper}>
          <div className={styles.promptSpeechBubble}>
            <h3 className={styles.speechTitle}>Establish Asset Identity</h3>
            <p className={styles.speechText}>Define your asset name and shorthand symbol. This ensures your progress ledger aggregates historical tracking updates accurately.</p>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>Asset Name</label>
            <input 
              type="text" 
              placeholder="e.g., S&P 500 Index, Ethereum Wallet, Real Estate Fund" 
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
              <p className={styles.toggleSubtitle}>Enable manual override to record specific collectible variants or off-market items safely.</p>
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
                placeholder="e.g., Vintage Sports Memorabilia, Private Equity Allocation" 
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

      {/* STEP 2: METRICS & CONVERSATIONAL BALANCE BALANCES */}
      {formStep === 2 && (
        <div className={styles.stepWrapper}>
          <div className={styles.promptSpeechBubble}>
            <h3 className={styles.speechTitle}>Calculate Investment Metrics</h3>
            <p className={styles.speechText}>Provide the values below. Your live performance yield, progress totals, and percentage parameters will initialize automatically.</p>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>Total Invested (Capital Spent)</label>
            <div className={styles.currencyInputWrapper}>
              <span className={styles.currencyPrefixTag}>{currency}</span>
              <input 
                type="number" 
                step="any"
                placeholder="0.00" 
                value={totalMoneySpent}
                onChange={(e) => setTotalMoneySpent(e.target.value)}
                required
                className={styles.monetaryTextInput}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>
              Total Quantity Owned
            </label>
            <div className={styles.currencyInputWrapper}>
              <input 
                type="number" 
                step="any"
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
              placeholder="e.g., Initial entry cost basis locked. Tracking long-term growth trajectory..." 
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
/* === SECTION 4 END === */