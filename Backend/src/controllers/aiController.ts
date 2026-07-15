// Backend/src/controllers/aiController.ts

import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../db"; // CONNECTED: Hooks straight into your Neon Cloud database instance

/* ==========================================================================
   === SECTION 1: GLOBAL CONSTANTS, TYPES & API SETTINGS ===================
   ========================================================================== */
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

type TimelineScope = "today" | "week" | "month";

// Companion Personas mapped precisely to onboarding properties
// FIX APPLIED: Injected absolute restrictions against generating accidental dollar signs ($) or western labels before metrics.
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
   === SECTION 2: HELPER UTILITIES ===
   ========================================================================== */
function buildPrompt(question: string, data: any): string {
  const { income, expenses, topCategory, budgets, currency = "PKR" } = data;
  const savings = income - expenses;

  const budgetText = Array.isArray(budgets) && budgets.length > 0
    ? budgets.map((b: any) => 
        `- ${b.categoryName}: Budget ${b.limitAmount} ${currency} | Spent ${b.spentAmount} ${currency} | ${b.spentAmount > b.limitAmount ? `Overspent by ${(b.spentAmount - b.limitAmount).toFixed(0)} ${currency}` : "On track"}`
      ).join("\n")
    : "No active budgets.";

  return `
Here is the user's financial data for this month (all amounts in ${currency}):
- Total Income: ${Number(income || 0).toFixed(2)} ${currency}
- Total Expenses: ${Number(expenses || 0).toFixed(2)} ${currency}
- Savings: ${Number(savings || 0).toFixed(2)} ${currency} (${income > 0 ? ((savings / income) * 100).toFixed(1) : 0}% of income)
- Top Expense Category: ${topCategory || "None"}

Budgets:
${budgetText}

The user asks: "${question}"
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

// 1. Ask AI Controller
export const askAI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { question, persona, data } = req.body;

    if (!userId) {
       res.status(401).json({ error: "Unauthorized access token missing." });
       return;
    }

    if (!question || !persona || !data || !PERSONA_INSTRUCTIONS[persona as keyof typeof PERSONA_INSTRUCTIONS]) {
       res.status(400).json({ error: "Invalid or missing required fields." });
       return;
    }

    const prompt = buildPrompt(question, data);
    const systemInstruction = PERSONA_INSTRUCTIONS[persona as keyof typeof PERSONA_INSTRUCTIONS];
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
  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ error: "Internal server error connecting to AI." });
  }
};

// 2. Companion Greeting Controller (Saves/Reads real state logs!)
export const getAiCompanionGreeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { currentMetrics } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Access denied. Active session token missing." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

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

    const apiKey = getApiKey();

    const statsPrompt = `
      You are addressing the user ${user.name}. Here is their live balance context right now:
      - Safe to Spend: PKR ${Number(currentMetrics?.safeToSpend || 0).toFixed(2)}
      - Income: PKR ${Number(currentMetrics?.totalIncome || 0).toFixed(2)}
      - Expenses: PKR ${Number(currentMetrics?.totalExpenses || 0).toFixed(2)}
      Please create a 2 to 3 sentence maximum greeting matching your persona instructions. Be punchy, conversational, and direct! CRITICAL: Absolutely never output a dollar sign ($) anywhere in your response text.
    `;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { 
          parts: [{ text: selectedPersona.instruction }] 
        },
        contents: [
          { parts: [{ text: statsPrompt }] }
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
    const generatedGreeting = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Welcome back! Ready to analyze your records today?";

    res.status(200).json({
      user: { name: user.name, aiPersona: userPersonaKey },
      greeting: generatedGreeting.trim(),
      cooldowns: locksState
    });

  } catch (error) {
    console.error("Companion Greeting Error:", error);
    res.status(500).json({ error: "Internal server processing AI greeting context." });
  }
};

// 3. Execution & Cooldown Button Lock Controller
export const executeAiCompanionAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { scope, workspaceMetrics, workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Access denied. Active session token missing." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ error: "User profile not registered." });
      return;
    }

    const userPersonaKey = (user as any).aiPersona || "supportive_coach";
    const selectedPersona = COMPANION_PERSONAS[userPersonaKey as keyof typeof COMPANION_PERSONAS] || COMPANION_PERSONAS.supportive_coach;
    const apiKey = getApiKey();

    const analysisPrompt = `
      Give ${user.name} a brief, actionable, and persona-aligned analysis report of their workspace data.
      You are checking their metrics over a '${scope}' timeframe block.
      
      Live Metric Ledger Values:
      - Safe To Spend Amount: PKR ${Number(workspaceMetrics?.safeToSpend || 0).toFixed(2)}
      - Income: PKR ${Number(workspaceMetrics?.totalIncome || 0).toFixed(2)}
      - Total Workspace Expenses: PKR ${Number(workspaceMetrics?.totalExpenses || 0).toFixed(2)}
      - Flexible Spending Rows: PKR ${Number(workspaceMetrics?.flexibleExpenses || 0).toFixed(2)}
      - Constant Fixed Costs: PKR ${Number(workspaceMetrics?.fixedExpenses || 0).toFixed(2)}

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

  } catch (error) {
    console.error("Execute Analysis Companion failure:", error);
    res.status(500).json({ error: "Internal server analysis error." });
  }
};
/* === SECTION 3 END === */