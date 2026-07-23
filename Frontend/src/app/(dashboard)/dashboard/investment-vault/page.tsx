// src/app/(dashboard)/dashboard/investment-vault/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DEPENDENCIES ===
   ========================================================================== */
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  quantity: string | number;
  strategyNote: string;
  workspaceId: string;
  name?: string;
  icon?: string;
  userNote?: string;
  history?: InvestmentHistoryNode[];
  originalAmount?: string | number;
  originalCurrency?: string;
  baseAmountUSD?: string | number;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // WHY THIS FIX WAS MADE: Added page-level saving lock state to prevent re-entrant 
  // execution of handleSaveInvestment if invoked multiple times before react renders state updates.
  const [isSavingAsset, setIsSavingAsset] = useState<boolean>(false);

  const [editingAsset, setEditingAsset] = useState<HydratedAsset | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  // Verify whether the vault requires PIN authentication on initial mount
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
    return () => { isMounted = false; };
  }, [refreshKey]);

  // Fetch vault holdings securely when workspace and lock state are validated
  useEffect(() => {
    let isMounted = true;
    if (!activeWorkspaceId || (hasDatabasePin && !isVaultUnlocked)) {
      return;
    }

    const fetchVaultHoldings = async () => {
      try {
        if (isMounted) setIsLoading(true);
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
              if (typeof rawData === 'string' && rawData.trim()) {
                let currentData: unknown = rawData;
                let parseDepth = 0;
                
                while (typeof currentData === 'string' && parseDepth < 3) {
                  const trimmed = currentData.trim();
                  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                    break;
                  }
                  currentData = JSON.parse(currentData) as unknown;
                  parseDepth++;
                }

                if (currentData && typeof currentData === 'object' && !Array.isArray(currentData)) {
                  const safeData = currentData as Record<string, unknown>;
                  parsedDetails.displayName = typeof safeData.displayName === 'string' ? safeData.displayName : "";
                  parsedDetails.displayIcon = typeof safeData.displayIcon === 'string' ? safeData.displayIcon : "💰";
                  parsedDetails.rawNote = typeof safeData.rawNote === 'string' ? safeData.rawNote : "";
                  parsedDetails.changeLog = Array.isArray(safeData.changeLog) ? (safeData.changeLog as InvestmentHistoryNode[]) : [];
                }
              }
            } catch (jsonError) {
              console.error("Failed to parse strategy note safely:", jsonError);
            }

            const rawQuantity = Number(item.quantity) || 0;
            const originalAmount = Number(item.originalAmount || 0);
            const originalCurrency = item.originalCurrency || "USD";
            const baseAmountUSD = Number(item.baseAmountUSD || 0);

            let localizedTotalInvested: number;
            if (originalCurrency === currency) {
              localizedTotalInvested = originalAmount;
            } else {
              localizedTotalInvested = convertAmount(baseAmountUSD, "USD", currency);
            }

            const localizedUnitPrice = rawQuantity > 0 ? Number((localizedTotalInvested / rawQuantity).toFixed(4)) : 0;

            return {
              id: item.id,
              workspaceId: item.workspaceId,
              symbol: item.assetSymbol,
              categoryClass: item.categoryClass,
              isCustomProfile: item.isCustomProfile,
              totalInvested: localizedTotalInvested,
              quantityOwned: rawQuantity,
              currentPrice: localizedUnitPrice,
              capitalCurrency: originalCurrency,
              name: parsedDetails.displayName || item.name || `${item.assetSymbol} Position`,
              icon: parsedDetails.displayIcon || item.icon || "💰",
              userNote: parsedDetails.rawNote || "",
              history: parsedDetails.changeLog || [],
              originalAmount,
              originalCurrency,
              baseAmountUSD,
            };
          });

          setAssets(fetchedAssets);
        }
      } catch (error) {
        console.error("Fetch holdings error:", error);
        if (isMounted) {
          toast.error("Vault data link sync failure.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchVaultHoldings();

    return () => { isMounted = false; };
  }, [activeWorkspaceId, refreshKey, isVaultUnlocked, hasDatabasePin, currency, convertAmount]);

  const handleEditClick = useCallback((asset: HydratedAsset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  }, []);

  const handleSaveInvestment = async (payload: InvestmentAssetPayload) => {
    if (isSavingAsset) return;

    try {
      if (!activeWorkspaceId) {
        toast.error("No active ledger workspace context found.");
        return;
      }

      setIsSavingAsset(true);

      const apiPayload = {
        workspaceId: activeWorkspaceId,
        isCustomProfile: payload.icon === "📦",
        categoryClass: String(payload.categoryClass || "GENERAL"),
        assetSymbol: String(payload.symbol || "").trim().toUpperCase(),
        quantity: Number(payload.quantityOwned) || 0,
        originalAmount: Number(payload.originalAmount) || 0,
        originalCurrency: String(payload.originalCurrency || currency),
        baseAmountUSD: Number(payload.baseAmountUSD) || 0,
        name: String(payload.name || "Untitled Asset").trim(),
        icon: String(payload.icon || "💰"),
        userNote: String(payload.userNote || "").trim(),
        history: payload.history || [],
        strategyNote: JSON.stringify({
          displayName: String(payload.name || "").trim(),
          displayIcon: String(payload.icon || "💰"),
          rawNote: String(payload.userNote || "").trim(),
          changeLog: payload.history || []
        })
      };

      if (editingAsset) {
        await investmentService.update(editingAsset.id, apiPayload);
        toast.success("Asset profile updated successfully!");
      } else {
        await investmentService.create(apiPayload);
        toast.success("New asset securely pinned to investment vault.");
      }

      setIsModalOpen(false);
      setEditingAsset(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Save investment error:", error);
      toast.error("Database ingestion processing crash.");
    } finally {
      setIsSavingAsset(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this asset row from your secure vault?")) return;
    try {
      await investmentService.delete(id);
      toast.success("Asset row profile cleanly purged out of records.");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Delete investment error:", error);
      toast.error("Teardown routine sequence error.");
    }
  };

  const globalTotalInvested = useMemo(() => {
    return assets.reduce((sum, item) => sum + item.totalInvested, 0);
  }, [assets]);

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

  const formInitialData = editingAsset
    ? {
        id: editingAsset.id,
        name: editingAsset.name,
        symbol: editingAsset.symbol,
        icon: editingAsset.icon,
        categoryClass: editingAsset.categoryClass,
        userNote: editingAsset.userNote,
        currentPrice: editingAsset.currentPrice,
        quantityOwned: editingAsset.quantityOwned,
        totalInvested: editingAsset.originalAmount,
        history: editingAsset.history,
      }
    : null;

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
        sourceCurrency={currency}
      />

      <main className={styles.mainContentLayoutBlock}>
        <VaultAssetTable
          assets={assets}
          currency={currency}
          onDeleteAsset={handleDeleteAsset}
          onEditClick={handleEditClick}
          sourceCurrency={currency}
        />
      </main>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => {
          if (!isSavingAsset) {
            setIsModalOpen(false);
            setEditingAsset(null);
          }
        }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <AddInvestmentForm
              key={editingAsset ? editingAsset.id : 'new'}
              onClose={() => {
                if (!isSavingAsset) {
                  setIsModalOpen(false);
                  setEditingAsset(null);
                }
              }}
              onSave={handleSaveInvestment}
              initialData={formInitialData}
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