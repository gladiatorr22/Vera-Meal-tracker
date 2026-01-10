"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
    analyzeWithFallback,
    fileToBase64,
    type NutritionResult,
    type AIProvider,
} from "@/lib/ai/client";
import {
    generateTextHash,
    generateImageHash,
    generateCombinedHash,
    getCachedResult,
    saveToCach,
    cachedToNutrition,
} from "@/lib/ai/cache";

// ============================================================
// SMART SAVER: AI Analysis with Caching
// ============================================================
// 1. Generate hash from input (text/image)
// 2. Check cache first → instant response, 0 API cost
// 3. On cache miss → call AI → save result to cache
// ============================================================

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface AnalyzeFoodInput {
    imageFile?: File;
    imageUrl?: string;
    text?: string;
    audioTranscript?: string;
    mealType?: MealType;
    saveToLog?: boolean;
    skipCache?: boolean; // Force fresh AI analysis
}

export interface AnalyzeFoodResult {
    success: boolean;
    error?: string;
    data?: NutritionResult;
    provider?: AIProvider;
    fromCache?: boolean;
    logId?: string;
}

/**
 * Analyze food with Smart Saver caching
 */
export async function analyzeFood(input: AnalyzeFoodInput): Promise<AnalyzeFoodResult> {
    try {
        // Validate input
        if (!input.imageFile && !input.imageUrl && !input.text && !input.audioTranscript) {
            return { success: false, error: "Please provide an image, text, or voice description" };
        }

        // Build query text for hash
        const queryText = [input.text, input.audioTranscript].filter(Boolean).join(" ").trim();

        // Generate hash for cache lookup
        let queryHash: string;
        let queryType: "text" | "image" | "combined";

        if (input.imageFile && queryText) {
            queryHash = await generateCombinedHash(queryText, input.imageFile);
            queryType = "combined";
        } else if (input.imageFile) {
            queryHash = await generateImageHash(input.imageFile);
            queryType = "image";
        } else {
            queryHash = generateTextHash(queryText);
            queryType = "text";
        }

        // Check cache first (unless skipCache is true)
        if (!input.skipCache) {
            console.log("🔍 Checking cache for:", queryHash.slice(0, 8));
            const cached = await getCachedResult(queryHash);

            if (cached) {
                console.log("✨ Cache HIT! Returning cached result");
                const nutritionData = cachedToNutrition(cached);

                // Optionally save to log
                let logId: string | undefined;
                if (input.saveToLog) {
                    const saveResult = await saveFoodLog(nutritionData, input);
                    if (saveResult.success) logId = saveResult.logId;
                }

                return {
                    success: true,
                    data: nutritionData,
                    provider: cached.aiProvider as AIProvider,
                    fromCache: true,
                    logId,
                };
            }
            console.log("💨 Cache MISS, calling AI...");
        }

        // Build text prompt for AI
        let textPrompt = "";
        if (input.mealType) textPrompt += `Context: This is a ${input.mealType} meal.\n`;
        if (input.text) textPrompt += `Food description: ${input.text}\n`;
        if (input.audioTranscript) textPrompt += `Voice description: ${input.audioTranscript}\n`;
        if (!textPrompt && input.imageFile) {
            textPrompt = "Analyze this food image and provide nutritional information.";
        }

        // Prepare image if provided
        let imageBase64: string | undefined;
        let imageMimeType: string | undefined;

        if (input.imageFile) {
            imageBase64 = await fileToBase64(input.imageFile);
            imageMimeType = input.imageFile.type || "image/jpeg";
        }

        // Call AI with fallback
        const result = await analyzeWithFallback(textPrompt, imageBase64, imageMimeType);

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "Failed to analyze food",
                provider: result.provider,
            };
        }

        // Validate response
        if (!result.data.name || typeof result.data.calories !== "number") {
            return { success: false, error: "Invalid nutritional data received" };
        }

        // Save to cache for future use
        await saveToCach(
            queryHash,
            queryType,
            queryText || result.data.name,
            result.data,
            result.provider!
        );

        // Optionally save to log
        let logId: string | undefined;
        if (input.saveToLog) {
            const saveResult = await saveFoodLog(result.data, input);
            if (saveResult.success) logId = saveResult.logId;
        }

        return {
            success: true,
            data: result.data,
            provider: result.provider,
            fromCache: false,
            logId,
        };
    } catch (error) {
        console.error("Food analysis error:", error);
        return { success: false, error: "Failed to analyze food. Please try again." };
    }
}

/**
 * Save analyzed food to database
 */
async function saveFoodLog(
    nutrition: NutritionResult,
    input: AnalyzeFoodInput
): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "You must be signed in to log food" };
        }

        // Upload image if provided
        let imagePath: string | null = null;
        if (input.imageFile) {
            const fileExt = input.imageFile.name.split(".").pop() || "jpg";
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("food-images")
                .upload(fileName, input.imageFile);

            if (!uploadError) imagePath = fileName;
        }

        // Insert food log
        const { data, error } = await supabase
            .from("food_logs")
            .insert({
                user_id: user.id,
                meal_name: nutrition.name,
                meal_type: input.mealType || null,
                image_path: imagePath,
                note: input.text || input.audioTranscript || null,
                calories: nutrition.calories,
                protein: nutrition.protein,
                carbs: nutrition.carbs,
                fats: nutrition.fats,
                fiber: nutrition.fiber,
                is_ai_processed: true,
                logged_at: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (error) {
            console.error("Failed to save food log:", error);
            return { success: false, error: "Failed to save to log" };
        }

        revalidatePath("/dashboard");
        return { success: true, logId: data.id };
    } catch (error) {
        console.error("Save food log error:", error);
        return { success: false, error: "Failed to save food log" };
    }
}

/**
 * Quick analyze - no database save
 */
export async function quickAnalyzeFood(text: string): Promise<AnalyzeFoodResult> {
    return analyzeFood({ text, saveToLog: false });
}
