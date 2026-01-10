"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================
// Enhanced Onboarding Types
// ============================================================

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "cut" | "bulk" | "maintain";
export type DietType = "vegetarian" | "non_vegetarian" | "eggetarian" | "vegan";
export type Cuisine = "north_indian" | "south_indian" | "gujarati" | "bengali" | "maharashtrian" | "mixed";

export interface OnboardingData {
    // Basic info
    age: number;
    height: number; // cm
    weight: number; // kg
    gender: Gender;
    activity: ActivityLevel;
    goal: Goal;

    // NEW: Diet preferences
    dietType: DietType;
    gymFrequency: number; // 0-7 days per week
    allergies: string[];
    preferredCuisine: Cuisine;
}

export interface OnboardingResult {
    success: boolean;
    error?: string;
    data?: {
        bmr: number;
        tdee: number;
        target_calories: number;
        target_protein: number;
        target_carbs: number;
        target_fat: number;
        target_fiber: number;
        target_water: number;
    };
}

// Activity multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
};

// Goal-based calorie adjustments
const GOAL_ADJUSTMENTS: Record<Goal, number> = {
    cut: -500,
    bulk: 300,
    maintain: 0,
};

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 */
function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
    const baseBMR = 10 * weight + 6.25 * height - 5 * age;
    return gender === "male" ? baseBMR + 5 : baseBMR - 161;
}

/**
 * Calculate TDEE with gym frequency adjustment
 */
function calculateTDEE(bmr: number, activity: ActivityLevel, gymFrequency: number): number {
    // Base TDEE from activity level
    let tdee = bmr * ACTIVITY_MULTIPLIERS[activity];

    // Add extra for gym sessions (approx 200-300 cal per session, averaged over week)
    if (gymFrequency > 0) {
        const dailyGymBonus = (gymFrequency * 250) / 7;
        tdee += dailyGymBonus;
    }

    return tdee;
}

/**
 * Calculate macronutrient targets based on goal and diet type
 */
function calculateMacros(
    targetCalories: number,
    weight: number,
    goal: Goal,
    dietType: DietType
) {
    // Protein: Higher for gymgoers and bulking
    let proteinMultiplier = 1.8; // Base: 1.8g per kg
    if (goal === "bulk") proteinMultiplier = 2.2;
    if (goal === "cut") proteinMultiplier = 2.0; // Preserve muscle during cut
    if (dietType === "vegetarian" || dietType === "vegan") {
        proteinMultiplier += 0.2; // Slightly higher to account for incomplete proteins
    }

    const proteinGrams = Math.round(weight * proteinMultiplier);
    const proteinCalories = proteinGrams * 4;

    // Fat: 25-30% of calories (higher for keto-friendly, lower for carb-heavy)
    const fatPercent = goal === "bulk" ? 0.25 : 0.28;
    const fatCalories = targetCalories * fatPercent;
    const fatGrams = Math.round(fatCalories / 9);

    // Carbs: Remaining calories
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbGrams = Math.round(Math.max(0, carbCalories) / 4);

    // Fiber: 14g per 1000 cal (adjusted for Indian high-fiber diet)
    const fiberGrams = Math.round((targetCalories / 1000) * 14);

    // Water: 30-35ml per kg body weight
    const waterLiters = Math.round((weight * 0.033) * 10) / 10;

    return {
        protein: proteinGrams,
        carbs: carbGrams,
        fat: fatGrams,
        fiber: Math.max(fiberGrams, 25), // Minimum 25g
        water: Math.max(waterLiters, 2.0), // Minimum 2L
    };
}

/**
 * Main onboarding server action
 */
export async function saveOnboardingProfile(
    data: OnboardingData
): Promise<OnboardingResult> {
    try {
        // Validate inputs
        if (data.age < 13 || data.age > 120) {
            return { success: false, error: "Age must be between 13 and 120" };
        }
        if (data.height < 100 || data.height > 250) {
            return { success: false, error: "Height must be between 100 and 250 cm" };
        }
        if (data.weight < 30 || data.weight > 300) {
            return { success: false, error: "Weight must be between 30 and 300 kg" };
        }

        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "You must be signed in to complete onboarding" };
        }

        // Calculate BMR and TDEE (with gym adjustment)
        const bmr = calculateBMR(data.weight, data.height, data.age, data.gender);
        const tdee = calculateTDEE(bmr, data.activity, data.gymFrequency);

        // Apply goal adjustment
        const targetCalories = Math.round(tdee + GOAL_ADJUSTMENTS[data.goal]);

        // Calculate macros (considers diet type)
        const macros = calculateMacros(targetCalories, data.weight, data.goal, data.dietType);

        // Prepare profile data
        const profileData = {
            user_id: user.id,
            age: data.age,
            height: data.height,
            weight: data.weight,
            gender: data.gender,
            activity_level: data.activity,
            goal: data.goal,
            // NEW fields
            diet_type: data.dietType,
            gym_frequency: data.gymFrequency,
            allergies: data.allergies,
            preferred_cuisine: data.preferredCuisine,
            // Calculated targets
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            target_calories: targetCalories,
            target_protein: macros.protein,
            target_carbs: macros.carbs,
            target_fat: macros.fat,
            target_fiber: macros.fiber,
            target_water: macros.water,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
        };

        // Upsert profile
        const { error: upsertError } = await supabase
            .from("profiles")
            .upsert(profileData, { onConflict: "user_id" });

        if (upsertError) {
            console.error("Profile upsert error:", upsertError);
            return { success: false, error: "Failed to save profile. Please try again." };
        }

        revalidatePath("/dashboard");
        revalidatePath("/onboarding");

        return {
            success: true,
            data: {
                bmr: Math.round(bmr),
                tdee: Math.round(tdee),
                target_calories: targetCalories,
                target_protein: macros.protein,
                target_carbs: macros.carbs,
                target_fat: macros.fat,
                target_fiber: macros.fiber,
                target_water: macros.water,
            },
        };
    } catch (error) {
        console.error("Onboarding error:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}

/**
 * Get user's profile
 */
export async function getUserProfile() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return { success: true, data: null };
            }
            return { success: false, error: error.message };
        }

        return { success: true, data: profile };
    } catch (error) {
        console.error("Get profile error:", error);
        return { success: false, error: "Failed to fetch profile" };
    }
}
