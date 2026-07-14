// Backend/src/controllers/aiController.ts
import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// 👇 FIXED: Updated to the new Gemini 3.1 Flash-Lite model endpoint
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

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

function buildPrompt(question: string, data: any): string {
  // ✅ FIXED: Get currency from frontend data, fallback to PKR
  const { income, expenses, topCategory, budgets, currency = "PKR" } = data;
  const savings = income - expenses;

  // Safe mapping just in case budgets array is missing or empty
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

export const askAI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { question, persona, data } = req.body;

    if (!userId) {
       res.status(401).json({ error: "Unauthorized." });
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
      const errorText = await response.text();
      console.error("Gemini API Error Raw:", errorText);
      
      let detailedError = "The AI service is temporarily unavailable.";
      try {
        const parsedError = JSON.parse(errorText);
        if (parsedError.error && parsedError.error.message) {
          detailedError = `Google API Rejected: ${parsedError.error.message}`;
        }
      } catch (e) {
        // Fallback
      }

      res.status(500).json({ error: detailedError });
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