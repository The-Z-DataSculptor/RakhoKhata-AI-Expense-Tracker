// Backend/src/controllers/exportController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// Valid export time scopes – used for input validation
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

// Safe error response builder – never leaks stack traces
function buildSafeError(message: string): { error: string } {
  return { error: message };
}

/**
 * Validates and casts the incoming scope query parameter.
 * Returns a valid ExportScope or undefined if invalid.
 */
function parseExportScope(raw: unknown): ExportScope | undefined {
  if (
    typeof raw === "string" &&
    (ALLOWED_EXPORT_SCOPES as readonly string[]).includes(raw)
  ) {
    return raw as ExportScope;
  }
  return undefined;
}

/**
 * Calculates the start and end dates for the given export scope.
 * Uses a fixed anchor date (2026-07-17) for consistent results during development.
 */
function getExportDateRange(scope: ExportScope): {
  gte?: Date;
  lte?: Date;
} {
  const anchor = new Date("2026-07-17T12:00:00Z");
  const start = new Date(anchor);
  const end = new Date(anchor);

  switch (scope) {
    case "today":
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      return { gte: start, lte: end };
    case "week":
      start.setUTCDate(anchor.getUTCDate() - 6);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      return { gte: start, lte: end };
    case "month":
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      const nextMonth = new Date(anchor);
      nextMonth.setUTCMonth(anchor.getUTCMonth() + 1, 1);
      nextMonth.setUTCHours(0, 0, 0, 0);
      end.setTime(nextMonth.getTime() - 1);
      return { gte: start, lte: end };
    case "3months":
      start.setUTCMonth(anchor.getUTCMonth() - 3);
      start.setUTCHours(0, 0, 0, 0);
      return { gte: start };
    case "6months":
      start.setUTCMonth(anchor.getUTCMonth() - 6);
      start.setUTCHours(0, 0, 0, 0);
      return { gte: start };
    case "year":
      start.setUTCFullYear(anchor.getUTCFullYear(), 0, 1);
      start.setUTCHours(0, 0, 0, 0);
      return { gte: start };
    case "all":
      return {}; // No date filter
    default:
      return {};
  }
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

// ---------------------------------------------------------------------------
// EXPORT TRANSACTIONS AS EXCEL
// ---------------------------------------------------------------------------
export const exportTransactionsExcel = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized access."));
      return;
    }

    const { workspaceId, scope } = req.query as {
      workspaceId?: string;
      scope?: string;
    };

    if (!workspaceId) {
      res
        .status(400)
        .json(
          buildSafeError(
            "Missing active workspace target parameter."
          )
        );
      return;
    }

    // Validate and parse the scope
    const validScope = parseExportScope(scope);
    if (scope !== undefined && !validScope) {
      res
        .status(400)
        .json(
          buildSafeError(
            "Invalid scope parameter. Allowed: today, week, month, 3months, 6months, year, all."
          )
        );
      return;
    }

    // Verify workspace ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (
      !workspace ||
      workspace.userId !== userId
    ) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    // Fetch transactions within the selected date range
    const dateFilter = validScope
      ? getExportDateRange(validScope)
      : {};
    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: workspaceId,
        ...(Object.keys(dateFilter).length > 0
          ? { date: dateFilter }
          : {}),
      },
      include: { category: true },
      orderBy: { date: "desc" },
    });

    // Build the Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      "Ledger Statement"
    );

    // Title row
    worksheet.mergeCells("A1:F1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `RakhoKhata Ledger Statement — Workspace: ${workspace.name}`;
    titleCell.font = {
      name: "Arial",
      size: 16,
      bold: true,
      color: { argb: "FFFFFF" },
    };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "6366F1" },
    };
    titleCell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getRow(1).height = 40;

    worksheet.addRow([]); // Blank spacer

    // Header row
    const headerRow = worksheet.addRow([
      "Date",
      "Type",
      "Description",
      "Category",
      "Original Value",
      "Currency",
    ]);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = {
        name: "Arial",
        size: 11,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F2937" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };
    });
    // Align the amount column to the right
    worksheet.getCell("E3").alignment = {
      horizontal: "right",
    };

    // Populate rows
    for (const tx of transactions) {
      const formattedDate = tx.date
        .toISOString()
        .split("T")[0];
      const amountNum = Number(tx.originalAmount);
      const row = worksheet.addRow([
        formattedDate,
        tx.type,
        tx.description,
        tx.category?.name || "Uncategorized",
        amountNum,
        tx.originalCurrency,
      ]);

      row.height = 20;
      row.getCell(5).numFmt = "#,##0.00";

      // Color coding based on transaction type
      if (tx.type === "INCOME") {
        row.getCell(2).font = {
          color: { argb: "137333" },
          bold: true,
        };
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "E6F4EA" },
          };
        });
      } else {
        row.getCell(2).font = {
          color: { argb: "C5221F" },
          bold: true,
        };
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FCE8E6" },
          };
        });
      }
    }

    // Auto-fit column widths
    worksheet.columns = [
      { width: 15 }, // Date
      { width: 12 }, // Type
      { width: 30 }, // Description
      { width: 20 }, // Category
      { width: 18 }, // Amount
      { width: 12 }, // Currency
    ];

    // Set response headers and send the file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Statement_${validScope || "all"}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: unknown) {
    console.error("Excel Export Error:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json(
          buildSafeError(
            "Internal server error exporting spreadsheet."
          )
        );
    }
  }
};

