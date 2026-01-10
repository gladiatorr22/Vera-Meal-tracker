"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================
// Save Food Logs Server Action
// ============================================================
// Saves multiple food items from the MealEditor to the database
// Each item becomes a separate row in food_logs for better tracking
// ============================================================

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodItemPayload {
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
}

export interface SaveFoodLogsInput {
    items: FoodItemPayload[];
    mealType: MealType;
    loggedAt: string;
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
    };
}

export interface SaveFoodLogsResult {
    success: boolean;
    error?: string;
    savedCount?: number;
}

/**
 * Save multiple food items to the food_logs table
 * Each item is saved as a separate row for granular tracking
 */
export async function saveFoodLogs(input: SaveFoodLogsInput): Promise<SaveFoodLogsResult> {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "You must be signed in to log food" };
        }

        // Validate input
        if (!input.items || input.items.length === 0) {
            return { success: false, error: "No food items to save" };
        }

        // Prepare rows for batch insert
        const rows = input.items.map((item) => ({
            user_id: user.id,
            meal_name: item.name,
            meal_type: input.mealType,
            note: item.portion, // Store portion in note field
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fats,
            fiber: item.fiber,
            is_ai_processed: true,
            logged_at: input.loggedAt,
        }));

        // Batch insert all items
        const { data, error } = await supabase
            .from("food_logs")
            .insert(rows)
            .select("id");

        if (error) {
            console.error("Failed to save food logs:", error);
            return { success: false, error: "Failed to save meal. Please try again." };
        }

        // Revalidate dashboard to reflect new data
        revalidatePath("/dashboard");

        return {
            success: true,
            savedCount: data?.length || 0,
        };
    } catch (error) {
        console.error("Save food logs error:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}

/**
 * Delete a food log entry
 */
export async function deleteFoodLog(logId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error } = await supabase
            .from("food_logs")
            .delete()
            .eq("id", logId)
            .eq("user_id", user.id); // Security: ensure user owns this log

        if (error) {
            console.error("Delete error:", error);
            return { success: false, error: "Failed to delete" };
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Delete food log error:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}

/**
 * Update a food log entry
 */
export async function updateFoodLog(
    logId: string,
    updates: Partial<FoodItemPayload>
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        const updateData: Record<string, unknown> = {};
        if (updates.name) updateData.meal_name = updates.name;
        if (updates.portion) updateData.note = updates.portion;
        if (typeof updates.calories === "number") updateData.calories = updates.calories;
        if (typeof updates.protein === "number") updateData.protein = updates.protein;
        if (typeof updates.carbs === "number") updateData.carbs = updates.carbs;
        if (typeof updates.fats === "number") updateData.fats = updates.fats;
        if (typeof updates.fiber === "number") updateData.fiber = updates.fiber;

        const { error } = await supabase
            .from("food_logs")
            .update(updateData)
            .eq("id", logId)
            .eq("user_id", user.id);

        if (error) {
            console.error("Update error:", error);
            return { success: false, error: "Failed to update" };
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Update food log error:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}
