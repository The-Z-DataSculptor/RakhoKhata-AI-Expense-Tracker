// src/app/(dashboard)/dashboard/investment-vault/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DEPENDENCIES ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { investmentService, vaultAuthService } from "@/utils/api";

import { VaultHeader } from "@/components/investments/VaultHeader/VaultHeader";
import { VaultSummaryCards } from "@/components/investments/VaultSummaryCards/VaultSummaryCards";
import { VaultAssetTable } from "@/components/investments/VaultAssetTable/VaultAssetTable";
import { VaultLockScreen } from "@/components/investments/VaultLockScreen/VaultLockScreen";
import { AddInvestmentForm, type InvestmentAssetPayload, type InvestmentHistoryNode } from "@/components/forms/AddInvestmentForm/AddInvestmentForm";
import { PinSetupModal } from "@/components/investments/PinSetupModal/PinSetupModal";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { toast } from "sonner";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPE CONTRACTS & CUSTOM MAPPINGS ===
   ========================================================================== */
interface BackendInvestmentItem {
  id: string;
  assetSymbol: string;
  categoryClass: string;
  isCustomProfile: boolean;
  totalInvested: string | number;
  quantity: string | number;
  capitalCurrency: string;
  strategyNote: string;
  workspaceId: string;
  name?: string;
  icon?: string;
  userNote?: string;
  history?: InvestmentHistoryNode[];
}

export interface HydratedAsset {
  id: string;
  workspaceId: string;
  name: string;
  symbol: string;
  icon: string;
  userNote: string;
  currentPrice: number;
  quantityOwned: number;
  totalInvested: number;
  categoryClass: string;
  isCustomProfile: boolean;
  capitalCurrency: string;
  history: InvestmentHistoryNode[];
  // 👇 Enterprise fields for editing
  originalAmount: number;
  originalCurrency: string;
  baseAmountUSD: number;
}

