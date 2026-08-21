// Frontend/src/components/transactions/ImportWizardModal/ImportWizardModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React, { useState, useCallback, useMemo } from "react";
import {
  FiUploadCloud,
  FiChevronRight,
  FiAlertCircle,
  FiSliders,
} from "react-icons/fi";
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

const UPLOAD_BATCH_CHUNK_SIZE = 300;
const MAX_PREVIEW_RENDER_ROWS = 50;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: PARSING HELPERS ===
   ========================================================================== */
const safeParseSpreadsheetDate = (rawVal: unknown): string => {
  const fallbackToday = new Date().toISOString().substring(0, 10);
  if (!rawVal) return fallbackToday;

  if (rawVal instanceof Date) {
    return !isNaN(rawVal.getTime())
      ? rawVal.toISOString().substring(0, 10)
      : fallbackToday;
  }

  const strVal = String(rawVal).trim();
  const numericSerial = Number(strVal);

  if (!isNaN(numericSerial) && numericSerial > 30000 && numericSerial < 60000) {
    const computedExcelDate = new Date((numericSerial - 25569) * 86400 * 1000);
    if (!isNaN(computedExcelDate.getTime())) {
      return computedExcelDate.toISOString().substring(0, 10);
    }
  }

  const parsed = new Date(strVal);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().substring(0, 10);
  }

  const parts = strVal.split(/[-/.]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (year > 1000 && month >= 0 && month < 12 && day > 0 && day <= 31) {
      const manualDate = new Date(year, month, day);
      if (!isNaN(manualDate.getTime())) {
        return manualDate.toISOString().substring(0, 10);
      }
    }
  }

  return fallbackToday;
};

