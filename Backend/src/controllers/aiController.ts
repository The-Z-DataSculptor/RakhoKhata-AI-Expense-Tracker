// Backend/src/controllers/aiController.ts

import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../db";

/* ==========================================================================
   === SECTION 1: GLOBAL CONSTANTS, TYPES & API SETTINGS ===================
   ========================================================================== */
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

type TimelineScope = "today" | "week" | "month";

const COMPANION_PERSONAS = {
  savage_roaster: {
    title: "Savage Roaster",
    instruction: "You are a witty, extremely blunt Pakistani corporate financial roaster named RakhoKhata AI Buddy. Use friendly, conversational English mixed with mild, funny local Urdu/Pakistani street slang (like 'Aari Meri Jaan', 'Yaar', 'Kharcha', 'Hisaab', 'Daba ke kharch kiya'). Address the user directly by name. Look at their metrics context and give a sharp, hilarious reality check about their expenses, then prompt them to select one of the three scope analysis buttons below. STIPULATION: Never output a dollar sign ($) before strings, numbers, or headers. Output all amounts explicitly as PKR."
  },
  supportive_coach: {
    title: "Supportive Coach",
    instruction: "You are an encouraging, highly supportive money coach. Be incredibly helpful, positive, and motivating. Address the user directly by name. Praise their progress, check their metrics, and gently advise them to select an analytical timeline button below to work toward their financial freedom. STIPULATION: Never output a dollar sign ($) before text or quotation markers under any circumstances. Output currency as PKR."
  },
  forensic_detective: {
    title: "Forensic Detective",
    instruction: "You are an elite, sharp financial Forensic Detective. Be logical, professional, and state your observations like case files. Scan their metrics for leak anomalies, and direct them to choose a timeline analysis button below so you can search for leaks in their ledgers. STIPULATION: Do not output dollar indicators ($). Explicitly print currency labels as PKR."
  },
  silent_accountant: {
    title: "Silent Accountant",
    instruction: "You are a quiet, hyper-analytical Silent Accountant. Keep your analysis entirely focus-driven, mathematical, and practical. Address the user directly, state their metrics simply, and invite them to run calculations by clicking a timeline button below. STIPULATION: Clean out all western currency markers ($). Print only numeric values appended with PKR."
  }
};

const PERSONA_INSTRUCTIONS = {
  auditor: "You are a Strict Financial Auditor. Be direct, honest, and critical. Point out waste clearly. Limit your response to 3-5 sentences.",
  coach: "You are a supportive Money Coach. Be encouraging and helpful. Give practical, actionable advice. Limit your response to 3-5 sentences.",
  minimalist: "You are a Minimalist Advisor. Help the user simplify their spending. Suggest what to cut or reduce. Limit your response to 3-5 sentences.",
};

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in environment variables.");
  return key;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: REUSABLE BACKEND DATA ENGINE (THE 5 PILLARS) ===
   ========================================================================== */

/**
 * Calculates calendar start and end date boundaries
 * based on a system anchor date (2026-07-17 for precision timeline testing)
 */
function getDateRangeForScope(scope: TimelineScope): { startDate: Date; endDate: Date } {
  const currentAnchor = new Date("2026-07-17T12:00:00Z");

  const startDate = new Date(currentAnchor);
  const endDate = new Date(currentAnchor);

  if (scope === "today") {
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);
  } else if (scope === "week") {
    // Last 7 days including today
    startDate.setUTCDate(currentAnchor.getUTCDate() - 6);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);
  } else if (scope === "month") {
    // Current Calendar Month (First day of month to Last day of month)
    startDate.setUTCDate(1);
    startDate.setUTCHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentAnchor);
    nextMonth.setUTCMonth(currentAnchor.getUTCMonth() + 1, 1);
    nextMonth.setUTCHours(0, 0, 0, 0);
    endDate.setTime(nextMonth.getTime() - 1);
  }

  return { startDate, endDate };
}

