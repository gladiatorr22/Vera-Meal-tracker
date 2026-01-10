import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import type { NutritionResult, AIProvider } from "./client";

// ============================================================
// SMART SAVER: Food Analysis Cache
// ============================================================
// Reduce API costs by caching previously analyzed foods
// - Text queries: hash normalized text
// - Images: hash first 1KB + file size
// - Cache hit = 0 API cost, instant response
// ============================================================

export interface CachedFood {
    id: string;
    queryHash: string;
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    portionSize?: string;
    portionGrams?: number;
    healthScore?: string;
    healthTip?: string;
    cookingMethod?: string;
    cuisineType?: string;
    aiProvider?: string;
    hitCount: number;
}

/**
 * Generate a hash for text queries
 * Normalizes text (lowercase, trim, remove extra spaces)
 */
export function generateTextHash(text: string): string {
    const normalized = text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[^\w\s]/g, ""); // Remove punctuation

    return createHash("md5").update(`text:${normalized}`).digest("hex");
}

/**
 * Generate a hash for images
 * Uses first 2KB of image data + file size for speed
 */
export async function generateImageHash(file: File | Blob): Promise<string> {
    const slice = file.slice(0, 2048); // First 2KB
    const buffer = await slice.arrayBuffer();
    const data = Buffer.from(buffer);

    // Combine partial content + size for unique hash
    const combined = `image:${file.size}:${data.toString("base64")}`;
    return createHash("md5").update(combined).digest("hex");
}

/**
 * Generate combined hash for text + image
 */
export async function generateCombinedHash(
    text: string,
    imageFile?: File | Blob
): Promise<string> {
    const textHash = generateTextHash(text);

    if (imageFile) {
        const imageHash = await generateImageHash(imageFile);
        return createHash("md5").update(`${textHash}:${imageHash}`).digest("hex");
    }

    return textHash;
}

/**
 * Look up cached result by hash
 */
export async function getCachedResult(queryHash: string): Promise<CachedFood | null> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("food_cache")
            .select("*")
            .eq("query_hash", queryHash)
            .single();

        if (error || !data) {
            return null;
        }

        // Update hit count and last_used_at
        await supabase
            .from("food_cache")
            .update({
                hit_count: (data.hit_count || 0) + 1,
                last_used_at: new Date().toISOString(),
            })
            .eq("id", data.id);

        return {
            id: data.id,
            queryHash: data.query_hash,
            foodName: data.food_name,
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fats: data.fats,
            fiber: data.fiber || 0,
            portionSize: data.portion_size,
            portionGrams: data.portion_grams,
            healthScore: data.health_score,
            healthTip: data.health_tip,
            cookingMethod: data.cooking_method,
            cuisineType: data.cuisine_type,
            aiProvider: data.ai_provider,
            hitCount: data.hit_count,
        };
    } catch (error) {
        console.error("Cache lookup error:", error);
        return null;
    }
}

/**
 * Save AI result to cache
 */
export async function saveToCach(
    queryHash: string,
    queryType: "text" | "image" | "combined",
    queryText: string,
    result: NutritionResult,
    provider: AIProvider
): Promise<boolean> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.from("food_cache").upsert(
            {
                query_hash: queryHash,
                query_type: queryType,
                query_text: queryText.slice(0, 500), // Limit text length
                food_name: result.name,
                calories: result.calories,
                protein: result.protein,
                carbs: result.carbs,
                fats: result.fats,
                fiber: result.fiber || 0,
                portion_size: result.portionSize,
                portion_grams: result.portionGrams,
                health_score: result.healthScore,
                health_tip: result.healthTip,
                cooking_method: result.cookingMethod,
                cuisine_type: result.cuisineType,
                ai_provider: provider,
                hit_count: 1,
                last_used_at: new Date().toISOString(),
            },
            {
                onConflict: "query_hash",
            }
        );

        if (error) {
            console.error("Cache save error:", error);
            return false;
        }

        console.log("✅ Saved to cache:", queryHash.slice(0, 8));
        return true;
    } catch (error) {
        console.error("Cache save error:", error);
        return false;
    }
}

/**
 * Convert cached food to NutritionResult
 */
export function cachedToNutrition(cached: CachedFood): NutritionResult {
    return {
        name: cached.foodName,
        calories: cached.calories,
        protein: cached.protein,
        carbs: cached.carbs,
        fats: cached.fats,
        fiber: cached.fiber,
        portionSize: (cached.portionSize as "small" | "medium" | "large") || "medium",
        portionGrams: cached.portionGrams || 100,
        healthScore: (cached.healthScore as "excellent" | "good" | "moderate" | "indulgent") || "good",
        healthTip: cached.healthTip || "",
        cookingMethod: cached.cookingMethod,
        cuisineType: cached.cuisineType,
        confidence: "high", // Cached results are trusted
    };
}

/**
 * Find similar cached foods by fuzzy text match
 * Useful for search suggestions
 */
export async function findSimilarCached(query: string, limit = 5): Promise<CachedFood[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("food_cache")
            .select("*")
            .textSearch("query_text", query, { type: "websearch" })
            .order("hit_count", { ascending: false })
            .limit(limit);

        if (error || !data) {
            return [];
        }

        return data.map((row) => ({
            id: row.id,
            queryHash: row.query_hash,
            foodName: row.food_name,
            calories: row.calories,
            protein: row.protein,
            carbs: row.carbs,
            fats: row.fats,
            fiber: row.fiber || 0,
            portionSize: row.portion_size,
            portionGrams: row.portion_grams,
            healthScore: row.health_score,
            healthTip: row.health_tip,
            cookingMethod: row.cooking_method,
            cuisineType: row.cuisine_type,
            aiProvider: row.ai_provider,
            hitCount: row.hit_count,
        }));
    } catch (error) {
        console.error("Similar search error:", error);
        return [];
    }
}
