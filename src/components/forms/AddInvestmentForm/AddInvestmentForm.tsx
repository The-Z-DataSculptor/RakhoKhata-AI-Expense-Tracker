// src/components/forms/AddInvestmentForm/AddInvestmentForm.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import { 
  FaCoins, 
  FaChartLine, 
  FaBuilding, 
  FaPiggyBank, 
  FaGem, 
  FaHandHoldingDollar, 
  FaBriefcase, 
  FaWheatAwn, 
  FaWineGlass, 
  FaCar, 
  FaBolt, 
  FaKey, 
  FaMask, 
  FaUsersViewfinder, 
  FaArrowRight,
  FaHeart
} from "react-icons/fa6";
import { BsToggleOff, BsToggleOn } from "react-icons/bs";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext"; // Adjusted relative import path
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

interface AddInvestmentFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any; 
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
  const { currency } = useCurrency(); // Hooking into the currency changer context state
  const [formStep, setFormStep] = useState<number>(1);

  // Form Fields
  const [assetName, setAssetName] = useState<string>("");
  const [assetSymbol, setAssetSymbol] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>(INVESTMENT_TYPES[0].id);
  const [customType, setCustomType] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Financial Fields
  const [totalMoneySpent, setTotalMoneySpent] = useState<string>("");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [userNote, setUserNote] = useState<string>("");

  // Populate data when editing an asset
  useEffect(() => {
    if (initialData) {
      setAssetName(initialData.name || "");
      setAssetSymbol(initialData.symbol || "");
      setTotalMoneySpent(initialData.totalInvested?.toString() || "");
      setAmountReceived(initialData.quantityOwned?.toString() || "");
      setUserNote(initialData.userNote || "");
      
      const match = INVESTMENT_TYPES.find(item => item.iconString === initialData.icon);
      if (match) {
        setSelectedType(match.id);
        setIsCustomMode(false);
      } else {
        setIsCustomMode(true);
        setCustomType("Custom Item");
      }
    }
  }, [initialData]);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    const matched = INVESTMENT_TYPES.find(item => item.id === typeId);
    if (matched && !assetSymbol) {
      setAssetSymbol(matched.symbolDefault);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formStep === 1) {
      if (!assetName) return;
      setFormStep(2);
      return;
    }
    
    const activeTypeObj = INVESTMENT_TYPES.find(item => item.id === selectedType);
    const finalIconChar = isCustomMode ? "📦" : (activeTypeObj?.iconString || "💰");
    
    const totalInvestedCash = parseFloat(totalMoneySpent) || 0;
    const finalQuantityOwned = parseFloat(amountReceived) || 0;
    const calculatedUnitPrice = finalQuantityOwned > 0 ? (totalInvestedCash / finalQuantityOwned) : 0;

    let updatedHistory = [];

    // Format active currency for ledger context consistency
    const activeCurrencyLabel = currency.toUpperCase();

    if (initialData) {
      // --- LEDGER MEMORY LOGIC FOR EDITS ---
      const existingHistory = initialData.history ? [...initialData.history] : [];

      // Create history log entry if quantities changed
      if (initialData.totalInvested !== totalInvestedCash || initialData.quantityOwned !== finalQuantityOwned) {
        const oldTotalValue = initialData.quantityOwned * initialData.currentPrice;
        const oldProfitLoss = oldTotalValue - initialData.totalInvested;
        const oldRoi = initialData.totalInvested > 0 ? (oldProfitLoss / initialData.totalInvested) * 100 : 0;

        const historySnapshot = {
          id: `node-${Date.now()}-update`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          title: "Balance Adjusted",
          note: userNote.trim() || "Asset balances adjusted via secure profile manager.",
          amountAtTime: `${initialData.quantityOwned} ${initialData.symbol}`,
          investedAtTime: initialData.totalInvested,
          valueAtTime: oldTotalValue,
          roiAtTime: `${oldRoi >= 0 ? "+" : ""}${oldRoi.toFixed(1)}% ROI`,
          isProfitAtTime: oldProfitLoss >= 0
        };

        updatedHistory = [historySnapshot, ...existingHistory];
      } else {
        updatedHistory = existingHistory;
      }
    } else {
      // New profile setup logic path
      updatedHistory = [
        {
          id: `node-${Date.now()}-initial`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
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

    const builtAssetPayload = {
      name: assetName,
      symbol: assetSymbol.trim().toUpperCase() || "ITEM",
      icon: finalIconChar,
      userNote: userNote.trim(),
      currentPrice: calculatedUnitPrice, 
      quantityOwned: finalQuantityOwned,
      totalInvested: totalInvestedCash,
      currency: activeCurrencyLabel, // FIXED: Explicitly passes chosen currency context down to the onSave handler
      history: updatedHistory
    };

    onSave(builtAssetPayload);
  };

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

      {/* ==========================================================================
          === STEP 1: ASSET INFORMATION & CATEGORY SELECTION ===
          ========================================================================== */}
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

      {/* ==========================================================================
          === STEP 2: METRICS & CONVERSATIONAL BALANCE BALANCES ===
          ========================================================================== */}
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