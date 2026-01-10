import Groq from "groq-sdk";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// ============================================================
// MULTI-AI FALLBACK SYSTEM
// ============================================================
// Primary: Groq Llama 3.2 Vision (fast, free tier generous)
// Fallback: Google Gemini 2.0 Flash (reliable backup)
// ============================================================

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
});

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Gemini safety settings
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Gemini model configuration
const geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    safetySettings,
    generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 2048,
    },
});

// ============================================================
// Types
// ============================================================

export type MealHealthScore = "excellent" | "good" | "moderate" | "indulgent";
export type AIProvider = "groq" | "gemini";

export interface NutritionResult {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    portionSize: "small" | "medium" | "large";
    portionGrams: number;
    healthScore: MealHealthScore;
    healthTip: string;
    cookingMethod?: string;
    cuisineType?: string;
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

export interface AIAnalysisResult {
    success: boolean;
    data?: NutritionResult;
    provider?: AIProvider;
    error?: string;
}

// ============================================================
// Prompts
// ============================================================

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
- "excellent": High protein, fiber, low added sugars, minimal processing
- "good": Balanced macros, moderate processing
- "moderate": Some nutritional concerns but acceptable
- "indulgent": High in fats/sugars, best as occasional treat

IMPORTANT:
- All values should be realistic for a single serving
- Be specific with dish names (not just "rice" but "Jeera Rice")
- Health tips should be actionable and culturally relevant
- Return ONLY valid JSON, no markdown or extra text`;

export const FOOD_SEARCH_PROMPT = `You are Vera's Food Intelligence AI. Given a partial food query, suggest relevant food items with nutritional estimates.

TASK: Return 5 food suggestions matching the query, prioritizing Indian foods when applicable.

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

Return exactly 5 suggestions. Return ONLY valid JSON array, no markdown.`;

// ============================================================
// Helper Functions
// ============================================================

export async function fileToBase64(file: File | Blob): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
}

export function parseAIResponse<T>(text: string): T | null {
    try {
        let cleaned = text.trim();
        if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
        else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
        if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
        return JSON.parse(cleaned.trim()) as T;
    } catch (error) {
        console.error("Failed to parse AI response:", error);
        console.error("Raw response:", text.slice(0, 500));
        return null;
    }
}

// ============================================================
// GROQ API (Primary)
// ============================================================

async function analyzeWithGroq(
    textPrompt: string,
    imageBase64?: string,
    imageMimeType?: string
): Promise<AIAnalysisResult> {
    try {
        // Build messages
        const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

        if (imageBase64 && imageMimeType) {
            // Vision model with image
            messages.push({
                role: "user",
                content: [
                    {
                        type: "text",
                        text: FOOD_ANALYSIS_PROMPT + "\n\n" + textPrompt,
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${imageMimeType};base64,${imageBase64}`,
                        },
                    },
                ],
            });

            const response = await groq.chat.completions.create({
                model: "llama-3.2-90b-vision-preview", // Vision model for images
                messages,
                temperature: 0.3,
                max_tokens: 2048,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) throw new Error("Empty response from Groq");

            const data = parseAIResponse<NutritionResult>(content);
            if (!data) throw new Error("Failed to parse Groq response");

            return { success: true, data, provider: "groq" };
        } else {
            // Text-only model
            messages.push({
                role: "system",
                content: FOOD_ANALYSIS_PROMPT,
            });
            messages.push({
                role: "user",
                content: textPrompt,
            });

            const response = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile", // Fast text model
                messages,
                temperature: 0.3,
                max_tokens: 2048,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) throw new Error("Empty response from Groq");

            const data = parseAIResponse<NutritionResult>(content);
            if (!data) throw new Error("Failed to parse Groq response");

            return { success: true, data, provider: "groq" };
        }
    } catch (error) {
        console.error("Groq API error:", error);
        return { success: false, error: String(error), provider: "groq" };
    }
}

// ============================================================
// GEMINI API (Fallback)
// ============================================================

async function analyzeWithGemini(
    textPrompt: string,
    imageBase64?: string,
    imageMimeType?: string
): Promise<AIAnalysisResult> {
    try {
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

        parts.push({ text: FOOD_ANALYSIS_PROMPT });
        parts.push({ text: "\n\n" + textPrompt });

        if (imageBase64 && imageMimeType) {
            parts.push({
                inlineData: {
                    mimeType: imageMimeType,
                    data: imageBase64,
                },
            });
            parts.push({ text: "\nAnalyze this food image." });
        }

        const result = await geminiModel.generateContent(parts);
        const response = await result.response;
        const content = response.text();

        const data = parseAIResponse<NutritionResult>(content);
        if (!data) throw new Error("Failed to parse Gemini response");

        return { success: true, data, provider: "gemini" };
    } catch (error) {
        console.error("Gemini API error:", error);
        return { success: false, error: String(error), provider: "gemini" };
    }
}

// ============================================================
// UNIFIED ANALYSIS WITH FALLBACK
// ============================================================

export async function analyzeWithFallback(
    textPrompt: string,
    imageBase64?: string,
    imageMimeType?: string
): Promise<AIAnalysisResult> {
    console.log("🚀 Attempting analysis with Groq (primary)...");

    // Try Groq first (primary)
    const groqResult = await analyzeWithGroq(textPrompt, imageBase64, imageMimeType);

    if (groqResult.success) {
        console.log("✅ Groq analysis successful");
        return groqResult;
    }

    console.log("⚠️ Groq failed, falling back to Gemini...");
    console.log("Groq error:", groqResult.error);

    // Fallback to Gemini
    const geminiResult = await analyzeWithGemini(textPrompt, imageBase64, imageMimeType);

    if (geminiResult.success) {
        console.log("✅ Gemini fallback successful");
        return geminiResult;
    }

    console.log("❌ Both AI providers failed");
    return {
        success: false,
        error: `Both AI providers failed. Groq: ${groqResult.error}. Gemini: ${geminiResult.error}`,
    };
}

// ============================================================
// SEARCH WITH FALLBACK
// ============================================================

export async function searchWithFallback(query: string): Promise<FoodSuggestion[]> {
    const prompt = `${FOOD_SEARCH_PROMPT}\n\nUser query: "${query}"\n\nProvide 5 relevant food suggestions.`;

    // Try Groq first
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 1024,
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
            const data = parseAIResponse<FoodSuggestion[]>(content);
            if (data && Array.isArray(data)) return data.slice(0, 5);
        }
    } catch (error) {
        console.log("Groq search failed, trying Gemini...", error);
    }

    // Fallback to Gemini
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const content = response.text();
        const data = parseAIResponse<FoodSuggestion[]>(content);
        if (data && Array.isArray(data)) return data.slice(0, 5);
    } catch (error) {
        console.log("Gemini search also failed", error);
    }

    return [];
}