async function fetchAndCalculateWorkspaceMetrics(workspaceId: string, userId: string, scope: TimelineScope) {
  const { startDate, endDate } = getDateRangeForScope(scope);

  // Query Database Pillars simultaneously using accurate database transaction date-range scopes
  const [workspace, user, transactions, categories, budgets] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.transaction.findMany({ 
      where: { 
        workspaceId,
        date: {
          gte: startDate.toISOString(),
          lte: endDate.toISOString()
        }
      }, 
      include: { category: true },
      orderBy: { date: "desc" }
    }),
    prisma.category.findMany({ where: { workspaceId } }),
    prisma.budget.findMany({ where: { workspaceId }, include: { category: true } })
  ]);

  if (!workspace || workspace.userId !== userId) {
    throw new Error("Unauthorized or invalid workspace context access.");
  }

  const workspaceCurrency = workspace.currency || "PKR";

  // Calculate transaction totals directly
  let totalIncome = 0;
  let totalExpenses = 0;
  let fixedExpenses = 0;
  let flexibleExpenses = 0;

  const categorySpent: Record<string, number> = {};

  // Formats itemized records for prompt builder payload
  const rawTransactionsList = transactions.map((tx) => {
    const amount = Number(tx.originalAmount || 0);
    const catName = tx.category?.name || "Uncategorized";
    const dateFormatted = tx.date ? new Date(tx.date).toISOString().split('T')[0] : "N/A";

    if (tx.type === "INCOME") {
      totalIncome += amount;
    } else if (tx.type === "EXPENSE") {
      totalExpenses += amount;
      categorySpent[catName] = (categorySpent[catName] || 0) + amount;

      // Group Fixed/Recurring vs Flexible
      if (tx.category?.isFixed || tx.category?.isRecurring) {
        fixedExpenses += amount;
      } else {
        flexibleExpenses += amount;
      }
    }

    return {
      date: dateFormatted,
      description: tx.description || "No description",
      type: tx.type,
      category: catName,
      amount: amount
    };
  });

  const safeToSpend = totalIncome - totalExpenses;

  // Find top spending category
  const sortedExpenses = Object.entries(categorySpent).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedExpenses.length > 0 ? sortedExpenses[0][0] : "None";

  // Build budget lists with status updates
  const parsedBudgets = budgets.map((b) => {
    const catName = b.category?.name || "Unknown";
    const limit = Number(b.originalAmount || 0);
    const spent = categorySpent[catName] || 0;
    return {
      categoryName: catName,
      limitAmount: limit,
      spentAmount: spent,
    };
  });

  return {
    user,
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
      dateRangeText: `${startDate.getUTCDate()}/${startDate.getUTCMonth() + 1} to ${endDate.getUTCDate()}/${endDate.getUTCMonth() + 1}`
    }
  };
}

/**
 * Builds an exceptionally clean, detailed, and itemized ledger context
 * so the AI has 100% visibility into where every single PKR was earned or spent.
 */
function buildPrompt(question: string, data: any): string {
  const { income, expenses, topCategory, budgets, currency = "PKR", rawTransactions, workspaceName, userName } = data;
  const savings = income - expenses;

  const budgetText = Array.isArray(budgets) && budgets.length > 0
    ? budgets.map((b: any) => 
        `- ${b.categoryName}: Budget ${Number(b.limitAmount).toFixed(2)} ${currency} | Spent ${Number(b.spentAmount).toFixed(2)} ${currency} | ${b.spentAmount > b.limitAmount ? `Overspent by ${(b.spentAmount - b.limitAmount).toFixed(2)} ${currency}` : "On track"}`
      ).join("\n")
    : "No active budgets registered in this workspace.";

  // Render raw itemized transactions in a highly structured textual table
  const ledgerTable = Array.isArray(rawTransactions) && rawTransactions.length > 0
    ? rawTransactions.map((tx: any) => 
        `  [${tx.date}] | ${tx.type.padEnd(7)} | ${tx.description.padEnd(20)} | ${tx.category.padEnd(15)} | ${Number(tx.amount).toFixed(2)} ${currency}`
      ).join("\n")
    : "  No recorded transactions inside this timeframe scope.";

  return `
--- FINANCIAL CONTEXT SHEET FOR: ${userName.toUpperCase()} ---
Workspace: "${workspaceName}"
System Current Date: July 17, 2026

METRICS SUMMARY:
- Total Income: ${Number(income || 0).toFixed(2)} ${currency}
- Total Expenses: ${Number(expenses || 0).toFixed(2)} ${currency}
- Net Savings: ${Number(savings || 0).toFixed(2)} ${currency} (${income > 0 ? ((savings / income) * 100).toFixed(1) : 0}% of income)
- Top Expense Category: ${topCategory || "None"}

BUDGET SETTINGS:
${budgetText}

ITEMIZED TRANSACTION LEDGER:
Date       | Type    | Description          | Category        | Amount
----------------------------------------------------------------------------------
${ledgerTable}

USER QUERY:
The user has asked: "${question}"

STIPULATIONS:
1. Rely exclusively on the itemized ledger above to list or audit raw transactions.
2. Under absolutely no circumstances should you ever output a dollar sign ($). All currencies must be displayed in PKR.
3. Be incredibly thorough and call out specific dates and transaction descriptions in your answer.
`;
}

function isSameCalendarDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPRESS ROUTE CONTROLLERS ===
   ========================================================================== */

// 1. Ask AI Controller (Now automatically loads state on backend!)
export const askAI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { question, persona, workspaceId } = req.body;

    if (!userId) {
       res.status(401).json({ error: "Unauthorized access token missing." });
       return;
    }

    if (!workspaceId) {
       res.status(400).json({ error: "Invalid or missing required workspace properties." });
       return;
    }

    // 🚀 STEP 1: For open-ended questions, fetch the full "month" context data including itemized listings
    const { workspace, user, metrics } = await fetchAndCalculateWorkspaceMetrics(workspaceId, userId, "month");

    const dataPayload = {
      userName: user?.name || "User",
      workspaceName: workspace?.name || "Workspace",
      income: metrics.totalIncome,
      expenses: metrics.totalExpenses,
      topCategory: metrics.topCategory,
      budgets: metrics.budgets,
      currency: metrics.currency,
      rawTransactions: metrics.rawTransactions // 🚀 FIXED: Itemized array passed cleanly into Prompt Generator
    };

    const prompt = buildPrompt(question, dataPayload);
    const systemInstruction = PERSONA_INSTRUCTIONS[persona as keyof typeof PERSONA_INSTRUCTIONS] || PERSONA_INSTRUCTIONS.coach;
    const apiKey = getApiKey();

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { 
          parts: [{ text: systemInstruction }] 
        },
        contents: [
          { parts: [{ text: prompt }] }
        ],
      }),
    });

    if (!response.ok) {
      res.status(500).json({ error: "The AI service is temporarily unavailable." });
      return;
    }

    const result = await response.json();
    const aiResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

    res.status(200).json({ response: aiResponse });
  } catch (error: any) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ error: error.message || "Internal server error connecting to AI." });
  }
};

// 2. Companion Greeting Controller (Queries database directly)
export const getAiCompanionGreeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Access denied. Active session token missing." });
      return;
    }

    if (!workspaceId) {
      res.status(400).json({ error: "Active workspace ID context is required." });
      return;
    }

    // Get User profile directly to resolve identity and active persona
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: "User profile not registered." });
      return;
    }

    const userPersonaKey = (user as any).aiPersona || "supportive_coach";
    const selectedPersona = COMPANION_PERSONAS[userPersonaKey as keyof typeof COMPANION_PERSONAS] || COMPANION_PERSONAS.supportive_coach;

    const systemDateToday = new Date();
    
    const locksState = {
      today: (user as any).lastTodayAnalysisRun ? isSameCalendarDay(new Date((user as any).lastTodayAnalysisRun), systemDateToday) : false,
      week: (user as any).lastWeekAnalysisRun ? isSameCalendarDay(new Date((user as any).lastWeekAnalysisRun), systemDateToday) : false,
      month: (user as any).lastMonthAnalysisRun ? isSameCalendarDay(new Date((user as any).lastMonthAnalysisRun), systemDateToday) : false
    };

    // Calculate timezone details to make the greeting highly personal and context-aware
    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "evening";

    const apiKey = getApiKey();

    // 🚀 NEW: Re-engineered Creative Prompt focused strictly on emotional energy, persona, and lighting up the user's day
    const creativeGreetingPrompt = `
      You are the personal AI companion for ${user.name}.
      Current time of day is: ${timeOfDay}.
      
      Persona: ${selectedPersona.title}
      
      TASK: Write a highly creative, unique, warm, and deeply impressive greeting for ${user.name} that is guaranteed to light up their day and bring a smile to their face.
      
      STIPULATIONS:
      1. Under absolutely no circumstances should you ever mention account balances, income, expenses, transactions, or financial figures (e.g., do NOT mention PKR 0.00, spending habits, budgets, or ledgers).
      2. If you are the 'Savage Roaster', be witty, incredibly funny, and affectionately tease them about their energy or life today.
      3. If you are the 'Supportive Coach', be highly motivating, inspirational, and tell them why they are amazing.
      4. If you are the 'Forensic Detective', state a playful, dramatic "observation" about their morning or day.
      5. If you are the 'Silent Accountant', be elegantly calm, encouraging, and highly practical.
      6. Write a maximum of 2 sentences.
      7. CRITICAL: Absolutely never output a dollar sign ($) anywhere in your response text.
    `;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { 
          parts: [{ text: selectedPersona.instruction }] 
        },
        contents: [
          { parts: [{ text: creativeGreetingPrompt }] }
        ],
      }),
    });

    if (!response.ok) {
      res.status(200).json({
        user: { name: user.name, aiPersona: userPersonaKey },
        greeting: `Aari Meri Jaan, ${user.name}! Ready to look at your budgets? Pick a duration scope down below.`,
        cooldowns: locksState
      });
      return;
    }

    const result = await response.json();
    const generatedGreeting = result?.candidates?.[0]?.content?.parts?.[0]?.text || `Assalam-o-Alaikum ${user.name}! Ready to take control of your goals today?`;

    res.status(200).json({
      user: { name: user.name, aiPersona: userPersonaKey },
      greeting: generatedGreeting.trim(),
      cooldowns: locksState
    });

  } catch (error: any) {
    console.error("Companion Greeting Error:", error);
    res.status(500).json({ error: error.message || "Internal server processing AI greeting context." });
  }
};

