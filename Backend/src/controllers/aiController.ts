// Backend/src/controllers/aiController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../db";

// Gemini API endpoint for the flash-lite model
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

// Supported timeline scopes for analysis
type TimelineScope = "today" | "week" | "month";

// Pre‑defined companion personalities with strict simple-language instructions
interface CompanionPersona {
  title: string;
  instruction: string;
}

const COMPANION_PERSONAS: Record<string, CompanionPersona> = {
  savage_roaster: {
    title: "Savage Roaster",
    instruction:
      "You are RakhoKhata AI Buddy — a witty, funny, blunt friend from Pakistan. Speak in EXTREMELY SIMPLE, easy-to-read everyday English, mixed with mild local slang (like 'Yaar', 'Kharcha', 'Hisaab'). Never use complicated words or complex financial terms. Keep every sentence short, clear, and funny. STIPULATION: Never output a dollar sign ($). Write all money in PKR.",
  },
  supportive_coach: {
    title: "Supportive Coach",
    instruction:
      "You are an encouraging money coach. Speak in VERY SIMPLE, clear, everyday English. Be positive and friendly. Avoid long or complicated financial words. Keep sentences short and easy to understand. STIPULATION: Never output a dollar sign ($). Write all money in PKR.",
  },
  forensic_detective: {
    title: "Forensic Detective",
    instruction:
      "You are a sharp financial detective. Speak in SIMPLE, clear English. State your observations like simple clues. Avoid complex jargon or big words. STIPULATION: Never output a dollar sign ($). Write all money in PKR.",
  },
  silent_accountant: {
    title: "Silent Accountant",
    instruction:
      "You are a calm, direct accountant. Speak in SUPER SIMPLE, basic English. Give clear, straightforward facts and numbers. No long words or confusing financial terms. STIPULATION: Never output a dollar sign ($). Write all money in PKR.",
  },
};

// Simple persona instructions for the general AI ask endpoint
const PERSONA_INSTRUCTIONS: Record<string, string> = {
  auditor:
    "You are a Strict Financial Auditor. Speak in super simple, plain English. Be direct and honest about wasted money using short, simple sentences. Avoid complex jargon. Limit your response to 3-5 sentences.",
  coach:
    "You are a supportive Money Coach. Speak in simple, friendly, easy-to-understand English. Give basic, practical advice. Limit your response to 3-5 sentences.",
  minimalist:
    "You are a Minimalist Advisor. Speak in simple everyday English. Tell the user clearly and simply what to cut or save. Limit your response to 3-5 sentences.",
};

// Safely retrieves the Gemini API key from environment variables
function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }
  return key;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

interface WorkspaceMetrics {
  totalIncome: number;
  totalExpenses: number;
  fixedExpenses: number;
  flexibleExpenses: number;
  safeToSpend: number;
  topCategory: string;
  budgets: Array<{
    categoryName: string;
    limitAmount: number;
    spentAmount: number;
  }>;
  currency: string;
  rawTransactions: Array<{
    date: string;
    description: string;
    type: string;
    category: string;
    amount: number;
  }>;
  dateRangeText: string;
}

interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  aiPersona?: string | null;
  lastTodayAnalysisRun?: unknown;
  lastWeekAnalysisRun?: unknown;
  lastMonthAnalysisRun?: unknown;
}

interface PromptData {
  income: number;
  expenses: number;
  topCategory: string;
  budgets: WorkspaceMetrics["budgets"];
  currency: string;
  rawTransactions: WorkspaceMetrics["rawTransactions"];
  workspaceName: string;
  userName: string;
}

/**
 * Computes the start and end date boundaries for a given timeline scope.
 * Uses a fixed anchor date (2026-07-17) for consistent testing.
 */
