"use server";

import { createClient } from "@/lib/supabase/server";

export type DailyStats = {
    consumed: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
    targets: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
    streak: number;
};

export async function getDashboardData(): Promise<{ success: boolean; data?: DailyStats; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // 1. Fetch Profile Targets
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("target_calories, target_protein, target_carbs, target_fat")
            .eq("user_id", user.id)
            .single();

        if (profileError || !profile) {
            return { success: false, error: "Profile not found" };
        }

        // 2. Fetch Today's Logs
        // Get start and end of today in user's potential timezone (simplifying to UTC day for now or server time)
        // Ideally user timezone should be stored, but defaulting to server date match for MVP
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data: logs, error: logsError } = await supabase
            .from("food_logs")
            .select("calories, protein, carbs, fats")
            .eq("user_id", user.id)
            .gte("logged_at", todayStart.toISOString())
            .lte("logged_at", todayEnd.toISOString());

        if (logsError) {
            console.error("Error fetching logs:", logsError);
            return { success: false, error: "Failed to fetch logs" };
        }

        // 3. Aggregate Logs
        const consumed = logs.reduce(
            (acc, log) => ({
                calories: acc.calories + (log.calories || 0),
                protein: acc.protein + (log.protein || 0),
                carbs: acc.carbs + (log.carbs || 0),
                fats: acc.fats + (log.fats || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        // 4. Calculate Streak (Mock logic for MVP - real logic would query distinct dates)
        // For now, defaulting to 1 if they logged today, else 0, or just hardcoded 0 until streak table exists
        const streak = logs.length > 0 ? 1 : 0;

        return {
            success: true,
            data: {
                consumed,
                targets: {
                    calories: profile.target_calories || 2000,
                    protein: profile.target_protein || 150,
                    carbs: profile.target_carbs || 250,
                    fats: profile.target_fat || 70,
                },
                streak
            },
        };
    } catch (error) {
        console.error("Server error:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
