// Backend/src/controllers/aiController.ts

import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../db";

// ==========================================================================
// CONFIGURATION & CONSTANTS
// ==========================================================================

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

const API_TIMEOUT_MS = 15000;
const MAX_PROMPT_TRANSACTIONS = 40;

type TimelineScope = "today" | "week" | "month";

interface CompanionPersona {
  title: string;
  instruction: string;
}

const COMPANION_PERSONAS: Record<string, CompanionPersona> = {
  savage_roaster: {
    title: "Savage Roaster",
    instruction:
      "You are RakhoKhata AI Buddy — a witty, funny, blunt friend. Speak in EXTREMELY SIMPLE, easy-to-read everyday English, mixed with mild local casual terms. Keep every sentence short, clear, and funny.",
  },
  supportive_coach: {
    title: "Supportive Coach",
    instruction:
      "You are an encouraging money coach. Speak in VERY SIMPLE, clear, everyday English. Be positive and friendly. Keep sentences short and easy to understand.",
  },
  forensic_detective: {
    title: "Forensic Detective",
    instruction:
      "You are a sharp financial detective. Speak in SIMPLE, clear English. State your observations like simple clues.",
  },
  silent_accountant: {
    title: "Silent Accountant",
    instruction:
      "You are a calm, direct accountant. Speak in SUPER SIMPLE, basic English. Give clear facts and numbers.",
  },
};

const PERSONA_INSTRUCTIONS: Record<string, string> = {
  auditor:
    "You are a Strict Financial Auditor. Speak in super simple, plain English. Be direct and honest about wasted money in 3-5 short sentences.",
  coach:
    "You are a supportive Money Coach. Speak in simple, friendly English with basic, practical advice in 3-5 short sentences.",
  minimalist:
    "You are a Minimalist Advisor. Speak in simple everyday English. Tell the user clearly what to cut or save in 3-5 short sentences.",
  savage_roaster:
    "You are a Savage Roaster. Speak in witty, sharp, humorous plain English. Playfully roast spending habits in 3-5 short sentences.",
  supportive_coach:
    "You are a Supportive Money Coach. Speak in warm, encouraging English in 3-5 short sentences.",
  forensic_detective:
    "You are a Forensic Financial Detective. Break down clues and budget leaks in 3-5 short sentences.",
  silent_accountant:
    "You are a Silent Accountant. State pure financial facts and numbers directly in 3-5 short sentences.",
};

// ==========================================================================
// HELPER UTILITIES
// ==========================================================================

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is missing from environment variables.");
  }
  return key;
}

function safeRoundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function getDateRangeForScope(scope: TimelineScope): { startDate: Date; endDate: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (scope === "today") {
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
  } else if (scope === "week") {
    start.setUTCDate(now.getUTCDate() - 6);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
  } else if (scope === "month") {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    end.setTime(nextMonth.getTime() - 1);
  }

  return { startDate: start, endDate: end };
}

