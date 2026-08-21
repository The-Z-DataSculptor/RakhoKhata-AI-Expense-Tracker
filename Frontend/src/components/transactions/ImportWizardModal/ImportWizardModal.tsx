"use client";

import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { FiUploadCloud, FiChevronRight, FiFileText, FiAlertCircle } from "react-icons/fi";
import { Category } from "@/utils/api";
import { toast } from "sonner";
import styles from "./ImportWizardModal.module.css";

export interface StagedTransactionRow {
  index: number;
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
}

type ParsedRowData = Record<string, string>;

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  workspaceCurrency: string;
  isSubmitting: boolean;
  onCommitImport: (stagedRows: StagedTransactionRow[]) => Promise<void>;
}

const safeParseSpreadsheetDate = (rawVal: unknown): string => {
  const fallbackToday = new Date().toISOString().substring(0, 10);
  if (!rawVal) return fallbackToday;

  if (rawVal instanceof Date) {
    return !isNaN(rawVal.getTime()) ? rawVal.toISOString().substring(0, 10) : fallbackToday;
  }

  const strVal = String(rawVal).trim();
  const numericSerial = Number(strVal);

  if (!isNaN(numericSerial) && numericSerial > 30000 && numericSerial < 60000) {
    const computedExcelDate = new Date((numericSerial - 25569) * 86400 * 1000);
    if (!isNaN(computedExcelDate.getTime())) {
      return computedExcelDate.toISOString().substring(0, 10);
    }
  }

  let parsed = new Date(strVal);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().substring(0, 10);
  }

  const parts = strVal.split(/[-/.]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (year > 1000 && month >= 0 && month < 12 && day > 0 && day <= 31) {
      parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().substring(0, 10);
      }
    }
  }

  return fallbackToday;
};