interface ParsedStrategyData {
  displayName: string;
  displayIcon: string;
  rawNote: string;
  changeLog: InvestmentHistoryNode[];
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: STATE MECHANICS & FETCH PIPELINES ===
   ========================================================================== */
export default function InvestmentVaultPage() {
  const { activeWorkspaceId } = useWorkspace();
  const { currency, convertAmount } = useCurrency();

  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [hasDatabasePin, setHasDatabasePin] = useState<boolean>(true);
  const [assets, setAssets] = useState<HydratedAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  const [editingAsset, setEditingAsset] = useState<HydratedAsset | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const verifySecurityStatus = async () => {
      try {
        const status = await vaultAuthService.checkStatus();
        if (isMounted) {
          setHasDatabasePin(status.hasPin);
          if (!status.hasPin) {
            setIsVaultUnlocked(true);
          }
        }
      } catch (err) {
        console.error("Failed to sync security credentials:", err);
      }
    };
    verifySecurityStatus();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isMounted = true;
    if (!activeWorkspaceId || (hasDatabasePin && !isVaultUnlocked)) return;

    const fetchVaultHoldings = async () => {
      try {
        const response = await investmentService.getByWorkspace(activeWorkspaceId);

        if (isMounted) {
          const typedResponse = response as { investments: BackendInvestmentItem[] };
          const fetchedAssets = (typedResponse.investments || []).map((item: BackendInvestmentItem) => {
            const parsedDetails: ParsedStrategyData = {
              displayName: "",
              displayIcon: "💰",
              rawNote: "",
              changeLog: []
            };

            const rawData: unknown = item.strategyNote;

            try {
              let currentData: unknown = rawData;
              while (typeof currentData === 'string') {
                if (!currentData.trim().startsWith('{') && !currentData.trim().startsWith('"') && !currentData.trim().startsWith('[')) {
                  break;
                }
                currentData = JSON.parse(currentData) as unknown;
              }

              if (currentData && typeof currentData === 'object' && !Array.isArray(currentData)) {
                const safeData = currentData as Record<string, unknown>;
                parsedDetails.displayName = (safeData.displayName as string) || "";
                parsedDetails.displayIcon = (safeData.displayIcon as string) || "💰";
                parsedDetails.rawNote = (safeData.rawNote as string) || "";
                parsedDetails.changeLog = (safeData.changeLog as InvestmentHistoryNode[]) || [];
              }
            } catch (jsonError) {
              console.error("Failed to parse custom strategy metadata details object:", jsonError);
            }

            const rawQuantity = Number(item.quantity) || 0;
            const databaseTotalInvested = Number(item.totalInvested) || 0;
            const localizedTotalInvested = convertAmount(databaseTotalInvested, "PKR", currency);
            const localizedUnitPrice = rawQuantity > 0 ? (localizedTotalInvested / rawQuantity) : 0;

            return {
              id: item.id,
              workspaceId: item.workspaceId,
              symbol: item.assetSymbol,
              categoryClass: item.categoryClass,
              isCustomProfile: item.isCustomProfile,
              totalInvested: localizedTotalInvested, 
              quantityOwned: rawQuantity,
              currentPrice: localizedUnitPrice, 
              capitalCurrency: currency, 
              name: parsedDetails.displayName || item.name || `${item.assetSymbol} Position`,
              icon: parsedDetails.displayIcon || item.icon || "💰",
              userNote: parsedDetails.rawNote || "",
              history: parsedDetails.changeLog || [],
              // 👇 Enterprise fields for editing – using the actual capital currency from the database
              originalAmount: databaseTotalInvested,
              originalCurrency: item.capitalCurrency || "PKR", // fallback to PKR if missing
              baseAmountUSD: databaseTotalInvested,
            };
          });

          setAssets(fetchedAssets);
        }
      } catch (error: unknown) {
        if (isMounted) {
          const msg = error instanceof Error ? error.message : "Vault data link sync failure.";
          toast.error(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVaultHoldings();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, refreshKey, isVaultUnlocked, hasDatabasePin, currency, convertAmount]);

  const handleEditClick = (asset: HydratedAsset) => {
    setEditingAsset(asset);        
    setIsModalOpen(true);          
  };

  const handleSaveInvestment = async (payload: InvestmentAssetPayload) => {
    try {
      // 👇 Use the enterprise fields from the form payload
      const apiPayload = {
        assetSymbol: payload.symbol,
        categoryClass: payload.categoryClass,
        isCustomProfile: payload.name.toLowerCase().includes("custom"),
        totalInvested: payload.originalAmount,
        capitalCurrency: payload.originalCurrency,
        quantity: payload.quantityOwned,
        strategyNote: JSON.stringify({
          displayName: payload.name,
          displayIcon: payload.icon,
          rawNote: payload.userNote,
          changeLog: payload.history
        }),
        workspaceId: activeWorkspaceId,
        // 👇 ENTERPRISE FIELDS
        originalAmount: payload.originalAmount,
        originalCurrency: payload.originalCurrency,
        baseAmountUSD: payload.baseAmountUSD,
      };

      if (editingAsset) {
        await investmentService.update(editingAsset.id, apiPayload);
        toast.success("Asset profile updated successfully!");
      } else {
        await investmentService.create(apiPayload);
        toast.success("New asset profile securely appended to storage trackers.");
      }

      setIsModalOpen(false);
      setEditingAsset(null);        
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Database ingestion processing crash.";
      toast.error(msg);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this asset row from your secure vault?")) return;
    try {
      await investmentService.delete(id);
      toast.success("Asset row profile cleanly purged out of records.");
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Teardown routine sequence error.";
      toast.error(msg);
    }
  };

  const globalTotalInvested = assets.reduce((sum, item) => sum + item.totalInvested, 0);
  const totalPositionsCount = assets.length;
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: STRUCTURAL LAYOUT OUTPUT SYSTEM (JSX) ===
     ========================================================================== */

  if (hasDatabasePin && !isVaultUnlocked) {
    return (
      <div className={styles.vaultMainPageWrapper}>
        <VaultLockScreen onUnlock={() => setIsVaultUnlocked(true)} />
      </div>
    );
  }

  if (isLoading && !isVaultUnlocked) {
    return (
      <div className={styles.loadingSpinnerContainer}>
        <p className={styles.loadingPulseText}>Synchronizing Secure Asset Portfolios...</p>
      </div>
    );
  }

  return (
    <div className={styles.vaultMainPageWrapper}>

      <VaultHeader 
        hasPinEnabled={hasDatabasePin}
        onAddAssetClick={() => {
          setEditingAsset(null);  
          setIsModalOpen(true);
        }} 
        onSetupPinClick={() => setIsSecurityModalOpen(true)}
      />

      <VaultSummaryCards
        currency={currency}
        positionsCount={totalPositionsCount}
        totalInvested={globalTotalInvested}
      />

      <main className={styles.mainContentLayoutBlock}>
        <VaultAssetTable
          assets={assets}
          currency={currency}
          onDeleteAsset={handleDeleteAsset}
          onEditClick={handleEditClick}  
        />
      </main>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => {
          setIsModalOpen(false);
          setEditingAsset(null);  
        }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <AddInvestmentForm
              onClose={() => {
                setIsModalOpen(false);
                setEditingAsset(null);  
              }}
              onSave={handleSaveInvestment}
              initialData={editingAsset}  
            />
          </div>
        </div>
      )}

      <PinSetupModal 
        isOpen={isSecurityModalOpen}
        mode="SETUP"
        onClose={() => setIsSecurityModalOpen(false)}
        onSuccess={() => {
          setIsSecurityModalOpen(false);
          setIsVaultUnlocked(false); 
          setRefreshKey((prev) => prev + 1); 
        }} 
      />

      <footer className={styles.footerContainerBlock}>
        <DashboardFooter />
      </footer>

    </div>
  );
}
/* === SECTION 4 END === */