async function callGeminiApi(systemInstruction: string, userPrompt: string): Promise<string> {
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [{ parts: [{ text: userPrompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No response body");
      console.error(`Gemini API HTTP Error (${response.status}):`, errorText);
      throw new Error(`AI service responded with status ${response.status}`);
    }

    const jsonResult = (await response.json()) as Record<string, unknown>;
    return extractAiText(jsonResult);
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractAiText(result: Record<string, unknown>): string {
  try {
    const candidates = result?.candidates as Array<Record<string, unknown>> | undefined;
    const content = candidates?.[0]?.content as Record<string, unknown> | undefined;
    const parts = content?.parts as Array<{ text?: string }> | undefined;
    const text = parts?.[0]?.text;

    if (typeof text === "string" && text.trim().length > 0) {
      return text.trim();
    }
  } catch (error) {
    console.error("Error parsing Gemini API JSON layout:", error);
  }
  return "Sorry, I couldn't process a clear response right now.";
}

// ==========================================================================
// CORE DATA ENGINE
// ==========================================================================

interface UserContextProfile {
  id: string;
  name: string;
  email: string;
  country?: string | null;
  currency?: string | null;
  languages?: string[];
  occupation?: string | null;
  financialGoal?: string | null;
  aiPersona?: string | null;
}

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

async function fetchAndCalculateWorkspaceMetrics(
  workspaceId: string,
  userId: string,
  scope: TimelineScope
) {
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId: userId },
    select: { id: true, name: true, currency: true, userId: true },
  });

  if (!workspace) {
    throw new Error("AUTHORIZATION_DENIED");
  }

  const { startDate, endDate } = getDateRangeForScope(scope);

  // Fetch full user profile along with transactions and budgets
  const [user, transactions, budgets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        currency: true,
        languages: true,
        occupation: true,
        financialGoal: true,
        aiPersona: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        workspaceId: workspaceId,
        date: { gte: startDate, lte: endDate },
      },
      include: { category: true },
      orderBy: { date: "desc" },
      take: MAX_PROMPT_TRANSACTIONS,
    }),
    prisma.budget.findMany({
      where: { workspaceId: workspaceId },
      include: { category: true },
    }),
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;
  let fixedExpenses = 0;
  let flexibleExpenses = 0;
  const categorySpentMap: Record<string, number> = {};

  const formattedTransactions = transactions.map((tx) => {
    const rawAmount = Number(tx.originalAmount ?? 0);
    const categoryName = tx.category?.name ?? "Uncategorized";
    const dateFormatted = tx.date ? new Date(tx.date).toISOString().split("T")[0] : "N/A";

    if (tx.type === "INCOME") {
      totalIncome = safeRoundCurrency(totalIncome + rawAmount);
    } else if (tx.type === "EXPENSE") {
      totalExpenses = safeRoundCurrency(totalExpenses + rawAmount);
      categorySpentMap[categoryName] = safeRoundCurrency((categorySpentMap[categoryName] || 0) + rawAmount);

      if (tx.category?.isFixed || tx.category?.isRecurring) {
        fixedExpenses = safeRoundCurrency(fixedExpenses + rawAmount);
      } else {
        flexibleExpenses = safeRoundCurrency(flexibleExpenses + rawAmount);
      }
    }

    return {
      date: dateFormatted,
      description: tx.description ?? "No description",
      type: tx.type,
      category: categoryName,
      amount: rawAmount,
    };
  });

  const safeToSpend = safeRoundCurrency(totalIncome - totalExpenses);

  const sortedCategories = Object.entries(categorySpentMap).sort(([, a], [, b]) => b - a);
  const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : "None";

  const parsedBudgets = budgets.map((b) => {
    const catName = b.category?.name ?? "Unknown";
    const limit = Number(b.originalAmount ?? 0);
    const spent = categorySpentMap[catName] || 0;
    return { categoryName: catName, limitAmount: limit, spentAmount: spent };
  });

  const formattedDateRange = `${startDate.getUTCDate()}/${startDate.getUTCMonth() + 1}/${startDate.getUTCFullYear()}`;

  const activeCurrency = workspace.currency || user?.currency || "USD";

  const metrics: WorkspaceMetrics = {
    totalIncome,
    totalExpenses,
    fixedExpenses,
    flexibleExpenses,
    safeToSpend,
    topCategory,
    budgets: parsedBudgets,
    currency: activeCurrency,
    rawTransactions: formattedTransactions,
    dateRangeText: formattedDateRange,
  };

  return { user, workspace, metrics };
}

