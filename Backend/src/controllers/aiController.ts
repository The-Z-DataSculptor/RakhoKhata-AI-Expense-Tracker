import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../db";

// ==========================================================================
// CONFIGURATION & CONSTANTS
// ==========================================================================

// Gemini Flash Lite endpoint
// WHY THIS FIX WAS MADE: Google made gemini-3.5-flash-lite generally available (GA) for
// production on July 21, 2026, replacing gemini-3.1-flash-lite as the current low-cost model.
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

// 15-second timeout safeguard for external API calls
const API_TIMEOUT_MS = 15000;

// Maximum transactions to include in prompt context to prevent token overflows
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
      "You are RakhoKhata AI Buddy — a witty, funny, blunt friend from Pakistan. Speak in EXTREMELY SIMPLE, easy-to-read everyday English, mixed with mild local slang (like 'Yaar', 'Kharcha', 'Hisaab'). Keep every sentence short, clear, and funny. STIPULATION: Never output a dollar sign ($). Write all money in PKR.",
  },
  supportive_coach: {
    title: "Supportive Coach",
    instruction:
      "You are an encouraging money coach. Speak in VERY SIMPLE, clear, everyday English. Be positive and friendly. Keep sentences short and easy to understand. STIPULATION: Never output a dollar sign ($). Write all money in PKR.",
  },
  forensic_detective: {
    title: "Forensic Detective",
    instruction:
      "You are a sharp financial detective. Speak in SIMPLE, clear English. State your observations like simple clues. STIPULATION: Never output a dollar sign ($). Write all money in PKR.",
  },
  silent_accountant: {
    title: "Silent Accountant",
    instruction:
      "You are a calm, direct accountant. Speak in SUPER SIMPLE, basic English. Give clear facts and numbers. STIPULATION: Never output a dollar sign ($). Write all money in PKR.",
  },
};

const PERSONA_INSTRUCTIONS: Record<string, string> = {
  auditor:
    "You are a Strict Financial Auditor. Speak in super simple, plain English. Be direct and honest about wasted money in 3-5 short sentences.",
  coach:
    "You are a supportive Money Coach. Speak in simple, friendly English with basic, practical advice in 3-5 short sentences.",
  minimalist:
    "You are a Minimalist Advisor. Speak in simple everyday English. Tell the user clearly what to cut or save in 3-5 short sentences.",
};

// ==========================================================================
// HELPER UTILITIES
// ==========================================================================

/** Safely retrieves Gemini API key from environment variables */
function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is missing from environment variables.");
  }
  return key;
}

/** Rounds currency floats to 2 decimal places to prevent floating-point precision corruption */
function safeRoundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Calculates accurate real-time date boundaries based on current UTC time */
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

    // Set to end of current month
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    end.setTime(nextMonth.getTime() - 1);
  }

  return { startDate: start, endDate: end };
}

/** Executes a secure HTTP POST request to the Gemini API with timeout protection */
async function callGeminiApi(systemInstruction: string, userPrompt: string): Promise<string> {
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey, // Securely passing API key in HTTP headers instead of URL parameters
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
    clearTimeout(timeoutId); // Clean up timeout handler
  }
}

/** Safely parses output text from Gemini API response structure */
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

