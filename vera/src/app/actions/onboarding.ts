"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Types
export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "cut" | "bulk" | "maintain";

export interface OnboardingData {
    age: number;
    height: number; // in cm
    weight: number; // in kg
    gender: Gender;
    activity: ActivityLevel;
    goal: Goal;
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
    };
}

// Activity multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // Light exercise 1-3 days/week
    moderate: 1.55, // Moderate exercise 3-5 days/week
    active: 1.725, // Hard exercise 6-7 days/week
    very_active: 1.9, // Very hard exercise, physical job
};

// Goal-based calorie adjustments
const GOAL_ADJUSTMENTS: Record<Goal, number> = {
    cut: -500, // Deficit for weight loss
    bulk: 300, // Surplus for muscle gain
    maintain: 0, // Maintenance
};

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 * Men: BMR = 10W + 6.25H - 5A + 5
 * Women: BMR = 10W + 6.25H - 5A - 161
 * W = weight in kg, H = height in cm, A = age in years
 */
function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
    const baseBMR = 10 * weight + 6.25 * height - 5 * age;
    return gender === "male" ? baseBMR + 5 : baseBMR - 161;
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
function calculateTDEE(bmr: number, activity: ActivityLevel): number {
    return bmr * ACTIVITY_MULTIPLIERS[activity];
}

/**
 * Calculate macronutrient targets
 * Protein: 2.0g per kg body weight (higher for Indian diet focus)
 * Fat: 25% of total calories
 * Carbs: Remaining calories
 */
function calculateMacros(targetCalories: number, weight: number) {
    // Protein: 2g per kg of body weight
    const proteinGrams = Math.round(weight * 2.0);
    const proteinCalories = proteinGrams * 4;

    // Fat: 25% of total calories (9 cal per gram)
    const fatCalories = targetCalories * 0.25;
    const fatGrams = Math.round(fatCalories / 9);

    // Carbs: Remaining calories (4 cal per gram)
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbGrams = Math.round(carbCalories / 4);

    return {
        protein: proteinGrams,
        carbs: carbGrams,
        fat: fatGrams,
    };
}

/**
 * Main onboarding server action
 * Calculates targets and saves profile to Supabase
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

        // Initialize Supabase client
        const supabase = await createClient();

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "You must be signed in to complete onboarding" };
        }

        // Calculate BMR and TDEE
        const bmr = calculateBMR(data.weight, data.height, data.age, data.gender);
        const tdee = calculateTDEE(bmr, data.activity);

        // Apply goal adjustment
        const targetCalories = Math.round(tdee + GOAL_ADJUSTMENTS[data.goal]);

        // Calculate macros
        const macros = calculateMacros(targetCalories, data.weight);

        // Prepare profile data
        const profileData = {
            user_id: user.id,
            age: data.age,
            height: data.height,
            weight: data.weight,
            gender: data.gender,
            activity_level: data.activity,
            goal: data.goal,
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            target_calories: targetCalories,
            target_protein: macros.protein,
            target_carbs: macros.carbs,
            target_fat: macros.fat,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
        };

        // Upsert profile (insert or update if exists)
        const { error: upsertError } = await supabase
            .from("profiles")
            .upsert(profileData, { onConflict: "user_id" });

        if (upsertError) {
            console.error("Profile upsert error:", upsertError);
            return { success: false, error: "Failed to save profile. Please try again." };
        }

        // Revalidate cached paths
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
            // No profile found is not an error - user needs onboarding
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
