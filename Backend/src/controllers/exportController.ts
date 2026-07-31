// Backend/src/controllers/exportController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Response as ExpressResponse } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// Maximum record threshold per export to prevent server memory exhaustion
const MAX_EXPORT_TRANSACTIONS = 5000;

// Valid export time scopes supported by the reporting engine
const ALLOWED_EXPORT_SCOPES = [
  "today",
  "week",
  "month",
  "3months",
  "6months",
  "year",
  "all",
] as const;

type ExportScope = (typeof ALLOWED_EXPORT_SCOPES)[number];
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

// Builds standard error response object without leaking internal server details
function buildSafeError(message: string): { error: string } {
  return { error: message };
}

/**
 * WHY THIS IS NEEDED: Prevents HTTP query array injection attacks.
 * Parses raw query parameters and ensures only single string values are accepted.
 */
function extractSingleString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

/**
 * Validates and casts an unverified scope query input.
 */
function parseExportScope(raw: unknown): ExportScope | undefined {
  const sanitized = extractSingleString(raw);
  if (sanitized && (ALLOWED_EXPORT_SCOPES as readonly string[]).includes(sanitized)) {
    return sanitized as ExportScope;
  }
  return undefined;
}

/**
 * WHY THIS FIX WAS MADE: Replaced hardcoded test date ("2026-07-17") with real-time UTC Date.
 * Calculates explicit start (gte) and end (lte) boundaries for database range filtering.
 */
function getExportDateRange(scope: ExportScope): { gte?: Date; lte?: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  // Set default end boundary to end of today in UTC
  end.setUTCHours(23, 59, 59, 999);

  switch (scope) {
    case "today":
      start.setUTCHours(0, 0, 0, 0);
      return { gte: start, lte: end };

    case "week":
      start.setUTCDate(now.getUTCDate() - 6);
      start.setUTCHours(0, 0, 0, 0);
      return { gte: start, lte: end };

    case "month":
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      return { gte: start, lte: end };

    case "3months":
      start.setUTCMonth(now.getUTCMonth() - 3);
      start.setUTCHours(0, 0, 0, 0);
      return { gte: start, lte: end };

    case "6months":
      start.setUTCMonth(now.getUTCMonth() - 6);
      start.setUTCHours(0, 0, 0, 0);
      return { gte: start, lte: end };

    case "year":
      start.setUTCFullYear(now.getUTCFullYear(), 0, 1);
      start.setUTCHours(0, 0, 0, 0);
      return { gte: start, lte: end };

    case "all":
      return {}; // No date filter applied

    default:
      return {};
  }
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * GET /api/export/excel
 * Generates and streams an Excel spreadsheet report of workspace transactions.
 */
export const exportTransactionsExcel = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    const rawWorkspaceId = extractSingleString(req.query.workspaceId);
    const rawScope = extractSingleString(req.query.scope);

    if (!rawWorkspaceId) {
      res.status(400).json(buildSafeError("Workspace ID parameter is required."));
      return;
    }

    const validScope = parseExportScope(rawScope);
    if (rawScope !== undefined && !validScope) {
      res.status(400).json(buildSafeError("Invalid scope parameter provided."));
      return;
    }

    // WHY THIS FIX WAS MADE: Verifies user workspace access (BOLA Authorization Shield).
    const workspace = await prisma.workspace.findFirst({
      where: { id: rawWorkspaceId, userId: userId },
      select: { id: true, name: true, currency: true },
    });

    if (!workspace) {
      res.status(403).json(buildSafeError("Access denied to specified workspace."));
      return;
    }

    // WHY THIS FIX WAS MADE: Added MAX_EXPORT_TRANSACTIONS limit to prevent server memory exhaustion.
    const dateFilter = validScope ? getExportDateRange(validScope) : {};
    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: rawWorkspaceId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      include: { category: true },
      orderBy: { date: "desc" },
      take: MAX_EXPORT_TRANSACTIONS,
    });

    // Initialize Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ledger Statement");

    // Title Row Formatting
    worksheet.mergeCells("A1:F1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `RakhoKhaata Ledger Statement — Workspace: ${workspace.name}`;
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "6366F1" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 40;

    worksheet.addRow([]); // Blank spacer row

    // Table Header Row
    const headerRow = worksheet.addRow([
      "Date",
      "Type",
      "Description",
      "Category",
      "Amount",
      "Currency",
    ]);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1F2937" } };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });

    // Populate Data Rows
    for (const tx of transactions) {
      const formattedDate = tx.date.toISOString().split("T")[0];
      const amountValue = Number(tx.originalAmount);

      const row = worksheet.addRow([
        formattedDate,
        tx.type,
        tx.description,
        tx.category?.name || "Uncategorized",
        amountValue,
        tx.originalCurrency || workspace.currency,
      ]);

      row.height = 20;
      row.getCell(5).numFmt = "#,##0.00";

      // Color coding row based on transaction type
      if (tx.type === "INCOME") {
        row.getCell(2).font = { color: { argb: "137333" }, bold: true };
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E6F4EA" } };
        });
      } else {
        row.getCell(2).font = { color: { argb: "C5221F" }, bold: true };
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FCE8E6" } };
        });
      }
    }

    // Explicit Column Widths
    worksheet.columns = [
      { width: 15 },
      { width: 12 },
      { width: 30 },
      { width: 20 },
      { width: 18 },
      { width: 12 },
    ];

    // Response Headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Statement_${validScope || "all"}.xlsx`
    );

    // Stream generated workbook directly to client response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: unknown) {
    console.error("Excel Export Error:", error);

    // WHY THIS FIX WAS MADE: Cleans up stream safely if an exception occurs mid-export.
    if (!res.headersSent) {
      res.status(500).json(buildSafeError("Internal server error exporting spreadsheet report."));
    } else {
      res.destroy(); // Terminate broken socket connection
    }
  }
};

