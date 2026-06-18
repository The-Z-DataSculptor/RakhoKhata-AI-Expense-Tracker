// src/app/(dashboard)/dashboard/investment-vault/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import { VaultHeader } from "@/components/investments/VaultHeader/VaultHeader";
import { VaultSummaryCards } from "@/components/investments/VaultSummaryCards/VaultSummaryCards";
import { VaultAssetTable } from "@/components/investments/VaultAssetTable/VaultAssetTable";
import { AddInvestmentForm } from "@/components/forms/AddInvestmentForm/AddInvestmentForm";
import { VaultLockScreen } from "@/components/investments/VaultLockScreen/VaultLockScreen";
import { PinSetupModal } from "@/components/investments/PinSetupModal/PinSetupModal";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface HistoryItem {
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

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  userNote: string;
  currentPrice: number;
  quantityOwned: number;
  totalInvested: number;
  currency?: string; 
  history: HistoryItem[];
}

// Data coming directly from the form inputs
export interface InvestmentFormData {
  name: string;
  symbol: string;
  quantity: number;
  price: number;
  invested: number;
  note: string;
  currency?: string;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function InvestmentVaultPage() {
  const { currency: globalActiveCurrency } = useCurrency(); 
  
  // --- SECURITY & LOCK STATE ---
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isPinSetupOpen, setIsPinSetupOpen] = useState<boolean>(false);

  // --- ASSET DATA STATE ---
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "asset-1",
      name: "Bitcoin",
      symbol: "BTC",
      icon: "₿",
      userNote: "Stored safely in my hardware wallet. Keeping this for long-term savings.",
      currentPrice: 65000,
      quantityOwned: 0.060,
      totalInvested: 35000,
      currency: "USD",
      history: [
        {
          id: "node-1",
          date: "2026-04-12",
          title: "First Purchase",
          note: "Bought my first setup amount of Bitcoin.",
          amountAtTime: "0.060 BTC",
          investedAtTime: 35000,
          valueAtTime: 35000,
          roiAtTime: "0.0% ROI",
          isProfitAtTime: true
        }
      ]
    }
  ]);

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Wait for the first render to finish before checking localStorage to prevent cascading warnings
  useEffect(() => {
    const timerId = setTimeout(() => {
      const savedPin = localStorage.getItem("vault_pin");
      if (savedPin) {
        setIsLocked(true);
      }
      setIsAppReady(true);
    }, 0);

    return () => clearTimeout(timerId);
  }, []);

  // Modal control functions
  const handleOpenAddModal = () => {
    setEditingAsset(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (assetToEdit: Asset) => {
    setEditingAsset(assetToEdit);
    setIsModalOpen(true);
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(item => item.id !== assetId));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  // Safe data ingestion mapping InvestmentFormData properties to Asset properties
  const handleSaveAsset = (savedData: InvestmentFormData) => {
    if (editingAsset) {
      // Update existing asset by explicitly mapping the form fields to the Asset shape
      setAssets(prevAssets =>
        prevAssets.map(item => 
          item.id === editingAsset.id 
            ? { 
                ...item, 
                name: savedData.name,
                symbol: savedData.symbol,
                currentPrice: savedData.price, // Map price to currentPrice
                quantityOwned: savedData.quantity, // Map quantity to quantityOwned
                totalInvested: savedData.invested, // Map invested to totalInvested
                userNote: savedData.note, // Map note to userNote
              } 
            : item
        )
      );
    } else {
      // Create a brand new asset mapping the form fields securely
      const completelyNewAsset: Asset = {
        id: `asset-${Date.now()}`,
        name: savedData.name,
        symbol: savedData.symbol,
        icon: "📈", // Default fallback icon
        userNote: savedData.note,
        currentPrice: savedData.price,
        quantityOwned: savedData.quantity,
        totalInvested: savedData.invested,
        currency: savedData.currency || globalActiveCurrency.toUpperCase(),
        history: [], // Initialize with empty history
      };
      setAssets(prevAssets => [completelyNewAsset, ...prevAssets]);
    }
    handleCloseModal();
  };

  // Math variables
  const totalCurrentValue = assets.reduce((sum, item) => sum + (item.quantityOwned * item.currentPrice), 0);
  const totalInvestedCapital = assets.reduce((sum, item) => sum + item.totalInvested, 0);

  // FIX: Safely extract the top runner symbol to prevent TS array access errors in JSX
  const topRunner = assets.length > 0 ? assets : null;

  // Prevent UI flashing by waiting until we've checked the lock status
  if (!isAppReady) {
    return null; 
  }

  // If the vault is locked, STOP rendering the dashboard and ONLY show the lock screen
  if (isLocked) {
    return <VaultLockScreen onUnlock={() => setIsLocked(false)} />;
  }
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <main className={styles.vaultMainPageWrapper}>
      
      {/* HEADER SECTION */}
      <VaultHeader 
        onAddInvestmentClick={handleOpenAddModal} 
        onSetupPinClick={() => setIsPinSetupOpen(true)}
      />

      {/* SUMMARY CARDS */}
      <VaultSummaryCards 
        totalCurrentValueUSD={totalCurrentValue}
        totalInvestedCapitalUSD={totalInvestedCapital}
        topRunnerLabel={topRunner ? topRunner.symbol : "None"}
        portfolioMixLabel={`${assets.length} Active Tracks`}
        activeAssetsCount={assets.length}
      />

      {/* TABLE SECTION */}
      <VaultAssetTable 
        assets={assets} 
        onEditClick={handleOpenEditModal} 
        onDeleteClick={handleDeleteAsset}
      />

      {/* ADD / EDIT ASSET MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <AddInvestmentForm 
              onClose={handleCloseModal} 
              onSave={handleSaveAsset} 
            />
          </div>
        </div>
      )}

      {/* PIN SETUP MODAL */}
      <PinSetupModal 
        isOpen={isPinSetupOpen}
        onClose={() => setIsPinSetupOpen(false)}
        onSuccess={() => setIsPinSetupOpen(false)} 
      />

    </main>
  );
}
/* === SECTION 4 END === */