function buildPrompt(
  question: string,
  metrics: WorkspaceMetrics,
  workspaceName: string,
  user: UserContextProfile | null
): string {
  const savings = safeRoundCurrency(metrics.totalIncome - metrics.totalExpenses);
  const savingsPercent = metrics.totalIncome > 0
    ? ((savings / metrics.totalIncome) * 100).toFixed(1)
    : "0";

  const budgetLines = metrics.budgets.length > 0
    ? metrics.budgets
        .map((b) => `- ${b.categoryName}: Limit ${b.limitAmount.toFixed(2)} ${metrics.currency} | Spent ${b.spentAmount.toFixed(2)} ${metrics.currency}`)
        .join("\n")
    : "No active budgets.";

  const ledgerTable = metrics.rawTransactions.length > 0
    ? metrics.rawTransactions
        .map((tx) => ` [${tx.date}] | ${tx.type.padEnd(7)} | ${tx.description.substring(0, 25)} | ${tx.amount.toFixed(2)} ${metrics.currency}`)
        .join("\n")
    : " No recent transactions found.";

  const languagesList = user?.languages?.length ? user.languages.join(", ") : "English";

  return `
--- USER PROFILE CONTEXT ---
User Name: "${user?.name ?? "User"}"
Occupation Style: "${user?.occupation || "Not Specified"}"
Primary Financial Goal: "${user?.financialGoal || "General Wealth & Budget Management"}"
Country: "${user?.country || "Not Specified"}"
Spoken Languages: "${languagesList}"
Default Currency: "${metrics.currency}"
Workspace: "${workspaceName}"
Current UTC Date: ${new Date().toISOString().substring(0, 10)}

METRICS SUMMARY:
- Total Income: ${metrics.totalIncome.toFixed(2)} ${metrics.currency}
- Total Expenses: ${metrics.totalExpenses.toFixed(2)} ${metrics.currency}
- Net Savings: ${savings.toFixed(2)} ${metrics.currency} (${savingsPercent}% of income)
- Top Expense Category: ${metrics.topCategory}

BUDGET STATUS:
${budgetLines}

RECENT TRANSACTIONS (MAX ${MAX_PROMPT_TRANSACTIONS}):
${ledgerTable}

<user_question>
${question}
</user_question>

INSTRUCTIONS & STIPULATIONS:
1. Tailor your answer specifically to ${user?.name ?? "the user"}'s occupation (${user?.occupation || "general"}) and financial goal (${user?.financialGoal || "budgeting"}).
2. Use simple, direct, easy-to-read English. Short sentences only.
3. Express all financial numbers using ${metrics.currency}.
`;
}

// ==========================================================================
// EXPRESS CONTROLLER HANDLERS
// ==========================================================================

/**
 * POST /api/ai/ask
 */
export const askAI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { question, persona, workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (!workspaceId || !question || typeof question !== "string") {
      res.status(400).json({ error: "Valid workspace ID and question string are required." });
      return;
    }

    const { user, workspace, metrics } = await fetchAndCalculateWorkspaceMetrics(workspaceId, userId, "month");

    const effectivePersonaKey = persona || user?.aiPersona || "coach";
    const systemInstruction = PERSONA_INSTRUCTIONS[effectivePersonaKey] || PERSONA_INSTRUCTIONS.coach;

    const promptText = buildPrompt(question, metrics, workspace.name, user);
    const aiResponseText = await callGeminiApi(systemInstruction, promptText);

    res.status(200).json({ response: aiResponseText });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AUTHORIZATION_DENIED") {
      res.status(403).json({ error: "Access denied to the specified workspace." });
      return;
    }

    console.error("askAI Controller Failure:", error);
    res.status(502).json({ error: "AI service temporarily unavailable. Please try again." });
  }
};

/**
 * POST /api/ai/greeting
 */
