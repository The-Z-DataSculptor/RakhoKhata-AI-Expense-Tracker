// src/app/(dashboard)/dashboard/investment-vault/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { VaultHeader } from "@/components/investments/VaultHeader/VaultHeader";
import { VaultSummaryCards } from "@/components/investments/VaultSummaryCards/VaultSummaryCards";
import { VaultAssetTable } from "@/components/investments/VaultAssetTable/VaultAssetTable";
import { AddInvestmentForm } from "@/components/forms/AddInvestmentForm/AddInvestmentForm";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext"; // FIXED: Added Currency Context Import
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

interface Asset {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  userNote: string;
  currentPrice: number;
  quantityOwned: number;
  totalInvested: number;
  currency?: string; // FIXED: Added currency tag support for individual assets
  history: HistoryItem[];
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function InvestmentVaultPage() {
  const { currency: globalActiveCurrency } = useCurrency(); // Hook into the active global currency display code
  
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "asset-1",
      name: "Bitcoin",
      symbol: "BTC",
      icon: "₿",
      userNote: "Stored safely in my hardware wallet. Keeping this for long-term savings and tracking price updates regularly.",
      currentPrice: 65000,
      quantityOwned: 0.060,
      totalInvested: 35000,
      currency: "USD", // Seed placeholder asset defaults to USD
      history: [
        {
          id: "node-1",
          date: "2026-04-12",
          title: "First Purchase",
          note: "Bought my first setup amount of Bitcoin to start building my crypto portfolio.",
          amountAtTime: "0.060 BTC",
          investedAtTime: 35000,
          valueAtTime: 35000,
          roiAtTime: "0.0% ROI",
          isProfitAtTime: true
        }
      ]
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

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

  const handleSaveAsset = (savedData: any) => {
    if (editingAsset) {
      // --- LIVE PERSISTENCE SYSTEM EDITS ---
      setAssets(prevAssets =>
        prevAssets.map(item => 
          item.id === editingAsset.id 
            ? { ...item, ...savedData, id: editingAsset.id } 
            : item
        )
      );
    } else {
      // Inject standard initialization variables for completely new items
      const completelyNewAsset: Asset = {
        ...savedData,
        currency: savedData.currency || globalActiveCurrency.toUpperCase(), // Ensure currency is locked in payload
        id: `asset-${Date.now()}`
      };
      setAssets(prevAssets => [completelyNewAsset, ...prevAssets]);
    }
    handleCloseModal();
  };

  /* FIXED NOTE ON CURRENCY EVALUATION:
     If your sub-components (VaultSummaryCards / VaultAssetTable) apply currency conversion logic 
     internally assuming the value passed into them is USD, your inputs must be treated relative 
     to their logged native currency tag. 
     
     If you just want the math values to stop crashing across calculations, we make sure values 
     preserve their context structure here.
  */
  const totalCurrentValue = assets.reduce((sum, item) => sum + (item.quantityOwned * item.currentPrice), 0);
  const totalInvestedCapital = assets.reduce((sum, item) => sum + item.totalInvested, 0);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <main className={styles.vaultMainPageWrapper}>
      
      <VaultHeader onAddInvestmentClick={handleOpenAddModal} />

      <VaultSummaryCards 
        totalCurrentValueUSD={totalCurrentValue}
        totalInvestedCapitalUSD={totalInvestedCapital}
        topRunnerLabel={assets.length > 0 ? `${assets[0].symbol}` : "None"}
        portfolioMixLabel={`${assets.length} Active Tracks`}
        activeAssetsCount={assets.length}
      />

      <VaultAssetTable 
        assets={assets} 
        onEditClick={handleOpenEditModal} 
        onDeleteClick={handleDeleteAsset}
      />

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <AddInvestmentForm 
              onClose={handleCloseModal} 
              onSave={handleSaveAsset} 
              initialData={editingAsset}
            />
          </div>
        </div>
      )}

    </main>
  );
}
/* === SECTION 4 END === */