function getDateRangeForScope(scope: TimelineScope): {
  startDate: Date;
  endDate: Date;
} {
  const anchor = new Date("2026-07-17T12:00:00Z");
  const start = new Date(anchor);
  const end = new Date(anchor);

  if (scope === "today") {
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
  } else if (scope === "week") {
    start.setUTCDate(anchor.getUTCDate() - 6);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
  } else if (scope === "month") {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const nextMonth = new Date(anchor);
    nextMonth.setUTCMonth(anchor.getUTCMonth() + 1, 1);
    nextMonth.setUTCHours(0, 0, 0, 0);
    end.setTime(nextMonth.getTime() - 1);
  }

  return { startDate: start, endDate: end };
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * Fetches all relevant workspace data from the database and computes
 * financial metrics for the given scope.
 */
async function fetchAndCalculateWorkspaceMetrics(
  workspaceId: string,
  userId: string,
  scope: TimelineScope
): Promise<{
  user: ExtendedUser;
  workspace: { id: string; name: string; currency: string };
  metrics: WorkspaceMetrics;
}> {
  const { startDate, endDate } = getDateRangeForScope(scope);

  const [workspace, user, transactions, categories, budgets] =
    await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true, currency: true, userId: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          aiPersona: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          workspaceId,
          date: {
            gte: startDate.toISOString(),
            lte: endDate.toISOString(),
          },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      }),
      prisma.category.findMany({ where: { workspaceId } }),
      prisma.budget.findMany({
        where: { workspaceId },
        include: { category: true },
      }),
    ]);

  if (!workspace || workspace.userId !== userId) {
    throw new Error("Workspace access denied.");
  }

  const workspaceCurrency = workspace.currency || "PKR";

  let totalIncome = 0;
  let totalExpenses = 0;
  let fixedExpenses = 0;
  let flexibleExpenses = 0;
  const categorySpent: Record<string, number> = {};

  const rawTransactionsList = transactions.map((tx) => {
    const amount = Number(tx.originalAmount ?? 0);
    const catName = tx.category?.name ?? "Uncategorized";
    const dateStr = tx.date
      ? new Date(tx.date).toISOString().split("T")[0]
      : "N/A";

    if (tx.type === "INCOME") {
      totalIncome += amount;
    } else if (tx.type === "EXPENSE") {
      totalExpenses += amount;
      categorySpent[catName] = (categorySpent[catName] || 0) + amount;

      if (tx.category?.isFixed || tx.category?.isRecurring) {
        fixedExpenses += amount;
      } else {
        flexibleExpenses += amount;
      }
    }

    return {
      date: dateStr,
      description: tx.description ?? "No description",
      type: tx.type,
      category: catName,
      amount,
    };
  });

  const safeToSpend = totalIncome - totalExpenses;

  const sortedExpenses = Object.entries(categorySpent).sort(
    ([, a], [, b]) => b - a
  );
  const topCategory = sortedExpenses.length > 0 ? sortedExpenses[0][0] : "None";

  const parsedBudgets = budgets.map((b) => {
    const catName = b.category?.name ?? "Unknown";
    const limit = Number(b.originalAmount ?? 0);
    const spent = categorySpent[catName] || 0;
    return { categoryName: catName, limitAmount: limit, spentAmount: spent };
  });

  return {
    user: (user as ExtendedUser) ?? {
      id: "",
      name: "User",
      email: "",
    },
    workspace,
    metrics: {
      totalIncome,
      totalExpenses,
      fixedExpenses,
      flexibleExpenses,
      safeToSpend,
      topCategory,
      budgets: parsedBudgets,
      currency: workspaceCurrency,
      rawTransactions: rawTransactionsList,
      dateRangeText: `${startDate.getUTCDate()}/${startDate.getUTCMonth() + 1} to ${endDate.getUTCDate()}/${endDate.getUTCMonth() + 1}`,
    },
  };
}

/**
 * Builds a detailed, structured prompt for the Gemini API.
 */