function sniffHeaderRowIndex(rawMatrix: (string | unknown)[][]): number {
  if (!rawMatrix || rawMatrix.length === 0) return 0;

  const HEADER_KEYWORDS = [
    "date",
    "trans",
    "description",
    "details",
    "narration",
    "narrative",
    "particulars",
    "amount",
    "debit",
    "credit",
    "withdrawal",
    "deposit",
    "balance",
    "type",
  ];

  let bestRowIndex = 0;
  let maxKeywordMatches = 0;
  const scanDepth = Math.min(rawMatrix.length, 25);

  for (let r = 0; r < scanDepth; r++) {
    const row = rawMatrix[r];
    if (!Array.isArray(row)) continue;

    let rowScore = 0;
    const cellTexts = row.map((cell) =>
      String(cell || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
    );

    for (const text of cellTexts) {
      if (!text) continue;
      for (const kw of HEADER_KEYWORDS) {
        if (text.includes(kw)) {
          rowScore++;
          break;
        }
      }
    }

    if (rowScore > maxKeywordMatches) {
      maxKeywordMatches = rowScore;
      bestRowIndex = r;
    }
  }

  return maxKeywordMatches >= 2 ? bestRowIndex : 0;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
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
  const [detectedHeaderIndex, setDetectedHeaderIndex] = useState<number>(0);
  const [availableHeaderRowIndices, setAvailableHeaderRowIndices] = useState<number[]>([]);
  const [fullRawMatrix, setFullRawMatrix] = useState<(string | unknown)[][]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const [colMap, setColMap] = useState({
    date: "",
    description: "",
    amount: "",
    type: "",
  });

  const [defaultType, setDefaultType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [stagedPreviewRows, setStagedPreviewRows] = useState<StagedTransactionRow[]>([]);

  const autoGuessFileHeaders = useCallback((headers: string[]) => {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const mapping = {
      date: "",
      description: "",
      amount: "",
      type: "",
    };

    for (const header of headers || []) {
      const normal = clean(header);

      if (!mapping.date && (normal.includes("date") || normal.includes("time") || normal.includes("txn"))) {
        mapping.date = header;
      }
      if (
        !mapping.description &&
        (normal.includes("desc") ||
          normal.includes("narrat") ||
          normal.includes("particular") ||
          normal.includes("detail") ||
          normal.includes("memo") ||
          normal.includes("payee"))
      ) {
        mapping.description = header;
      }
      if (
        !mapping.amount &&
        (normal === "amount" ||
          normal.includes("transamount") ||
          normal.includes("netamount") ||
          normal.includes("value") ||
          normal.includes("paid") ||
          normal.includes("debit") ||
          normal.includes("credit"))
      ) {
        mapping.amount = header;
      }
      if (!mapping.type && (normal.includes("type") || normal.includes("flow") || normal.includes("class"))) {
        mapping.type = header;
      }
    }

    setColMap(mapping);
  }, []);

  const processMatrixWithHeaderIndex = useCallback(
    (matrix: (string | unknown)[][], headerRowIdx: number) => {
      if (!matrix || matrix.length <= headerRowIdx) {
        toast.error("Invalid spreadsheet format or empty rows.");
        return;
      }

      const rawHeaders = (matrix[headerRowIdx] || []).map((h, i) =>
        h ? String(h).trim() : `Column_${i + 1}`
      );
      const dataRows = matrix.slice(headerRowIdx + 1);

      const parsedObjects: ParsedRowData[] = dataRows
        .filter((row) => row && row.some((cell) => cell !== undefined && String(cell).trim() !== ""))
        .map((row) => {
          const rowObj: ParsedRowData = {};
          rawHeaders.forEach((headerKey, colIndex) => {
            rowObj[headerKey] = row[colIndex] !== undefined ? String(row[colIndex]).trim() : "";
          });
          return rowObj;
        });

      if (rawHeaders.length > 0 && parsedObjects.length > 0) {
        setRawFileHeaders(rawHeaders);
        setRawParsedRows(parsedObjects);
        setDetectedHeaderIndex(headerRowIdx);
        autoGuessFileHeaders(rawHeaders);
        setImportStep(2);
      } else {
        toast.error("No valid transaction rows found under the selected header.");
      }
    },
    [autoGuessFileHeaders]
  );

  // Dynamically import xlsx and papaparse on demand to keep bundle lean
  const handleFileExtractionStream = useCallback(
    async (file: File) => {
      if (file.size > 25 * 1024 * 1024) {
        toast.error("File size exceeds 25 MB limit.");
        return;
      }

      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith(".csv")) {
        const Papa = (await import("papaparse")).default;
        Papa.parse<(string | unknown)[]>(file, {
          header: false,
          skipEmptyLines: false,
          complete: (results) => {
            const matrix = Array.isArray(results.data) ? results.data : [];
            if (matrix.length === 0) {
              toast.error("CSV file appears to be empty.");
              return;
            }

            const headerIdx = sniffHeaderRowIndex(matrix);
            setFullRawMatrix(matrix);
            setAvailableHeaderRowIndices(
              Array.from({ length: Math.min(matrix.length, 25) }, (_, i) => i)
            );
            processMatrixWithHeaderIndex(matrix, headerIdx);
          },
        });
      } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
        const XLSX = await import("xlsx");
        const reader = new FileReader();
        reader.onload = (evt) => {
          const data = evt.target?.result;
          if (!data || typeof data !== "string") {
            toast.error("Failed to read Excel file.");
            return;
          }
          const workbook = XLSX.read(data, {
            type: "binary",
            cellDates: true,
            dateNF: "yyyy-mm-dd",
          });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const matrix = XLSX.utils.sheet_to_json<(string | unknown)[]>(sheet, {
            header: 1,
            blankrows: false,
          });

          if (Array.isArray(matrix) && matrix.length > 0) {
            const headerIdx = sniffHeaderRowIndex(matrix);
            setFullRawMatrix(matrix);
            setAvailableHeaderRowIndices(
              Array.from({ length: Math.min(matrix.length, 25) }, (_, i) => i)
            );
            processMatrixWithHeaderIndex(matrix, headerIdx);
          } else {
            toast.error("Excel sheet appears to be empty.");
          }
        };
        reader.readAsBinaryString(file);
      } else {
        toast.error("Unsupported format. Please provide a .csv, .xlsx, or .xls file.");
      }
    },
    [processMatrixWithHeaderIndex]
  );

  const handleComputeMappingVerification = () => {
    if (!colMap.date || !colMap.description || !colMap.amount) {
      toast.error("Please map Date, Description, and Amount columns.");
      return;
    }

    const safeCategories = Array.isArray(categories) ? categories : [];
    const unassignedCategory = safeCategories.find((c) => c.name.toLowerCase() === "unassigned");
    const defaultCategoryId = unassignedCategory?.id || safeCategories[0]?.id || "";
    const safeParsedRows = Array.isArray(rawParsedRows) ? rawParsedRows : [];

    const previewRows: StagedTransactionRow[] = [];

    safeParsedRows.forEach((row, idx) => {
      let rawAmount = parseFloat(String(row[colMap.amount] || "0").replace(/[^0-9.-]/g, ""));
      let detectedType: "INCOME" | "EXPENSE" = defaultType;

      if (colMap.type && row[colMap.type]) {
        const typeStr = String(row[colMap.type]).toUpperCase();
        if (typeStr.includes("INC") || typeStr.includes("CR") || typeStr.includes("DEP")) {
          detectedType = "INCOME";
        } else if (typeStr.includes("EXP") || typeStr.includes("DR") || typeStr.includes("WD")) {
          detectedType = "EXPENSE";
        }
      } else if (rawAmount < 0) {
        detectedType = "EXPENSE";
        rawAmount = Math.abs(rawAmount);
      }

      if (isNaN(rawAmount) || (rawAmount <= 0 && !row[colMap.description])) return;

      let categoryId = defaultCategoryId;
      const desc = String(row[colMap.description] || "").toLowerCase();

      if (desc.includes("salary") || desc.includes("dividend") || desc.includes("revenue") || desc.includes("payroll")) {
        const found = safeCategories.find(
          (c) => c.name.toLowerCase().includes("salary") || c.name.toLowerCase().includes("revenue")
        );
        if (found) categoryId = found.id;
      } else if (desc.includes("rent") || desc.includes("housing")) {
        const found = safeCategories.find(
          (c) => c.name.toLowerCase().includes("rent") || c.name.toLowerCase().includes("housing")
        );
        if (found) categoryId = found.id;
      } else if (desc.includes("uber") || desc.includes("fuel") || desc.includes("shell") || desc.includes("careem")) {
        const found = safeCategories.find(
          (c) => c.name.toLowerCase().includes("transport") || c.name.toLowerCase().includes("fuel")
        );
        if (found) categoryId = found.id;
      }

      previewRows.push({
        index: idx,
        date: safeParseSpreadsheetDate(row[colMap.date]),
        description: String(row[colMap.description] || "Imported Transaction"),
        amount: Math.abs(rawAmount),
        currency: workspaceCurrency,
        type: detectedType,
        categoryId,
      });
    });

    if (previewRows.length === 0) {
      toast.error("No valid transactions found with current column mapping.");
      return;
    }

    setStagedPreviewRows(previewRows);
    setImportStep(3);
  };

  const handleFinalCommit = async () => {
    if (stagedPreviewRows.length === 0) return;

    const totalRows = stagedPreviewRows.length;
    const totalChunks = Math.ceil(totalRows / UPLOAD_BATCH_CHUNK_SIZE);

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      const start = chunkIdx * UPLOAD_BATCH_CHUNK_SIZE;
      const end = start + UPLOAD_BATCH_CHUNK_SIZE;
      const slice = stagedPreviewRows.slice(start, end);

      setUploadProgress(`Importing batch ${chunkIdx + 1} of ${totalChunks} (${slice.length} rows)...`);
      await onCommitImport(slice);
    }

    setUploadProgress(null);
    setImportStep(1);
    setFullRawMatrix([]);
    onClose();
  };

  const renderedPreviewRows = useMemo(() => {
    return stagedPreviewRows.slice(0, MAX_PREVIEW_RENDER_ROWS);
  }, [stagedPreviewRows]);

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
        {/* HEADER */}
        <div className={styles.wizardHeaderDeck}>
          <div className={styles.wizardHeaderTitleBlock}>
            <h3 className={styles.wizardMainTitle}>Statement Import Wizard</h3>
            <span className={styles.wizardBadgePill}>Bulk Entry</span>
          </div>
          <div className={styles.stepperPipelineLayout}>
            <div className={importStep === 1 ? styles.stepperNodeActive : styles.stepperNodeMuted}>
              <span className={styles.stepperStepNumber}>1</span>
              <span>Upload</span>
            </div>
            <FiChevronRight className={styles.stepperArrowIcon} />
            <div className={importStep === 2 ? styles.stepperNodeActive : styles.stepperNodeMuted}>
              <span className={styles.stepperStepNumber}>2</span>
              <span>Map Columns</span>
            </div>
            <FiChevronRight className={styles.stepperArrowIcon} />
            <div className={importStep === 3 ? styles.stepperNodeActive : styles.stepperNodeMuted}>
              <span className={styles.stepperStepNumber}>3</span>
              <span>Review & Sync</span>
            </div>
          </div>
        </div>

        {/* STEP 1: UPLOAD */}
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
              if (file) void handleFileExtractionStream(file);
            }}
          >
            <div className={styles.dropzoneIconWrapper}>
              <FiUploadCloud className={styles.dropzoneUploadIcon} />
            </div>
            <p className={styles.dropzoneMainTitleText}>Drag & drop your bank statement here</p>
            <p className={styles.dropzoneSubtextMeta}>
              Supports .csv, .xlsx, .xls (up to 25 MB)
            </p>
            <span className={styles.dropzoneBrowseBtn}>Browse Computer</span>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              className={styles.nativeFullHiddenFileInputControl}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileExtractionStream(file);
              }}
            />
          </div>
        )}

        {/* STEP 2: MAP COLUMNS */}
        {importStep === 2 && (
          <div className={styles.wizardFormCoreBody}>
            <div className={styles.headerAdjustmentDeck}>
              <div className={styles.headerAdjustmentLabelBlock}>
                <FiSliders className={styles.headerTunerIcon} />
                <span>Header Row Detected at Line #{detectedHeaderIndex + 1}</span>
              </div>
              <div className={styles.headerSelectGroup}>
                <label htmlFor="headerRowSelect">Change row:</label>
                <select
                  id="headerRowSelect"
                  value={detectedHeaderIndex}
                  onChange={(e) => {
                    const nextIdx = Number(e.target.value);
                    processMatrixWithHeaderIndex(fullRawMatrix, nextIdx);
                  }}
                  className={styles.headerSmallSelect}
                >
                  {availableHeaderRowIndices.map((idx) => (
                    <option key={idx} value={idx}>
                      Row {idx + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formLayout}>
              {/* Row 1: Date & Flow Type */}
              <div className={styles.formRowSideBySide}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="mapDateCol">
                    Transaction Date Column *
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      id="mapDateCol"
                      value={colMap.date}
                      onChange={(e) => setColMap((p) => ({ ...p, date: e.target.value }))}
                      className={styles.selectField}
                    >
                      <option value="">-- Select Column --</option>
                      {rawFileHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <span className={styles.label}>Default Flow Classification</span>
                  <div className={styles.segmentedControl}>
                    <label
                      className={`${styles.segmentOption} ${
                        defaultType === "EXPENSE" ? styles.segmentActiveExpense : ""
                      }`}
                    >
                      <input
                        type="radio"
                        value="EXPENSE"
                        name="flowType"
                        checked={defaultType === "EXPENSE"}
                        onChange={() => setDefaultType("EXPENSE")}
                        className={styles.hiddenRadioControl}
                      />
                      Expense
                    </label>
                    <label
                      className={`${styles.segmentOption} ${
                        defaultType === "INCOME" ? styles.segmentActiveIncome : ""
                      }`}
                    >
                      <input
                        type="radio"
                        value="INCOME"
                        name="flowType"
                        checked={defaultType === "INCOME"}
                        onChange={() => setDefaultType("INCOME")}
                        className={styles.hiddenRadioControl}
                      />
                      Income
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 2: Description */}
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="mapDescCol">
                  Ledger Description / Payee Column *
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    id="mapDescCol"
                    value={colMap.description}
                    onChange={(e) => setColMap((p) => ({ ...p, description: e.target.value }))}
                    className={styles.selectField}
                  >
                    <option value="">-- Select Column --</option>
                    {rawFileHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Amount Column & Optional Type Column */}
              <div className={styles.formRowSideBySide}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="mapAmountCol">
                    Transaction Value / Amount Column *
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      id="mapAmountCol"
                      value={colMap.amount}
                      onChange={(e) => setColMap((p) => ({ ...p, amount: e.target.value }))}
                      className={styles.selectField}
                    >
                      <option value="">-- Select Column --</option>
                      {rawFileHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="mapTypeCol">
                    Type Column (Optional)
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      id="mapTypeCol"
                      value={colMap.type}
                      onChange={(e) => setColMap((p) => ({ ...p, type: e.target.value }))}
                      className={styles.selectField}
                    >
                      <option value="">-- None (Use {defaultType}) --</option>
                      {rawFileHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => setImportStep(1)}
                  className={styles.cancelBtn}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleComputeMappingVerification}
                  className={styles.submitBtn}
                >
                  Generate Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & BATCH SYNC */}
        {importStep === 3 && (
          <div className={styles.wizardFormCoreBody}>
            <div className={`${styles.wizardInfoAlertBox} ${styles.alertWarningAmber}`}>
              <FiAlertCircle size={18} className={styles.alertIconFlex} />
              <div>
                <strong>Validated Ingestion:</strong> Staged <b>{stagedPreviewRows.length}</b> records.
                {stagedPreviewRows.length > MAX_PREVIEW_RENDER_ROWS && (
                  <span> (Displaying preview of first {MAX_PREVIEW_RENDER_ROWS} rows).</span>
                )}
              </div>
            </div>

            {uploadProgress && (
              <div className={styles.batchProgressBarContainer}>
                <div className={styles.batchProgressIndicatorBar} />
                <span className={styles.batchProgressText}>{uploadProgress}</span>
              </div>
            )}

            <div className={styles.previewDataGridContainerWindow}>
              <table className={styles.previewTableViewportLayout}>
                <thead className={styles.previewTableHeaderStickyDeck}>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Category Allocation</th>
                  </tr>
                </thead>
                <tbody className={styles.previewTableBodyRowCluster}>
                  {renderedPreviewRows.map((row, rIdx) => (
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
                            row.type === "INCOME"
                              ? styles.badgeTypeIncomePill
                              : styles.badgeTypeExpensePill
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
                              prev.map((pr, idx) =>
                                idx === rIdx ? { ...pr, categoryId: newId } : pr
                              )
                            );
                          }}
                          className={styles.tableCellInlineSelectControl}
                        >
                          {categories.map((cat) => (
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
                Total {stagedPreviewRows.length} transactions ready to sync.
              </span>
              <div className={styles.buttonGroupRight}>
                <button
                  type="button"
                  disabled={isSubmitting || Boolean(uploadProgress)}
                  onClick={() => setImportStep(2)}
                  className={styles.cancelBtn}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || Boolean(uploadProgress)}
                  onClick={() => void handleFinalCommit()}
                  className={styles.submitBtn}
                >
                  {isSubmitting || uploadProgress ? "Syncing..." : "Commit Batch Import"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}