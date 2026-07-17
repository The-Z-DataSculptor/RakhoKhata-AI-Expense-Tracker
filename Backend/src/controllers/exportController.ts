// Backend/src/controllers/exportController.ts

import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

type ExportScope = "today" | "week" | "month" | "3months" | "6months" | "year" | "all";

/**
 * UTILITY: Custom Date Bounds Engine mapping precision timestamp frames
 */
function getExportDateRange(scope: ExportScope): { gte?: Date; lte?: Date } {
  const currentAnchor = new Date("2026-07-17T12:00:00Z");
  const startDate = new Date(currentAnchor);
  const endDate = new Date(currentAnchor);

  if (scope === "today") {
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);
    return { gte: startDate, lte: endDate };
  } else if (scope === "week") {
    startDate.setUTCDate(currentAnchor.getUTCDate() - 6);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);
    return { gte: startDate, lte: endDate };
  } else if (scope === "month") {
    startDate.setUTCDate(1);
    startDate.setUTCHours(0, 0, 0, 0);
    const nextMonth = new Date(currentAnchor);
    nextMonth.setUTCMonth(currentAnchor.getUTCMonth() + 1, 1);
    nextMonth.setUTCHours(0, 0, 0, 0);
    endDate.setTime(nextMonth.getTime() - 1);
    return { gte: startDate, lte: endDate };
  } else if (scope === "3months") {
    startDate.setUTCMonth(currentAnchor.getUTCMonth() - 3);
    startDate.setUTCHours(0, 0, 0, 0);
    return { gte: startDate };
  } else if (scope === "6months") {
    startDate.setUTCMonth(currentAnchor.getUTCMonth() - 6);
    startDate.setUTCHours(0, 0, 0, 0);
    return { gte: startDate };
  } else if (scope === "year") {
    startDate.setUTCFullYear(currentAnchor.getUTCFullYear(), 0, 1);
    startDate.setUTCHours(0, 0, 0, 0);
    return { gte: startDate };
  }

  return {}; // "all" returns empty object to fetch historical logs globally
}

/* ==========================================================================
   === EXCEL GENERATION ENGINE ===
   ========================================================================== */
export const exportTransactionsExcel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { workspaceId, scope } = req.query;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    if (!workspaceId) {
      res.status(400).json({ error: "Missing active workspace target parameter." });
      return;
    }

    // Tenant authorization check
    const workspace = await prisma.workspace.findUnique({ where: { id: String(workspaceId) } });
    if (!workspace || workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const dateRange = getExportDateRange(scope as ExportScope);
    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: String(workspaceId),
        ...(Object.keys(dateRange).length > 0 ? { date: dateRange } : {}),
      },
      include: { category: true },
      orderBy: { date: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ledger Statement");

    // Title Block Config
    worksheet.mergeCells("A1:F1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `RakhoKhata Ledger Statement — Workspace: ${workspace.name}`;
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "6366F1" } }; // Brand Blue
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 40;

    worksheet.addRow([]); // Blank spacer

    // Header Setup
    const headerRow = worksheet.addRow(["Date", "Type", "Description", "Category", "Original Value", "Currency"]);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1F2937" } };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });
    worksheet.getCell("E3").alignment = { horizontal: "right" };

    // Inject Rows
    transactions.forEach((tx) => {
      const formattedDate = tx.date.toISOString().split("T")[0];
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
      row.getCell(5).numFmt = "#,##0.00";// Professional Accounting Comma Separation

      // Highlight Rows Dynamically based on financial mapping classification
      if (tx.type === "INCOME") {
        row.getCell(2).font = { color: { argb: "137333" }, bold: true };
        row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E6F4EA" } }; });
      } else {
        row.getCell(2).font = { color: { argb: "C5221F" }, bold: true };
        row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FCE8E6" } }; });
      }
    });

    // Fit columns dynamically
    worksheet.columns = [
      { width: 15 }, // Date
      { width: 12 }, // Type
      { width: 30 }, // Description
      { width: 20 }, // Category
      { width: 18 }, // Amount
      { width: 12 }, // Currency
    ];

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=Statement_${scope || "all"}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel Export Error:", error);
    res.status(500).json({ error: "Internal server error exporting spreadsheet spreadsheet." });
  }
};

