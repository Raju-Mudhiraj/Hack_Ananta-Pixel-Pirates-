import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  DailyEntry,
  MenuItem,
  PredictionResult,
  OptimizationMode
} from "../types";

/* ============================
   API KEY
============================ */
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing Gemini API Key");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

/* ============================
   IMAGE ANALYSIS (DISABLED)
   Gemini free tier = text only
============================ */
export const identifyFoodAndWaste = async (imageBase64: string, menu: MenuItem[]) => {
  return {
    confidence: 0.9,
    reasoning: "Image analysis disabled on free tier",
    qualitativeInsight: "Use portion-based estimation",
    menuItemId: menu[0]?.id,
    wasteEstimate: 20 // Default 20% waste estimate
  };
};

/* ============================
   DEMAND PREDICTION (WORKING)
============================ */
export const getWastePredictions = async (
  history: DailyEntry[],
  menu: MenuItem[],
  tomorrowDate: string,
  tomorrowPreOrders: Record<string, number>,
  mode: OptimizationMode = "NORMAL"
): Promise<PredictionResult[]> => {
  const prompt = `
Context: You are the AI core of SmartCanteen, a Zero-Waste dining system.
Objective: Predict demand for ${tomorrowDate} to minimize food waste.
Current Mode: ${mode} (Optimization intensity)

Menu Data:
${JSON.stringify(menu.map(m => ({ id: m.id, name: m.name, base: m.baseQuantity, carbon: m.carbonGrams })))}

Historical Performance (Last 10 Shifts):
${JSON.stringify(history.slice(-10).map(h => ({ item: h.menuItemId, prep: h.prepared, cons: h.consumed, waste: h.waste })))}

Current Confirmed Orders (Portion Breakdown):
${JSON.stringify(tomorrowPreOrders)}

Instructions:
1. Analyze the 'waste' and 'consumed' trends for each item.
2. Consider the 'Current Mode' (${mode}):
   - NORMAL: Standard optimization.
   - EXAM: Increase comfort food (Main, Desserts) by 15-20%.
   - FEST: Increase all quantities by 40-50%.
3. Account for pre-orders as a guaranteed minimum.
4. Return a JSON array of objects match this TypeScript interface:
interface PredictionResult {
  menuItemId: string;
  name: string;
  predictedQuantity: number;
  portionDistribution: { small: number; regular: number; large: number; };
  confidenceScore: number;
  reasoning: string;
  carbonImpactSaved: number;
}

IMPORTANT: Return ONLY the JSON array. Do not include markdown formatting or extra text.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.warn("AI Prediction failed, using Smart Fallback:", error);

    return menu.map((item) => {
      // 1. Calculate historical average for this specific item
      const itemHistory = history.filter(h => h.menuItemId === item.id);
      const avgConsumed = itemHistory.length > 0
        ? itemHistory.reduce((sum, h) => sum + h.consumed, 0) / itemHistory.length
        : item.baseQuantity;

      const avgWaste = itemHistory.length > 0
        ? itemHistory.reduce((sum, h) => sum + h.waste, 0) / itemHistory.length
        : 0;

      // 2. Add current pre-orders (handling composite keys)
      const currentOrders = Object.entries(tomorrowPreOrders).reduce((acc, [key, qty]) => {
        return key.startsWith(`${item.id}:`) || key === item.id ? acc + qty : acc;
      }, 0);

      // 3. Mode modifiers
      let modeFactor = 1.0;
      if (mode === "EXAM") modeFactor = 1.25;
      if (mode === "FEST") modeFactor = 1.6;

      // 4. Calculate prediction (weighted towards pre-orders + historical buffer)
      // Buffer is reduced if historical waste was high
      const wasteBuffer = Math.max(5, avgWaste * 0.5);
      const predictedQuantity = Math.max(currentOrders, Math.round((avgConsumed + wasteBuffer) * modeFactor));

      return {
        menuItemId: item.id,
        name: item.name,
        predictedQuantity,
        portionDistribution: {
          small: Math.round(predictedQuantity * 0.25),
          regular: Math.round(predictedQuantity * 0.55),
          large: Math.round(predictedQuantity * 0.2)
        },
        confidenceScore: itemHistory.length > 5 ? 0.92 : 0.78,
        reasoning: `Smart Fallback: Based on ${itemHistory.length} historical logs and confirmed orders. ${mode} mode adjustment applied.`,
        carbonImpactSaved: Math.round(predictedQuantity * 0.15 * (item.carbonGrams / 100))
      };
    });
  }
};

/* ============================
   STRATEGY ANALYSIS
============================ */
export const getWasteAnalysis = async (
  history: DailyEntry[]
): Promise<string> => {
  const result = await model.generateContent(
    `Give weekly canteen optimization strategy using this data:\n${JSON.stringify(history)}`
  );
  return result.response.text();
};

/* ============================
   LEFTOVER ALCHEMIST (NEW)
============================ */
export const generateSurpriseDish = async (leftovers: MenuItem[]): Promise<Partial<MenuItem>> => {
  const prompt = `
    Context: You are a creative Master Chef at SmartCanteen focused on zero waste.
    Objective: Create one NEW exciting "Surprise Dish" combining these leftovers:
    ${leftovers.map(l => `- ${l.name}`).join('\n')}

    Rules:
    1. The name must be catchy and sound fresh (not like leftovers).
    2. The description should explain the creative fusion.
    3. Return ONLY a JSON object.

    Format:
    {
      "name": "Catchy Name",
      "description": "Creative description",
      "calories": number,
      "allergens": ["allergen1", "allergen2"],
      "ingredients": ["item1", "item2"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Alchemist failed:", error);
    return {
      name: "Chef's Daily Surprise Fusion",
      description: "A masterfully balanced bowl combining today's premium surplus ingredients into a final, limited-edition zero-waste feast.",
      calories: 550,
      allergens: ["See Staff"],
      ingredients: leftovers.map(l => l.name)
    };
  }
};
