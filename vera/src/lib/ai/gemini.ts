import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Safety settings for food-related content
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

// Gemini 2.0 Flash for fast, cost-effective processing
export const geminiFlash = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    safetySettings,
    generationConfig: {
        temperature: 0.3, // Lower for more consistent nutritional data
        topP: 0.8,
        maxOutputTokens: 2048,
    },
});

// ============================================================
// UNIQUE FEATURE: "Meal Intelligence" System
// ============================================================
// Unlike basic calorie counters, Vera understands:
// 1. Regional Indian cuisines (dal makhani vs dal tadka)
// 2. Portion context from visual cues
// 3. Cooking method impact on nutrition
// 4. "Health Score" with personalized tips
// ============================================================

export type MealHealthScore = "excellent" | "good" | "moderate" | "indulgent";

export interface NutritionResult {
    // Core nutritional data
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;

    // UNIQUE: Detailed breakdown
    portionSize: "small" | "medium" | "large";
    portionGrams: number;

    // UNIQUE: Health intelligence
    healthScore: MealHealthScore;
    healthTip: string;

    // UNIQUE: Cooking & regional context
    cookingMethod?: string;
    cuisineType?: string;

    // Confidence & metadata
    confidence: "high" | "medium" | "low";
    alternativeNames?: string[];
}

export interface FoodSuggestion {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    portionDescription: string;
    healthScore: MealHealthScore;
}

// System prompt optimized for Indian food intelligence
export const FOOD_ANALYSIS_PROMPT = `You are Vera's Food Intelligence AI, specialized in analyzing meals with a focus on Indian cuisine.

TASK: Analyze the provided food image or description and return DETAILED nutritional information.

UNIQUE CAPABILITIES:
1. REGIONAL UNDERSTANDING: Recognize regional Indian dishes (South Indian, North Indian, Gujarati, Bengali, etc.)
2. COOKING METHOD AWARENESS: Identify if food is fried, grilled, steamed, etc. and adjust calories accordingly
3. PORTION ESTIMATION: Estimate portion size from visual cues or description
4. HEALTH SCORING: Rate the meal's healthiness with actionable tips

RESPONSE FORMAT (STRICT JSON):
{
  "name": "Full dish name (e.g., 'Butter Chicken with Naan')",
  "calories": 650,
  "protein": 35,
  "carbs": 45,
  "fats": 38,
  "fiber": 3,
  "portionSize": "medium",
  "portionGrams": 350,
  "healthScore": "indulgent",
  "healthTip": "Try with whole wheat roti instead of naan to add fiber and reduce refined carbs",
  "cookingMethod": "curry with cream",
  "cuisineType": "North Indian (Punjabi)",
  "confidence": "high",
  "alternativeNames": ["Murgh Makhani"]
}

HEALTH SCORE CRITERIA:
- "excellent": High protein, fiber, low added sugars, minimal processing (e.g., grilled chicken salad)
- "good": Balanced macros, moderate processing (e.g., dal rice, roti sabzi)
- "moderate": Some nutritional concerns but acceptable (e.g., biryani, pasta)
- "indulgent": High in fats/sugars, best as occasional treat (e.g., butter chicken, desserts)

IMPORTANT:
- All values should be realistic for a single serving
- Be specific with dish names (not just "rice" but "Jeera Rice" or "Basmati Rice")
- Health tips should be actionable and culturally relevant
- Return ONLY valid JSON, no markdown or extra text`;

export const FOOD_SEARCH_PROMPT = `You are Vera's Food Intelligence AI. Given a partial food query, suggest relevant food items with nutritional estimates.

TASK: Return 5 food suggestions matching the query, prioritizing:
1. Indian foods when query suggests it
2. Common variations (grilled vs fried)
3. Popular dishes first

RESPONSE FORMAT (STRICT JSON ARRAY):
[
  {
    "name": "Grilled Chicken Breast",
    "calories": 165,
    "protein": 31,
    "carbs": 0,
    "fats": 4,
    "fiber": 0,
    "portionDescription": "100g serving",
    "healthScore": "excellent"
  }
]

IMPORTANT:
- Return exactly 5 suggestions
- Include both healthy and indulgent options when applicable
- Be specific with names (include cooking method when relevant)
- Return ONLY valid JSON array, no markdown`;

// Helper to convert File/Blob to base64 (Node.js compatible)
export async function fileToBase64(file: File | Blob): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
}

// Parse JSON from AI response (handles markdown code blocks)
export function parseAIResponse<T>(text: string): T | null {
    try {
        // Remove markdown code blocks if present
        let cleaned = text.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.slice(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.slice(0, -3);
        }
        return JSON.parse(cleaned.trim()) as T;
    } catch (error) {
        console.error("Failed to parse AI response:", error);
        console.error("Raw response:", text);
        return null;
    }
}