/* ==========================================================================
   === PDF GENERATION ENGINE ===
   ========================================================================== */
export const exportTransactionsPdf = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { workspaceId, scope } = req.query;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    if (!workspaceId) {
      res.status(400).json({ error: "Missing active workspace target parameter." });
      return;
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: String(workspaceId) } });
    if (!workspace || workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const dateRange = getExportDateRange(scope as ExportScope);
    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: String(workspaceId),
        ...(Object.keys(dateRange).length > 0 ? { date: dateRange } : {}),
      },
      include: { category: true },
      orderBy: { date: "desc" },
    });

    // Create safe Landscape vector canvas bounds to perfectly fit data tracking parameters
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Statement_${scope || "all"}.pdf`);

    doc.pipe(res);

    // Document Header Title Design Block
    doc.rect(40, 40, 762, 50).fill("#6366F1");
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(16).text(`RAKHOKHATA ACCOUNTING STATEMENT`, 60, 58);
    doc.fontSize(10).font("Helvetica").text(`Workspace: ${workspace.name.toUpperCase()}  |  Scope: ${String(scope).toUpperCase()}`, 60, 76, { align: "left" });

    // Table Header Setup positions
    let currentY = 110;
    doc.fillColor("#1F2937").rect(40, currentY, 762, 22).fill();
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(10);
    doc.text("Date", 50, currentY + 6);
    doc.text("Type", 140, currentY + 6);
    doc.text("Description", 230, currentY + 6);
    doc.text("Category", 480, currentY + 6);
    doc.text("Value Amount", 640, currentY + 6, { width: 140, align: "right" });

    currentY += 22;
    doc.font("Helvetica").fontSize(9);

    // Iterating transactions data matrix
    transactions.forEach((tx) => {
      // Trigger dynamic landscape multi-page canvas splits before breaking bounding margins
      if (currentY > 520) {
        doc.addPage();
        currentY = 40; // reset layout boundary top marker
        
        // Redraw table rows descriptor text header on split continuation sheets
        doc.fillColor("#1F2937").rect(40, currentY, 762, 22).fill();
        doc.fillColor("#FFFFFF").font("Helvetica-Bold");
        doc.text("Date", 50, currentY + 6);
        doc.text("Type", 140, currentY + 6);
        doc.text("Description", 230, currentY + 6);
        doc.text("Category", 480, currentY + 6);
        doc.text("Value Amount", 640, currentY + 6, { width: 140, align: "right" });
        currentY += 22;
        doc.font("Helvetica");
      }

      // Draw alternate row line indicators
      doc.fillColor(tx.type === "INCOME" ? "#E6F4EA" : "#FCE8E6").rect(40, currentY, 762, 20).fill();

      // Write Text Cells explicitly with colored labels mapping classification boundaries
      doc.fillColor("#1F2937");
      doc.text(tx.date.toISOString().split("T")[0], 50, currentY + 6);
      
      doc.fillColor(tx.type === "INCOME" ? "#137333" : "#C5221F").font("Helvetica-Bold");
      doc.text(tx.type, 140, currentY + 6);
      
      doc.fillColor("#1F2937").font("Helvetica");
      doc.text(tx.description.length > 45 ? `${tx.description.substring(0, 42)}...` : tx.description, 230, currentY + 6);
      doc.text(tx.category?.name || "Uncategorized", 480, currentY + 6);
      
      const formattedValue = `${Number(tx.originalAmount).toFixed(2)} ${tx.originalCurrency}`;
      doc.text(formattedValue, 640, currentY + 6, { width: 140, align: "right" });

      currentY += 20;
    });

    doc.end();
  } catch (error) {
    console.error("PDF Export Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error exporting system document report vectors." });
    }
  }
};