// 3. Execution & Cooldown Button Lock Controller (Queries database directly)
export const executeAiCompanionAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { scope, workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Access denied. Active session token missing." });
      return;
    }

    if (!workspaceId) {
      res.status(400).json({ error: "Active workspace ID context is required." });
      return;
    }

    const { user, metrics } = await fetchAndCalculateWorkspaceMetrics(workspaceId, userId, scope as TimelineScope);

    if (!user) {
      res.status(404).json({ error: "User profile not registered." });
      return;
    }

    const userPersonaKey = (user as any).aiPersona || "supportive_coach";
    const selectedPersona = COMPANION_PERSONAS[userPersonaKey as keyof typeof COMPANION_PERSONAS] || COMPANION_PERSONAS.supportive_coach;
    const apiKey = getApiKey();

    const analysisPrompt = `
      Give ${user.name} a brief, actionable, and persona-aligned analysis report of their workspace data.
      You are checking their metrics over a '${scope}' timeframe block (${metrics.dateRangeText}).
      
      Live Metric Ledger Values inside this duration:
      - Safe To Spend Amount: PKR ${Number(metrics.safeToSpend).toFixed(2)}
      - Income: PKR ${Number(metrics.totalIncome).toFixed(2)}
      - Total Workspace Expenses: PKR ${Number(metrics.totalExpenses).toFixed(2)}
      - Flexible Spending Rows: PKR ${Number(metrics.flexibleExpenses).toFixed(2)}
      - Constant Fixed Costs: PKR ${Number(metrics.fixedExpenses).toFixed(2)}

      Please write 3 tight sentences analyzing this specifically for their '${scope}' performance. If 'savage_roaster', tease them about where their PKR went. If 'coach', tell them how to safe-keep their safe-to-spend!
      CRITICAL: Keep your output entirely clear of dollar signs ($). Use 'PKR' or simple plain quotation formatting blocks.
    `;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { 
          parts: [{ text: selectedPersona.instruction }] 
        },
        contents: [
          { parts: [{ text: analysisPrompt }] }
        ],
      }),
    });

    if (!response.ok) {
      res.status(500).json({ error: "AI analysis endpoint connection failed." });
      return;
    }

    const result = await response.json();
    const generatedReport = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Your analysis is processed. Keep tracking your expenses closely!";

    try {
      const lockFieldMap: Record<TimelineScope, string> = {
        today: "lastTodayAnalysisRun",
        week: "lastWeekAnalysisRun",
        month: "lastMonthAnalysisRun"
      };

      const targetLockField = lockFieldMap[scope as TimelineScope];

      await prisma.user.update({
        where: { id: userId },
        data: {
          [targetLockField]: new Date()
        }
      });
    } catch (dbError) {
      console.warn("Skipping cooldown save loop: Database model fields are missing or unmigrated.");
    }

    res.status(200).json({
      success: true,
      analysisReport: generatedReport.trim()
    });

  } catch (error: any) {
    console.error("Execute Analysis Companion failure:", error);
    res.status(500).json({ error: error.message || "Internal server analysis error." });
  }
};
/* === SECTION 3 END === */