function buildPrompt(question: string, data: PromptData): string {
  const {
    income,
    expenses,
    topCategory,
    budgets,
    currency,
    rawTransactions,
    workspaceName,
    userName,
  } = data;
  const savings = income - expenses;
  const savingsPercent = income > 0 ? ((savings / income) * 100).toFixed(1) : "0";

  const budgetLines =
    budgets.length > 0
      ? budgets
          .map(
            (b) =>
              `- ${b.categoryName}: Budget ${b.limitAmount.toFixed(2)} ${currency} | Spent ${b.spentAmount.toFixed(2)} ${currency} | ${b.spentAmount > b.limitAmount ? `Overspent by ${(b.spentAmount - b.limitAmount).toFixed(2)} ${currency}` : "On track"}`
          )
          .join("\n")
      : "No active budgets registered in this workspace.";

  const ledgerTable =
    rawTransactions.length > 0
      ? rawTransactions
          .map(
            (tx) =>
              `  [${tx.date}] | ${tx.type.padEnd(7)} | ${tx.description.padEnd(20)} | ${tx.category.padEnd(15)} | ${tx.amount.toFixed(2)} ${currency}`
          )
          .join("\n")
      : "  No recorded transactions inside this timeframe scope.";

  return `
--- FINANCIAL CONTEXT SHEET FOR: ${userName.toUpperCase()} ---
Workspace: "${workspaceName}"
System Current Date: July 17, 2026

METRICS SUMMARY:
- Total Income: ${income.toFixed(2)} ${currency}
- Total Expenses: ${expenses.toFixed(2)} ${currency}
- Net Savings: ${savings.toFixed(2)} ${currency} (${savingsPercent}% of income)
- Top Expense Category: ${topCategory}

BUDGET SETTINGS:
${budgetLines}

ITEMIZED TRANSACTION LEDGER:
Date       | Type    | Description          | Category        | Amount
----------------------------------------------------------------------------------
${ledgerTable}

USER QUERY:
"${question}"

STIPULATIONS:
1. Rely exclusively on the itemized ledger above to answer raw transaction questions.
2. Under absolutely no circumstances output a dollar sign ($). All currencies must be displayed in PKR.
3. CRITICAL: Explain everything in VERY SIMPLE, EASY-TO-UNDERSTAND English. Do NOT use complex financial words, dense jargon, or confusing phrasing. Keep sentences short and clear.
`;
}

async function trySaveCooldown(
  userId: string,
  scope: TimelineScope
): Promise<void> {}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPRESS ROUTE CONTROLLERS (EXPORTS) ===
   ========================================================================== */

/**
 * POST /api/ai/ask
 */
export const askAI = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { question, persona, workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (!workspaceId || !question) {
      res.status(400).json({
        error: "Workspace ID and question are required.",
      });
      return;
    }

    const personaKey =
      persona && PERSONA_INSTRUCTIONS[persona]
        ? persona
        : "coach";
    const systemInstruction = PERSONA_INSTRUCTIONS[personaKey];

    const { workspace, metrics, user } =
      await fetchAndCalculateWorkspaceMetrics(workspaceId, userId, "month");

    const promptData: PromptData = {
      income: metrics.totalIncome,
      expenses: metrics.totalExpenses,
      topCategory: metrics.topCategory,
      budgets: metrics.budgets,
      currency: metrics.currency,
      rawTransactions: metrics.rawTransactions,
      workspaceName: workspace?.name ?? "Workspace",
      userName: user?.name ?? "User",
    };
    const prompt = buildPrompt(question, promptData);

    const apiKey = getApiKey();
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        response.status,
        await response.text().catch(() => "")
      );
      res.status(502).json({ error: "AI service temporarily unavailable." });
      return;
    }

    const result: unknown = await response.json();
    const aiText = extractAiText(result);
    res.status(200).json({ response: aiText });
  } catch (error: unknown) {
    console.error("AI Ask Controller Error:", error);
    res.status(500).json({ error: "An unexpected error occurred while processing your request." });
  }
};

/**
 * POST /api/ai/greeting
 */
export const getAiCompanionGreeting = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (!workspaceId) {
      res.status(400).json({ error: "Workspace ID is required." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, aiPersona: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const personaKey = user.aiPersona || "supportive_coach";
    const selectedPersona =
      COMPANION_PERSONAS[personaKey] || COMPANION_PERSONAS.supportive_coach;

    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    const creativeGreetingPrompt = `
You are the personal AI companion for ${user.name}.
Current time of day is: ${timeOfDay}.

Persona: ${selectedPersona.title}

TASK: Write a short, warm, and simple greeting for ${user.name} to start their day with a smile.

STIPULATIONS:
1. Under absolutely no circumstances mention account balances, income, expenses, transactions, or financial figures.
2. If 'Savage Roaster', be witty, funny, and playfully tease them in super simple English.
3. If 'Supportive Coach', be friendly and encouraging in clear, simple words.
4. If 'Forensic Detective', state a fun, simple, playful "clue" about their day.
5. If 'Silent Accountant', be calm, warm, and simple.
6. Write a maximum of 2 short sentences.
7. CRITICAL: Use VERY SIMPLE, EASY-TO-READ English. No long or complex words!
8. CRITICAL: Absolutely never output a dollar sign ($) anywhere.
`;

    const apiKey = getApiKey();
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: selectedPersona.instruction }],
        },
        contents: [{ parts: [{ text: creativeGreetingPrompt }] }],
      }),
    });

    if (!response.ok) {
      res.status(200).json({
        user: { name: user.name, aiPersona: personaKey },
        greeting: `Hey ${user.name}! Ready to check your money today? Tap a button below to get started!`,
        cooldowns: { today: false, week: false, month: false },
      });
      return;
    }

    const result: unknown = await response.json();
    const greetingText = extractAiText(result);
    res.status(200).json({
      user: { name: user.name, aiPersona: personaKey },
      greeting: greetingText,
      cooldowns: { today: false, week: false, month: false },
    });
  } catch (error: unknown) {
    console.error("Companion Greeting Error:", error);
    res.status(500).json({ error: "Unable to generate greeting at this moment." });
  }
};