/** Fetches workspace details and calculates workspace metrics after enforcing BOLA authorization */
async function fetchAndCalculateWorkspaceMetrics(
  workspaceId: string,
  userId: string,
  scope: TimelineScope
) {
  // BOLA Authorization Shield: Verify workspace ownership BEFORE executing query pipelines
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId: userId },
    select: { id: true, name: true, currency: true, userId: true },
  });

  if (!workspace) {
    throw new Error("AUTHORIZATION_DENIED");
  }

  const { startDate, endDate } = getDateRangeForScope(scope);

  // Fetch contextual user, categories, budgets, and capped transactions in parallel
  const [user, transactions, budgets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, aiPersona: true },
    }),
    prisma.transaction.findMany({
      where: {
        workspaceId: workspaceId,
        date: { gte: startDate, lte: endDate },
      },
      include: { category: true },
      orderBy: { date: "desc" },
      take: MAX_PROMPT_TRANSACTIONS, // Capped to prevent memory exhaustion and token overflow
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

  // Find top expense category
  const sortedCategories = Object.entries(categorySpentMap).sort(([, a], [, b]) => b - a);
  const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : "None";

  // Parse budgets
  const parsedBudgets = budgets.map((b) => {
    const catName = b.category?.name ?? "Unknown";
    const limit = Number(b.originalAmount ?? 0);
    const spent = categorySpentMap[catName] || 0;
    return { categoryName: catName, limitAmount: limit, spentAmount: spent };
  });

  const formattedDateRange = `${startDate.getUTCDate()}/${startDate.getUTCMonth() + 1}/${startDate.getUTCFullYear()}`;

  const metrics: WorkspaceMetrics = {
    totalIncome,
    totalExpenses,
    fixedExpenses,
    flexibleExpenses,
    safeToSpend,
    topCategory,
    budgets: parsedBudgets,
    currency: workspace.currency || "PKR",
    rawTransactions: formattedTransactions,
    dateRangeText: formattedDateRange,
  };

  return { user, workspace, metrics };
}

/** Formats financial metrics into a structured prompt */
function buildPrompt(question: string, metrics: WorkspaceMetrics, workspaceName: string, userName: string): string {
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

  // Wrap user question inside delimited XML tags to mitigate prompt injection attacks
  return `
--- FINANCIAL DATA CONTEXT ---
User Name: "${userName}"
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

STIPULATIONS:
1. Answer strictly using the ledger context provided above.
2. Under no circumstances output a dollar sign ($). Write all currencies in PKR.
3. Keep explanation in VERY SIMPLE English. Short sentences only.
`;
}

// ==========================================================================
// EXPRESS CONTROLLER HANDLERS
// ==========================================================================

/**
 * POST /api/ai/ask
 * Evaluates general user questions against workspace ledger metrics
 */
export const askAI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { question, persona, workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (!workspaceId || !question || typeof question !== "string") {
      res.status(400).json({ error: "Valid workspace ID and question string are required." });
      return;
    }

    const personaKey = persona && PERSONA_INSTRUCTIONS[persona] ? persona : "coach";
    const systemInstruction = PERSONA_INSTRUCTIONS[personaKey];

    const { user, workspace, metrics } = await fetchAndCalculateWorkspaceMetrics(workspaceId, userId, "month");

    const promptText = buildPrompt(question, metrics, workspace.name, user?.name ?? "User");
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
 * Generates personalized daily onboarding greetings
 */
export const getAiCompanionGreeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Verify workspace ownership first
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
      select: { name: true, aiPersona: true },
    });

    if (!user) {
      res.status(404).json({ error: "User account not found." });
      return;
    }

    const personaKey = user.aiPersona || "supportive_coach";
    const selectedPersona = COMPANION_PERSONAS[personaKey] || COMPANION_PERSONAS.supportive_coach;

    // Use UTC hours for predictable greeting behavior across hosting servers
    const currentUtcHour = new Date().getUTCHours();
    const timeOfDay = currentUtcHour < 12 ? "morning" : currentUtcHour < 17 ? "afternoon" : "evening";

    const greetingPrompt = `
You are the AI companion for ${user.name}. Time of day is ${timeOfDay}.
Persona: ${selectedPersona.title}

TASK: Write a short, warm, 1-2 sentence greeting for ${user.name}.

STIPULATIONS:
1. Do NOT mention any account balances, income, expenses, or financial figures.
2. Keep words EXTREMELY SIMPLE and friendly.
3. Never output a dollar sign ($).
`;

    try {
      const greetingText = await callGeminiApi(selectedPersona.instruction, greetingPrompt);
      res.status(200).json({
        user: { name: user.name, aiPersona: personaKey },
        greeting: greetingText,
        cooldowns: { today: false, week: false, month: false },
      });
    } catch {
      // Fallback greeting if AI API call fails
      res.status(200).json({
        user: { name: user.name, aiPersona: personaKey },
        greeting: `Hey ${user.name}! Ready to review your finances today?`,
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
 * Generates automated timeline summaries (today, week, month)
 */
export const executeAiCompanionAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
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
Summarize financial performance for ${user?.name ?? "User"} during scope '${scope}' (${metrics.dateRangeText}).

METRICS:
- Safe To Spend: PKR ${metrics.safeToSpend.toFixed(2)}
- Total Income: PKR ${metrics.totalIncome.toFixed(2)}
- Total Spent: PKR ${metrics.totalExpenses.toFixed(2)}
- Flexible Spent: PKR ${metrics.flexibleExpenses.toFixed(2)}
- Fixed Bills: PKR ${metrics.fixedExpenses.toFixed(2)}

INSTRUCTIONS:
1. Write 3 short sentences analyzing spending.
2. Use VERY SIMPLE, plain English.
3. Never use a dollar sign ($). Write money in PKR.
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