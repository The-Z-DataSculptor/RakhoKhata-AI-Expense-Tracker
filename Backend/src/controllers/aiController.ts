// Backend/src/controllers/aiController.ts

import dotenv from "dotenv";
dotenv.config();

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
    title: "Savage Financial Critic",
    instruction:
      "You are RakhoKhaata AI Buddy — a witty, sharp, playfully blunt friend. Speak in VERY SIMPLE, everyday English. Keep your answer sharp, witty, and strictly between 3 to 5 short lines.",
  },
  supportive_coach: {
    title: "Growth Co-Pilot",
    instruction:
      "You are an encouraging money coach. Speak in VERY SIMPLE, clear, everyday English. Be positive and motivating. Keep your answer practical and strictly between 3 to 5 short lines.",
  },
  forensic_detective: {
    title: "Forensic Ledger Auditor",
    instruction:
      "You are a sharp financial auditor. Speak in SIMPLE, direct English. State your observations like clues, anomalies, and spending leaks. Keep your answer strictly between 3 to 5 short lines.",
  },
  silent_accountant: {
    title: "Precision Strategist",
    instruction:
      "You are a calm, highly direct financial strategist. Speak in BASIC, straightforward English. Deliver pure mathematical facts and ledger telemetry. Keep your answer strictly between 3 to 5 short lines.",
  },
};

const PERSONA_INSTRUCTIONS: Record<string, string> = {
  savage_roaster: COMPANION_PERSONAS.savage_roaster.instruction,
  supportive_coach: COMPANION_PERSONAS.supportive_coach.instruction,
  forensic_detective: COMPANION_PERSONAS.forensic_detective.instruction,
  silent_accountant: COMPANION_PERSONAS.silent_accountant.instruction,
  auditor: COMPANION_PERSONAS.forensic_detective.instruction,
  coach: COMPANION_PERSONAS.supportive_coach.instruction,
  minimalist: COMPANION_PERSONAS.silent_accountant.instruction,
};

// ==========================================================================
// HELPER UTILITIES
// ==========================================================================

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    console.error("Gemini API Key is missing in environment variables.");
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is missing from environment variables.");
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
  return "I have audited your ledger. Everything is accounted for.";
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
        deletedAt: null,
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
--- USER CONTEXT ---
User Name: "${user?.name ?? "User"}"
Occupation: "${user?.occupation || "Not Specified"}"
Primary Goal: "${user?.financialGoal || "General Wealth & Budgeting"}"
Country: "${user?.country || "Not Specified"}"
Languages: "${languagesList}"
Currency: "${metrics.currency}"
Workspace: "${workspaceName}"

METRICS:
- Income: ${metrics.totalIncome.toFixed(2)} ${metrics.currency}
- Expenses: ${metrics.totalExpenses.toFixed(2)} ${metrics.currency}
- Savings: ${savings.toFixed(2)} ${metrics.currency} (${savingsPercent}%)
- Top Category: ${metrics.topCategory}

BUDGETS:
${budgetLines}

RECENT TRANSACTIONS:
${ledgerTable}

USER QUERY:
${question}

RULES:
1. Tailor the advice directly to ${user?.name ?? "the user"}'s occupation (${user?.occupation || "general"}) and goal (${user?.financialGoal || "budgeting"}).
2. Use plain, direct, easy English.
3. Keep the total response strictly between 3 to 5 lines.
4. Format all money with ${metrics.currency}.
`;
}

// ==========================================================================
// EXPRESS CONTROLLER HANDLERS
// ==========================================================================

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

    const effectivePersonaKey = persona || user?.aiPersona || "supportive_coach";
    const systemInstruction = PERSONA_INSTRUCTIONS[effectivePersonaKey] || PERSONA_INSTRUCTIONS.supportive_coach;

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

TASK: Write a warm, 1-2 sentence greeting addressing ${user.name}.

RULES:
1. Do NOT mention specific balances or exact amounts.
2. Keep words simple, clear, and encouraging.
3. Tailor the tone to their goal (${user.financialGoal || "saving"}).
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
        greeting: `Hey ${user.name}! Ready to review your ledger moves today?`,
        cooldowns: { today: false, week: false, month: false },
      });
    }
  } catch (error: unknown) {
    console.error("Greeting Controller Failure:", error);
    res.status(500).json({ error: "Unable to generate greeting at this time." });
  }
};

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
- Flexible Spent: ${metrics.flexibleExpenses.toFixed(2)}
- Fixed Bills: ${metrics.fixedExpenses.toFixed(2)}

RULES:
1. Write 3 short sentences analyzing spending tailored to their goal (${user?.financialGoal || "saving"}).
2. Use simple, direct English.
3. Express currency in '${metrics.currency}'.
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