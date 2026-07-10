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
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext"; 
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
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
  workspaceId: string; 
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
  const { activeWorkspaceId } = useWorkspace(); 
  
  // --- SECURITY & LOCK STATE ---
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isPinSetupOpen, setIsPinSetupOpen] = useState<boolean>(false);

  // --- ASSET DATA STATE ---
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "asset-1",
      workspaceId: "ws-personal-default", 
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
    },
    {
      id: "asset-2",
      workspaceId: "ws-business-default", 
      name: "Ethereum",
      symbol: "ETH",
      icon: "Ξ",
      userNote: "Business treasury reserve. Holding for smart contract deployments.",
      currentPrice: 3500,
      quantityOwned: 5.5,
      totalInvested: 15000,
      currency: "USD",
      history: []
    }
  ]);

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Check vault validation parameters cleanly upon initial component compilation structures
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

  const handleSaveAsset = (savedData: InvestmentFormData) => {
    if (editingAsset) {
      setAssets(prevAssets =>
        prevAssets.map(item => 
          item.id === editingAsset.id 
            ? { 
                ...item, 
                name: savedData.name,
                symbol: savedData.symbol,
                currentPrice: savedData.price, 
                quantityOwned: savedData.quantity, 
                totalInvested: savedData.invested, 
                userNote: savedData.note, 
              } 
            : item
        )
      );
    } else {
      const completelyNewAsset: Asset = {
        id: `asset-${Date.now()}`,
        workspaceId: activeWorkspaceId, 
        name: savedData.name,
        symbol: savedData.symbol,
        icon: "📈", 
        userNote: savedData.note,
        currentPrice: savedData.price,
        quantityOwned: savedData.quantity,
        totalInvested: savedData.invested,
        currency: savedData.currency || globalActiveCurrency.toUpperCase(),
        history: [], 
      };
      setAssets(prevAssets => [completelyNewAsset, ...prevAssets]);
    }
    handleCloseModal();
  };

  // --- DATA FILTERING ENGINE ---
  const filteredAssets = assets.filter(item => item.workspaceId === activeWorkspaceId);

  const totalCurrentValue = filteredAssets.reduce((sum, item) => sum + (item.quantityOwned * item.currentPrice), 0);
  const totalInvestedCapital = filteredAssets.reduce((sum, item) => sum + item.totalInvested, 0);

  const topRunner = filteredAssets.length > 0 ? filteredAssets[0] : null;

  if (!isAppReady) {
    return null; 
  }

  if (isLocked) {
    return <VaultLockScreen onUnlock={() => setIsLocked(false)} />;
  }
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <main className={styles.vaultMainPageWrapper}>
      
      {/* HEADER SECTION PANEL CONTROLS */}
      <VaultHeader 
        onAddInvestmentClick={handleOpenAddModal} 
        onSetupPinClick={() => setIsPinSetupOpen(true)}
      />

      {/* SUMMARY CAPITAL METRIC TRACKERS */}
      <VaultSummaryCards 
        totalCurrentValueUSD={totalCurrentValue}
        totalInvestedCapitalUSD={totalInvestedCapital}
        topRunnerLabel={topRunner ? topRunner.symbol : "None"}
        portfolioMixLabel={`${filteredAssets.length} Active Tracks`}
        activeAssetsCount={filteredAssets.length}
      />

      {/* MAIN DATA STORAGE SHEET COMPONENT */}
      <VaultAssetTable 
        assets={filteredAssets} 
        onEditClick={handleOpenEditModal} 
        onDeleteClick={handleDeleteAsset}
      />

      {/* ADD / EDIT ASSET OVERLAY DIALOGS */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <AddInvestmentForm 
              onClose={handleCloseModal} 
              onSave={handleSaveAsset} 
            />
          </div>
        </div>
      )}

      {/* PIN SETUP INTERACTIVE POPUP SHEET */}
      {/* IMPROVEMENT: Now conditionally checked to prevent blank container footprints */}
      {isPinSetupOpen && (
        <PinSetupModal 
          isOpen={isPinSetupOpen}
          onClose={() => setIsPinSetupOpen(false)}
          onSuccess={() => setIsPinSetupOpen(false)} 
        />
      )}

      {/* CLEAN & GENERIC SYSTEM FOOTER ANCHOR */}
      <footer className={styles.footerContainerBlock}>
        <DashboardFooter />
      </footer>

    </main>
  );
}
/* === SECTION 4 END === */