// ---------------------------------------------------------------------------
// EXPORT TRANSACTIONS AS PDF
// ---------------------------------------------------------------------------
export const exportTransactionsPdf = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized access."));
      return;
    }

    const { workspaceId, scope } = req.query as {
      workspaceId?: string;
      scope?: string;
    };

    if (!workspaceId) {
      res
        .status(400)
        .json(
          buildSafeError(
            "Missing active workspace target parameter."
          )
        );
      return;
    }

    // Validate scope
    const validScope = parseExportScope(scope);
    if (scope !== undefined && !validScope) {
      res
        .status(400)
        .json(
          buildSafeError(
            "Invalid scope parameter. Allowed: today, week, month, 3months, 6months, year, all."
          )
        );
      return;
    }

    // Verify workspace ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (
      !workspace ||
      workspace.userId !== userId
    ) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    // Fetch transactions
    const dateFilter = validScope
      ? getExportDateRange(validScope)
      : {};
    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: workspaceId,
        ...(Object.keys(dateFilter).length > 0
          ? { date: dateFilter }
          : {}),
      },
      include: { category: true },
      orderBy: { date: "desc" },
    });

    // Create PDF document in landscape
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

    doc.pipe(res);

    // --- Header block ---
    doc
      .rect(40, 40, 762, 50)
      .fill("#6366F1");
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(`RAKHOKHATA ACCOUNTING STATEMENT`, 60, 58);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Workspace: ${workspace.name.toUpperCase()}  |  Scope: ${String(validScope || "ALL").toUpperCase()}`,
        60,
        76,
        { align: "left" }
      );

    // --- Table header ---
    let currentY = 110;
    doc
      .fillColor("#1F2937")
      .rect(40, currentY, 762, 22)
      .fill();
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(10);
    doc.text("Date", 50, currentY + 6);
    doc.text("Type", 140, currentY + 6);
    doc.text("Description", 230, currentY + 6);
    doc.text("Category", 480, currentY + 6);
    doc.text("Value Amount", 640, currentY + 6, {
      width: 140,
      align: "right",
    });

    currentY += 22;
    doc.font("Helvetica").fontSize(9);

    // --- Row rendering ---
    for (const tx of transactions) {
      // Add a new page if near bottom
      if (currentY > 520) {
        doc.addPage();
        currentY = 40;

        // Redraw header on new page
        doc
          .fillColor("#1F2937")
          .rect(40, currentY, 762, 22)
          .fill();
        doc
          .fillColor("#FFFFFF")
          .font("Helvetica-Bold");
        doc.text("Date", 50, currentY + 6);
        doc.text("Type", 140, currentY + 6);
        doc.text("Description", 230, currentY + 6);
        doc.text("Category", 480, currentY + 6);
        doc.text("Value Amount", 640, currentY + 6, {
          width: 140,
          align: "right",
        });
        currentY += 22;
        doc.font("Helvetica").fontSize(9);
      }

      // Row background colour
      const isIncome = tx.type === "INCOME";
      const bgColor = isIncome ? "#E6F4EA" : "#FCE8E6";
      doc
        .fillColor(bgColor)
        .rect(40, currentY, 762, 20)
        .fill();

      // Write cells
      const dateStr = tx.date.toISOString().split("T")[0];
      doc.fillColor("#1F2937");
      doc.text(dateStr, 50, currentY + 6);

      doc
        .fillColor(isIncome ? "#137333" : "#C5221F")
        .font("Helvetica-Bold");
      doc.text(tx.type, 140, currentY + 6);

      doc.fillColor("#1F2937").font("Helvetica");
      const description =
        tx.description.length > 45
          ? tx.description.substring(0, 42) + "..."
          : tx.description;
      doc.text(description, 230, currentY + 6);
      doc.text(
        tx.category?.name || "Uncategorized",
        480,
        currentY + 6
      );

      const formattedValue = `${Number(tx.originalAmount).toFixed(2)} ${tx.originalCurrency}`;
      doc.text(formattedValue, 640, currentY + 6, {
        width: 140,
        align: "right",
      });

      currentY += 20;
    }

    doc.end();
  } catch (error: unknown) {
    console.error("PDF Export Error:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json(
          buildSafeError(
            "Internal server error exporting system document report vectors."
          )
        );
    }
  }
};
/* === SECTION 3 END === */