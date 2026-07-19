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

// Pre‑defined companion personalities with strict prompt instructions
interface CompanionPersona {
  title: string;
  instruction: string;
}

const COMPANION_PERSONAS: Record<string, CompanionPersona> = {
  savage_roaster: {
    title: "Savage Roaster",
    instruction:
      "You are a witty, extremely blunt Pakistani corporate financial roaster named RakhoKhata AI Buddy. Use friendly, conversational English mixed with mild, funny local Urdu/Pakistani street slang (like 'Aari Meri Jaan', 'Yaar', 'Kharcha', 'Hisaab', 'Daba ke kharch kiya'). Address the user directly by name. Look at their metrics context and give a sharp, hilarious reality check about their expenses, then prompt them to select one of the three scope analysis buttons below. STIPULATION: Never output a dollar sign ($) before strings, numbers, or headers. Output all amounts explicitly as PKR.",
  },
  supportive_coach: {
    title: "Supportive Coach",
    instruction:
      "You are an encouraging, highly supportive money coach. Be incredibly helpful, positive, and motivating. Address the user directly by name. Praise their progress, check their metrics, and gently advise them to select an analytical timeline button below to work toward their financial freedom. STIPULATION: Never output a dollar sign ($) before text or quotation markers under any circumstances. Output currency as PKR.",
  },
  forensic_detective: {
    title: "Forensic Detective",
    instruction:
      "You are an elite, sharp financial Forensic Detective. Be logical, professional, and state your observations like case files. Scan their metrics for leak anomalies, and direct them to choose a timeline analysis button below so you can search for leaks in their ledgers. STIPULATION: Do not output dollar indicators ($). Explicitly print currency labels as PKR.",
  },
  silent_accountant: {
    title: "Silent Accountant",
    instruction:
      "You are a quiet, hyper-analytical Silent Accountant. Keep your analysis entirely focus-driven, mathematical, and practical. Address the user directly, state their metrics simply, and invite them to run calculations by clicking a timeline button below. STIPULATION: Clean out all western currency markers ($). Print only numeric values appended with PKR.",
  },
};

// Simple persona instructions for the general AI ask endpoint
const PERSONA_INSTRUCTIONS: Record<string, string> = {
  auditor:
    "You are a Strict Financial Auditor. Be direct, honest, and critical. Point out waste clearly. Limit your response to 3-5 sentences.",
  coach:
    "You are a supportive Money Coach. Be encouraging and helpful. Give practical, actionable advice. Limit your response to 3-5 sentences.",
  minimalist:
    "You are a Minimalist Advisor. Help the user simplify their spending. Suggest what to cut or reduce. Limit your response to 3-5 sentences.",
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

// Shape of the computed workspace metrics returned by fetchAndCalculateWorkspaceMetrics
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

// Expanded user record including optional fields that may exist on the User model
interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  aiPersona?: string | null;
  // Cooldown timestamp fields – may not exist in all schemas; using unknown for safety
  lastTodayAnalysisRun?: unknown;
  lastWeekAnalysisRun?: unknown;
  lastMonthAnalysisRun?: unknown;
}

// The full context object passed to the AI prompt builder
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
    // Last 7 days including today
    start.setUTCDate(anchor.getUTCDate() - 6);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
  } else if (scope === "month") {
    // First day of current month to last day of current month
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    // Set end to the first day of next month minus one millisecond
    const nextMonth = new Date(anchor);
    nextMonth.setUTCMonth(anchor.getUTCMonth() + 1, 1);
    nextMonth.setUTCHours(0, 0, 0, 0);
    end.setTime(nextMonth.getTime() - 1);
  }

  return { startDate: start, endDate: end };
}

/**
 * Checks if two Date objects represent the same calendar day.
 */
function isSameCalendarDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
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

  // Fire all independent database queries simultaneously
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

  // Build the raw transaction list for the AI prompt
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

      // Classify as fixed or flexible based on category flags
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

  // Determine the top spending category
  const sortedExpenses = Object.entries(categorySpent).sort(
    ([, a], [, b]) => b - a
  );
  const topCategory = sortedExpenses.length > 0 ? sortedExpenses[0][0] : "None";

  // Prepare budget list with current spending status
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
 * The prompt includes the full transaction ledger, budgets, and metrics.
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

  // Render the raw transaction ledger as a formatted table
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
1. Rely exclusively on the itemized ledger above to list or audit raw transactions.
2. Under absolutely no circumstances should you ever output a dollar sign ($). All currencies must be displayed in PKR.
3. Be incredibly thorough and call out specific dates and transaction descriptions in your answer.
`;
}

/* --- Cooldown helpers (disabled – fields not in schema) --- */
// The cooldown fields (lastTodayAnalysisRun etc.) do not exist in the current
// User model. The following code safely skips any attempted writes.
async function trySaveCooldown(
  userId: string,
  scope: TimelineScope
): Promise<void> {
  // The field mapping would be:
  // today: "lastTodayAnalysisRun", week: "lastWeekAnalysisRun", month: "lastMonthAnalysisRun"
  // Because these columns are not defined, we skip the update entirely.
  // In a production system you would either add these columns or use a separate table.
  // Intentionally left empty – no database operation.
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPRESS ROUTE CONTROLLERS (EXPORTS) ===
   ========================================================================== */

/**
 * POST /api/ai/ask
 * Receives a user question and the current workspace, then queries
 * the Gemini API with full ledger context.
 */
export const askAI = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { question, persona, workspaceId } = req.body;

    // 1. Authentication and input validation
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

    // 2. Resolve the persona (default to coach if missing/invalid)
    const personaKey =
      persona && PERSONA_INSTRUCTIONS[persona]
        ? persona
        : "coach";
    const systemInstruction = PERSONA_INSTRUCTIONS[personaKey];

    // 3. Fetch and compute workspace metrics for the full month
    const { workspace, metrics, user } =
      await fetchAndCalculateWorkspaceMetrics(workspaceId, userId, "month");

    // 4. Build the AI prompt
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

    // 5. Call Gemini API
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

    // Safely extract the AI reply
    const aiText = extractAiText(result);
    res.status(200).json({ response: aiText });
  } catch (error: unknown) {
    console.error("AI Ask Controller Error:", error);
    // Never leak internal details
    res.status(500).json({ error: "An unexpected error occurred while processing your request." });
  }
};

/**
 * POST /api/ai/greeting
 * Generates a warm, creative greeting based on the user's persona.
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

TASK: Write a highly creative, unique, warm, and deeply impressive greeting for ${user.name} that is guaranteed to light up their day and bring a smile to their face.

STIPULATIONS:
1. Under absolutely no circumstances should you ever mention account balances, income, expenses, transactions, or financial figures.
2. If you are the 'Savage Roaster', be witty, incredibly funny, and affectionately tease them about their energy or life today.
3. If you are the 'Supportive Coach', be highly motivating, inspirational, and tell them why they are amazing.
4. If you are the 'Forensic Detective', state a playful, dramatic "observation" about their morning or day.
5. If you are the 'Silent Accountant', be elegantly calm, encouraging, and highly practical.
6. Write a maximum of 2 sentences.
7. CRITICAL: Absolutely never output a dollar sign ($) anywhere in your response text.
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
      // Fallback greeting if AI fails
      res.status(200).json({
        user: { name: user.name, aiPersona: personaKey },
        greeting: `Aari Meri Jaan, ${user.name}! Ready to look at your budgets? Pick a duration scope down below.`,
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
 * Generates a financial analysis report for the selected scope
 * and locks the cooldown button for that scope (cooldown saving disabled).
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

    // Validate the scope parameter
    const validScopes: TimelineScope[] = ["today", "week", "month"];
    if (!validScopes.includes(scope)) {
      res.status(400).json({ error: "Invalid scope. Allowed: today, week, month." });
      return;
    }

    // Fetch metrics for the given scope
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
Give ${user.name} a brief, actionable, and persona-aligned analysis report of their workspace data.
You are checking their metrics over a '${scope}' timeframe block (${metrics.dateRangeText}).

Live Metric Ledger Values inside this duration:
- Safe To Spend Amount: PKR ${metrics.safeToSpend.toFixed(2)}
- Income: PKR ${metrics.totalIncome.toFixed(2)}
- Total Workspace Expenses: PKR ${metrics.totalExpenses.toFixed(2)}
- Flexible Spending Rows: PKR ${metrics.flexibleExpenses.toFixed(2)}
- Constant Fixed Costs: PKR ${metrics.fixedExpenses.toFixed(2)}

Please write 3 tight sentences analyzing this specifically for their '${scope}' performance. If 'savage_roaster', tease them about where their PKR went. If 'coach', tell them how to safe-keep their safe-to-spend!
CRITICAL: Keep your output entirely clear of dollar signs ($). Use 'PKR' or simple plain quotation formatting blocks.
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

    // Attempt to save cooldown – currently a no-op because fields don't exist in the DB
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
    // result is expected to be an object with candidates[0].content.parts[0].text
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