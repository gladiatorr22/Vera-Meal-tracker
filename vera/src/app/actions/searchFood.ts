"use server";

import { searchWithFallback, type FoodSuggestion } from "@/lib/ai/client";

// ============================================================
// AI-Powered Smart Search with Fallback
// ============================================================
// Uses Groq Llama (primary) with Gemini fallback
// ============================================================

export interface SearchFoodResult {
    success: boolean;
    error?: string;
    suggestions?: FoodSuggestion[];
}

/**
 * AI-powered food search with smart suggestions
 */
export async function searchFood(query: string): Promise<SearchFoodResult> {
    try {
        if (!query || query.trim().length < 2) {
            return { success: true, suggestions: [] };
        }

        const suggestions = await searchWithFallback(query.trim());

        return {
            success: true,
            suggestions: suggestions.filter((s) => s.name && typeof s.calories === "number"),
        };
    } catch (error) {
        console.error("Food search error:", error);
        return { success: false, error: "Search failed. Please try again." };
    }
}

/**
 * Get meal suggestions based on time of day
 */
export async function getQuickSuggestions(mealType?: string): Promise<SearchFoodResult> {
    const timeContext = mealType || getCurrentMealType();
    const query = `Popular ${timeContext} items in India`;

    try {
        const suggestions = await searchWithFallback(query);
        return { success: true, suggestions: suggestions.slice(0, 5) };
    } catch (error) {
        console.error("Quick suggestions error:", error);
        return { success: true, suggestions: [] };
    }
}

function getCurrentMealType(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "breakfast";
    if (hour >= 11 && hour < 15) return "lunch";
    if (hour >= 15 && hour < 18) return "snack";
    return "dinner";
}