export const getAiCompanionGreeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (!workspaceId) {
      res.status(400).json({ error: "Workspace ID is required." });
      return;
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json({ error: "Access denied to specified workspace." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        aiPersona: true,
        occupation: true,
        financialGoal: true,
        country: true,
        currency: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User account not found." });
      return;
    }

    const personaKey = user.aiPersona || "supportive_coach";
    const selectedPersona = COMPANION_PERSONAS[personaKey] || COMPANION_PERSONAS.supportive_coach;

    const currentUtcHour = new Date().getUTCHours();
    const timeOfDay = currentUtcHour < 12 ? "morning" : currentUtcHour < 17 ? "afternoon" : "evening";

    const greetingPrompt = `
You are the AI companion for ${user.name}. 
Time of day: ${timeOfDay}.
User Occupation: ${user.occupation || "General"}.
User Primary Goal: ${user.financialGoal || "Saving & Wealth Building"}.
Persona: ${selectedPersona.title}.

TASK: Write a warm, personal 1-2 sentence greeting addressing ${user.name}.

STIPULATIONS:
1. Do NOT mention specific balances or exact currency amounts.
2. Keep words EXTREMELY SIMPLE and friendly.
3. Tailor the encouragement subtly to their goal (${user.financialGoal || "saving"}).
`;

    try {
      const greetingText = await callGeminiApi(selectedPersona.instruction, greetingPrompt);
      res.status(200).json({
        user: {
          name: user.name,
          aiPersona: personaKey,
          occupation: user.occupation,
          financialGoal: user.financialGoal,
        },
        greeting: greetingText,
        cooldowns: { today: false, week: false, month: false },
      });
    } catch {
      res.status(200).json({
        user: {
          name: user.name,
          aiPersona: personaKey,
          occupation: user.occupation,
          financialGoal: user.financialGoal,
        },
        greeting: `Hey ${user.name}! Ready to take control of your finances today?`,
        cooldowns: { today: false, week: false, month: false },
      });
    }
  } catch (error: unknown) {
    console.error("Greeting Controller Failure:", error);
    res.status(500).json({ error: "Unable to generate greeting at this time." });
  }
};

/**
 * POST /api/ai/execute-analysis
 */
export const executeAiCompanionAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { scope, workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (!workspaceId || !scope) {
      res.status(400).json({ error: "Workspace ID and timeframe scope are required." });
      return;
    }

    const validScopes: TimelineScope[] = ["today", "week", "month"];
    if (!validScopes.includes(scope as TimelineScope)) {
      res.status(400).json({ error: "Invalid scope. Must be 'today', 'week', or 'month'." });
      return;
    }

    const { user, metrics } = await fetchAndCalculateWorkspaceMetrics(
      workspaceId,
      userId,
      scope as TimelineScope
    );

    const personaKey = user?.aiPersona || "supportive_coach";
    const selectedPersona = COMPANION_PERSONAS[personaKey] || COMPANION_PERSONAS.supportive_coach;

    const analysisPrompt = `
Summarize financial performance for ${user?.name ?? "User"} during timeframe '${scope}' (${metrics.dateRangeText}).

USER PROFILE:
- Occupation: ${user?.occupation || "General"}
- Goal: ${user?.financialGoal || "Budgeting"}

METRICS (${metrics.currency}):
- Safe To Spend: ${metrics.currency} ${metrics.safeToSpend.toFixed(2)}
- Total Income: ${metrics.currency} ${metrics.totalIncome.toFixed(2)}
- Total Spent: ${metrics.currency} ${metrics.totalExpenses.toFixed(2)}
- Flexible Spent: ${metrics.currency} ${metrics.flexibleExpenses.toFixed(2)}
- Fixed Bills: ${metrics.currency} ${metrics.fixedExpenses.toFixed(2)}

INSTRUCTIONS:
1. Write 3 short sentences analyzing spending tailored to their profile goal (${user?.financialGoal || "saving"}).
2. Use VERY SIMPLE, plain English.
3. Use currency symbol/code '${metrics.currency}'.
`;

    const analysisText = await callGeminiApi(selectedPersona.instruction, analysisPrompt);

    res.status(200).json({
      success: true,
      analysisReport: analysisText,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AUTHORIZATION_DENIED") {
      res.status(403).json({ error: "Access denied to the specified workspace." });
      return;
    }

    console.error("Execute Analysis Failure:", error);
    res.status(502).json({ error: "AI analysis service is currently unavailable." });
  }
};