/**
 * POST /api/ai/execute-analysis
 */
export const executeAiCompanionAnalysis = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { scope, workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (!workspaceId) {
      res.status(400).json({ error: "Workspace ID is required." });
      return;
    }

    const validScopes: TimelineScope[] = ["today", "week", "month"];
    if (!validScopes.includes(scope)) {
      res.status(400).json({ error: "Invalid scope. Allowed: today, week, month." });
      return;
    }

    const { user, metrics } = await fetchAndCalculateWorkspaceMetrics(
      workspaceId,
      userId,
      scope
    );

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const personaKey = user.aiPersona || "supportive_coach";
    const selectedPersona =
      COMPANION_PERSONAS[personaKey] || COMPANION_PERSONAS.supportive_coach;

    const analysisPrompt = `
Give ${user.name} a super simple, easy-to-read summary of their spending for the '${scope}' period (${metrics.dateRangeText}).

Summary Numbers:
- Money Safe to Spend: PKR ${metrics.safeToSpend.toFixed(2)}
- Total Income: PKR ${metrics.totalIncome.toFixed(2)}
- Total Money Spent: PKR ${metrics.totalExpenses.toFixed(2)}
- Everyday / Flexible Spending: PKR ${metrics.flexibleExpenses.toFixed(2)}
- Regular Fixed Bills: PKR ${metrics.fixedExpenses.toFixed(2)}

CRITICAL INSTRUCTIONS:
1. Write exactly 3 short, super simple sentences analyzing their '${scope}' spending.
2. Use EXTREMELY SIMPLE, everyday English that anyone can read in 5 seconds.
3. Do NOT use long words, heavy financial terms, or complex corporate language.
4. If 'savage_roaster', tease them simply about their spending. If 'coach', give them a simple tip on saving.
5. NEVER use a dollar sign ($). Write all money in 'PKR'.
`;

    const apiKey = getApiKey();
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: selectedPersona.instruction }],
        },
        contents: [{ parts: [{ text: analysisPrompt }] }],
      }),
    });

    if (!response.ok) {
      res.status(502).json({ error: "AI analysis service temporarily unavailable." });
      return;
    }

    const result: unknown = await response.json();
    const analysisText = extractAiText(result);

    await trySaveCooldown(userId, scope as TimelineScope);

    res.status(200).json({
      success: true,
      analysisReport: analysisText,
    });
  } catch (error: unknown) {
    console.error("Execute Analysis Companion failure:", error);
    res.status(500).json({ error: "An unexpected error occurred during analysis." });
  }
};

/**
 * Utility: safely extracts the text response from a Gemini API result object.
 */
function extractAiText(result: unknown): string {
  try {
    const obj = result as Record<string, unknown>;
    const candidates = obj?.candidates as Array<Record<string, unknown>> | undefined;
    const firstCandidate = candidates?.[0];
    const content = firstCandidate?.content as Record<string, unknown> | undefined;
    const parts = content?.parts as Array<{ text?: string }> | undefined;
    const text = parts?.[0]?.text;
    if (typeof text === "string" && text.trim().length > 0) {
      return text.trim();
    }
  } catch {
    // Fall through to default message
  }
  return "Sorry, I couldn't generate a response right now.";
}
/* === SECTION 4 END === */