/**
 * GET /api/export/pdf
 * Generates and streams a PDF accounting report document.
 */
export const exportTransactionsPdf = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    const rawWorkspaceId = extractSingleString(req.query.workspaceId);
    const rawScope = extractSingleString(req.query.scope);

    if (!rawWorkspaceId) {
      res.status(400).json(buildSafeError("Workspace ID parameter is required."));
      return;
    }

    const validScope = parseExportScope(rawScope);
    if (rawScope !== undefined && !validScope) {
      res.status(400).json(buildSafeError("Invalid scope parameter provided."));
      return;
    }

    // Verify workspace access (BOLA Authorization Shield)
    const workspace = await prisma.workspace.findFirst({
      where: { id: rawWorkspaceId, userId: userId },
      select: { id: true, name: true, currency: true },
    });

    if (!workspace) {
      res.status(403).json(buildSafeError("Access denied to specified workspace."));
      return;
    }

    // Fetch capped transaction history
    const dateFilter = validScope ? getExportDateRange(validScope) : {};
    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: rawWorkspaceId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      include: { category: true },
      orderBy: { date: "desc" },
      take: MAX_EXPORT_TRANSACTIONS,
    });

    // Create PDF document in landscape orientation
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 40,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Statement_${validScope || "all"}.pdf`
    );

    // Pipe PDF generation directly into express response stream
    doc.pipe(res);

    // Document Header Block
    doc.rect(40, 40, 762, 50).fill("#6366F1");
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("RAKHOKHAATA ACCOUNTING STATEMENT", 60, 58);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Workspace: ${workspace.name.toUpperCase()}  |  Scope: ${String(validScope || "ALL").toUpperCase()}`,
        60,
        76
      );

    // Table Column Header
    let currentY = 110;
    doc.rect(40, currentY, 762, 22).fill("#1F2937");
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(10);
    doc.text("Date", 50, currentY + 6);
    doc.text("Type", 140, currentY + 6);
    doc.text("Description", 230, currentY + 6);
    doc.text("Category", 480, currentY + 6);
    doc.text("Amount", 640, currentY + 6, { width: 140, align: "right" });

    currentY += 22;
    doc.font("Helvetica").fontSize(9);

    // Render Data Rows
    for (const tx of transactions) {
      // Trigger new page if rendering near bottom edge
      if (currentY > 520) {
        doc.addPage();
        currentY = 40;

        doc.rect(40, currentY, 762, 22).fill("#1F2937");
        doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(10);
        doc.text("Date", 50, currentY + 6);
        doc.text("Type", 140, currentY + 6);
        doc.text("Description", 230, currentY + 6);
        doc.text("Category", 480, currentY + 6);
        doc.text("Amount", 640, currentY + 6, { width: 140, align: "right" });

        currentY += 22;
        doc.font("Helvetica").fontSize(9);
      }

      const isIncome = tx.type === "INCOME";
      const bgColor = isIncome ? "#E6F4EA" : "#FCE8E6";

      doc.rect(40, currentY, 762, 20).fill(bgColor);

      const dateStr = tx.date.toISOString().split("T")[0];
      doc.fillColor("#1F2937").text(dateStr, 50, currentY + 6);

      doc
        .fillColor(isIncome ? "#137333" : "#C5221F")
        .font("Helvetica-Bold")
        .text(tx.type, 140, currentY + 6);

      doc.fillColor("#1F2937").font("Helvetica");

      // Sanitize description length to prevent table overflow
      const safeDescription =
        tx.description.length > 45
          ? tx.description.substring(0, 42) + "..."
          : tx.description;

      doc.text(safeDescription, 230, currentY + 6);
      doc.text(tx.category?.name || "Uncategorized", 480, currentY + 6);

      const formattedAmount = `${Number(tx.originalAmount).toFixed(2)} ${tx.originalCurrency || workspace.currency}`;
      doc.text(formattedAmount, 640, currentY + 6, { width: 140, align: "right" });

      currentY += 20;
    }

    doc.end();
  } catch (error: unknown) {
    console.error("PDF Export Error:", error);

    // WHY THIS FIX WAS MADE: Cleans up stream safely if an exception occurs mid-export.
    if (!res.headersSent) {
      res.status(500).json(buildSafeError("Internal server error generating PDF report."));
    } else {
      res.destroy(); // Terminate broken socket connection
    }
  }
};
/* === SECTION 3 END === */