export default function ImportWizardModal({
  isOpen,
  onClose,
  categories,
  workspaceCurrency,
  isSubmitting,
  onCommitImport,
}: ImportWizardModalProps) {
  const [importStep, setImportStep] = useState<number>(1);
  const [rawFileHeaders, setRawFileHeaders] = useState<string[]>([]);
  const [rawParsedRows, setRawParsedRows] = useState<ParsedRowData[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const [colMap, setColMap] = useState({
    date: "",
    description: "",
    amount: "",
    currency: "",
    type: "",
  });
  const [fallbackCurrency, setFallbackCurrency] = useState<string>(workspaceCurrency);
  const [fallbackType, setFallbackType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [stagedPreviewRows, setStagedPreviewRows] = useState<StagedTransactionRow[]>([]);

  const autoGuessFileHeaders = useCallback((headers: string[]) => {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const mapping = { date: "", description: "", amount: "", currency: "", type: "" };

    for (const header of headers || []) {
      const normal = clean(header);
      if (!mapping.date && (normal.includes("date") || normal.includes("time"))) mapping.date = header;
      if (!mapping.description && (normal.includes("desc") || normal.includes("narrative") || normal.includes("detail")))
        mapping.description = header;
      if (!mapping.amount && (normal.includes("amount") || normal.includes("value") || normal.includes("paid") || normal.includes("price")))
        mapping.amount = header;
      if (!mapping.currency && (normal.includes("curr") || normal.includes("code"))) mapping.currency = header;
      if (!mapping.type && (normal.includes("type") || normal.includes("class"))) mapping.type = header;
    }

    setColMap(mapping);
  }, []);

  const handleFileExtractionStream = useCallback(
    (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10 MB limit.");
        return;
      }

      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".csv")) {
        Papa.parse<ParsedRowData>(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const fields = Array.isArray(results.meta.fields) ? results.meta.fields : [];
            const dataRows = Array.isArray(results.data) ? results.data : [];

            if (fields.length > 0 && dataRows.length > 0) {
              setRawFileHeaders(fields);
              setRawParsedRows(dataRows);
              autoGuessFileHeaders(fields);
              setImportStep(2);
            } else {
              toast.error("CSV file appears to be empty or corrupt.");
            }
          },
        });
      } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const data = evt.target?.result;
          if (!data || typeof data !== "string") {
            toast.error("Failed to read Excel file.");
            return;
          }
          const workbook = XLSX.read(data, { type: "binary", cellDates: true, dateNF: "yyyy-mm-dd" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

          if (Array.isArray(rows) && rows.length > 0) {
            const headers = (rows[0] || []).map((h) => String(h));
            const body = XLSX.utils.sheet_to_json<ParsedRowData>(sheet);
            const safeBody = Array.isArray(body) ? body : [];

            setRawFileHeaders(headers);
            setRawParsedRows(safeBody);
            autoGuessFileHeaders(headers);
            setImportStep(2);
          } else {
            toast.error("Excel sheet appears to be empty.");
          }
        };
        reader.readAsBinaryString(file);
      } else {
        toast.error("Unsupported file type. Please upload a .csv or .xlsx file.");
      }
    },
    [autoGuessFileHeaders]
  );

  const handleComputeMappingVerification = () => {
    if (!colMap.date || !colMap.description || !colMap.amount) {
      toast.error("Please map the Date, Description, and Amount columns.");
      return;
    }

    const safeCategories = Array.isArray(categories) ? categories : [];
    const unassignedCategory = safeCategories.find((c) => c.name.toLowerCase() === "unassigned");
    const defaultCategoryId = unassignedCategory?.id || safeCategories[0]?.id || "";
    const safeParsedRows = Array.isArray(rawParsedRows) ? rawParsedRows : [];

    const previewRows: StagedTransactionRow[] = safeParsedRows.map((row, idx) => {
      let rawAmount = parseFloat(String(row[colMap.amount] || "0").replace(/[^0-9.-]/g, ""));
      let detectedType: "INCOME" | "EXPENSE" = fallbackType;

      if (colMap.type && row[colMap.type]) {
        const typeStr = String(row[colMap.type]).toUpperCase();
        if (typeStr.includes("INC") || typeStr.includes("CR") || typeStr.includes("DEP"))
          detectedType = "INCOME";
        else if (typeStr.includes("EXP") || typeStr.includes("DR") || typeStr.includes("WD"))
          detectedType = "EXPENSE";
      } else if (rawAmount < 0) {
        detectedType = "EXPENSE";
        rawAmount = Math.abs(rawAmount);
      }

      let rowCurrency = fallbackCurrency;
      if (colMap.currency && row[colMap.currency]) {
        rowCurrency = String(row[colMap.currency]).toUpperCase().trim().substring(0, 3);
      }

      let categoryId = defaultCategoryId;
      const description = String(row[colMap.description] || "").toLowerCase();
      if (description.includes("salary") || description.includes("dividend")) {
        const found = safeCategories.find(
          (c) => c.name.toLowerCase().includes("salary") || c.name.toLowerCase().includes("revenue")
        );
        if (found) categoryId = found.id;
      } else if (description.includes("rent") || description.includes("housing")) {
        const found = safeCategories.find(
          (c) => c.name.toLowerCase().includes("rent") || c.name.toLowerCase().includes("housing")
        );
        if (found) categoryId = found.id;
      }

      return {
        index: idx,
        date: safeParseSpreadsheetDate(row[colMap.date]),
        description: String(row[colMap.description] || "Imported Transaction"),
        amount: isNaN(rawAmount) ? 0 : rawAmount,
        currency: rowCurrency,
        type: detectedType,
        categoryId,
      };
    });

    setStagedPreviewRows(previewRows);
    setImportStep(3);
  };

  const handleFinalCommit = async () => {
    await onCommitImport(stagedPreviewRows);
    setImportStep(1);
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlayBackdrop}
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className={`${styles.modalContentCard} ${styles.wizardExpansionLarge}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.wizardHeaderDeck}>
          <div className={styles.wizardHeaderTitleBlock}>
            <h3 className={styles.wizardMainTitle}>Statement Import Wizard</h3>
            <span className={styles.wizardBadgePill}>Engine v2.4</span>
          </div>
          <div className={styles.stepperPipelineLayout}>
            <div className={importStep === 1 ? styles.stepperNodeActive : styles.stepperNodeMuted}>
              <span className={styles.stepperStepNumber}>1</span>
              <span>Upload</span>
            </div>
            <FiChevronRight className={styles.stepperArrowIcon} />
            <div className={importStep === 2 ? styles.stepperNodeActive : styles.stepperNodeMuted}>
              <span className={styles.stepperStepNumber}>2</span>
              <span>Map Headers</span>
            </div>
            <FiChevronRight className={styles.stepperArrowIcon} />
            <div className={importStep === 3 ? styles.stepperNodeActive : styles.stepperNodeMuted}>
              <span className={styles.stepperStepNumber}>3</span>
              <span>Review & Commit</span>
            </div>
          </div>
        </div>

        {/* Step 1: Upload */}
        {importStep === 1 && (
          <div
            className={`${styles.dropzoneFrameZone} ${isDraggingOver ? styles.dropzoneActiveTint : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileExtractionStream(file);
            }}
          >
            <div className={styles.dropzoneIconWrapper}>
              <FiUploadCloud className={styles.dropzoneUploadIcon} />
            </div>
            <p className={styles.dropzoneMainTitleText}>Drag & drop bank statement here</p>
            <p className={styles.dropzoneSubtextMeta}>Supports .csv, .xlsx, .xls (max 10 MB)</p>
            <span className={styles.dropzoneBrowseBtn}>Browse Computer</span>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              className={styles.nativeFullHiddenFileInputControl}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileExtractionStream(file);
              }}
            />
          </div>
        )}

        {/* Step 2: Map Columns */}
        {importStep === 2 && (
          <div className={styles.wizardFormCoreBody}>
            <div className={`${styles.wizardInfoAlertBox} ${styles.alertInfoBlue}`}>
              <FiFileText size={18} className={styles.alertIconFlex} />
              <div>
                <strong>Header Alignment Required:</strong> Map the columns from your file to ledger fields.
              </div>
            </div>

            <div className={styles.mappingSelectorsGridRow}>
              <div className={styles.formGroupWrapperField}>
                <label htmlFor="mapDateCol" className={styles.fieldLayoutInputLabel}>
                  Transaction Date *
                </label>
                <select
                  id="mapDateCol"
                  value={colMap.date}
                  onChange={(e) => setColMap((p) => ({ ...p, date: e.target.value }))}
                  className={styles.premiumFieldSelectControl}
                >
                  <option value="">-- Select Column --</option>
                  {(Array.isArray(rawFileHeaders) ? rawFileHeaders : []).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroupWrapperField}>
                <label htmlFor="mapDescCol" className={styles.fieldLayoutInputLabel}>
                  Description / Narrative *
                </label>
                <select
                  id="mapDescCol"
                  value={colMap.description}
                  onChange={(e) => setColMap((p) => ({ ...p, description: e.target.value }))}
                  className={styles.premiumFieldSelectControl}
                >
                  <option value="">-- Select Column --</option>
                  {(Array.isArray(rawFileHeaders) ? rawFileHeaders : []).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroupWrapperField}>
                <label htmlFor="mapAmountCol" className={styles.fieldLayoutInputLabel}>
                  Transaction Amount *
                </label>
                <select
                  id="mapAmountCol"
                  value={colMap.amount}
                  onChange={(e) => setColMap((p) => ({ ...p, amount: e.target.value }))}
                  className={styles.premiumFieldSelectControl}
                >
                  <option value="">-- Select Column --</option>
                  {(Array.isArray(rawFileHeaders) ? rawFileHeaders : []).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroupWrapperField}>
                <label htmlFor="mapCurrCol" className={styles.fieldLayoutInputLabel}>
                  Currency Code (Optional)
                </label>
                <select
                  id="mapCurrCol"
                  value={colMap.currency}
                  onChange={(e) => setColMap((p) => ({ ...p, currency: e.target.value }))}
                  className={styles.premiumFieldSelectControl}
                >
                  <option value="">-- Fallback Only ({fallbackCurrency}) --</option>
                  {(Array.isArray(rawFileHeaders) ? rawFileHeaders : []).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.stagerFallbackSubFormBlock}>
              <div className={styles.formGroupWrapperField}>
                <label htmlFor="fallbackCurrInput" className={styles.fieldLayoutInputLabel}>
                  Fallback Currency
                </label>
                <input
                  id="fallbackCurrInput"
                  type="text"
                  maxLength={3}
                  value={fallbackCurrency}
                  onChange={(e) => setFallbackCurrency(e.target.value.toUpperCase())}
                  className={styles.premiumFieldInputTextControl}
                  placeholder="PKR"
                />
              </div>
              <div className={styles.formGroupWrapperField}>
                <label htmlFor="fallbackTypeSelect" className={styles.fieldLayoutInputLabel}>
                  Default Cash Flow Type
                </label>
                <select
                  id="fallbackTypeSelect"
                  value={fallbackType}
                  onChange={(e) => setFallbackType(e.target.value as "INCOME" | "EXPENSE")}
                  className={styles.premiumFieldSelectControl}
                >
                  <option value="EXPENSE">Expense (Debit / Outflow)</option>
                  <option value="INCOME">Income (Credit / Inflow)</option>
                </select>
              </div>
            </div>

            <div className={styles.wizardActionFooterToolbar}>
              <button type="button" onClick={() => setImportStep(1)} className={styles.wizardCancelControlBtn}>
                Back
              </button>
              <button type="button" onClick={handleComputeMappingVerification} className={styles.wizardPrimaryConfirmBtn}>
                Generate Preview
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Commit */}
        {importStep === 3 && (
          <div className={styles.wizardFormCoreBody}>
            <div className={`${styles.wizardInfoAlertBox} ${styles.alertWarningAmber}`}>
              <FiAlertCircle size={18} className={styles.alertIconFlex} />
              <div>
                <strong>Staging Area:</strong> Unmapped records will be placed in <b>Unassigned</b>.
              </div>
            </div>

            <div className={styles.previewDataGridContainerWindow}>
              <table className={styles.previewTableViewportLayout}>
                <thead className={styles.previewTableHeaderStickyDeck}>
                  <tr>
                    <th>Posting Date</th>
                    <th>Description</th>
                    <th>Value Amount</th>
                    <th>Flow Type</th>
                    <th>Category Allocation</th>
                  </tr>
                </thead>
                <tbody className={styles.previewTableBodyRowCluster}>
                  {(Array.isArray(stagedPreviewRows) ? stagedPreviewRows : []).map((row, rIdx) => (
                    <tr key={row.index}>
                      <td className={styles.tableCellDate}>{row.date}</td>
                      <td className={styles.tableCellTruncateText} title={row.description}>
                        {row.description}
                      </td>
                      <td className={styles.tableCellAmount}>
                        {row.currency} {row.amount.toFixed(2)}
                      </td>
                      <td>
                        <span
                          className={
                            row.type === "INCOME" ? styles.badgeTypeIncomePill : styles.badgeTypeExpensePill
                          }
                        >
                          {row.type}
                        </span>
                      </td>
                      <td>
                        <select
                          aria-label={`Category for ${row.description}`}
                          value={row.categoryId}
                          onChange={(e) => {
                            const newId = e.target.value;
                            setStagedPreviewRows((prev) =>
                              (Array.isArray(prev) ? prev : []).map((pr, idx) =>
                                idx === rIdx ? { ...pr, categoryId: newId } : pr
                              )
                            );
                          }}
                          className={styles.tableCellInlineSelectControl}
                        >
                          {(Array.isArray(categories) ? categories : []).map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.wizardActionFooterToolbar}>
              <span className={styles.wizardCounterSummaryMetaText}>
                {stagedPreviewRows.length} transactions ready to sync.
              </span>
              <div className={styles.flexButtonGroupRow}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setImportStep(2)}
                  className={styles.wizardCancelControlBtn}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalCommit}
                  className={styles.wizardCommitExecutionBtn}
                >
                  {isSubmitting ? "Syncing..." : "Commit Statement Import"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}