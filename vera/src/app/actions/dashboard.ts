"use server";

import { createClient } from "@/lib/supabase/server";

export type DailyStats = {
    consumed: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
        water: number;
    };
    targets: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
        water: number;
    };
    streak: number;
    water_log?: number; // Current water intake
};

export type FoodLogItem = {
    id: string;
    meal_type: string;
    name: string; // mapped from meal_name
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    portion: string; // mapped from note
    logged_at: string;
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
            .select("calories, protein, carbs, fats, fiber")
            .eq("user_id", user.id)
            .gte("logged_at", todayStart.toISOString())
            .lte("logged_at", todayEnd.toISOString());

        if (logsError) {
            console.error("Error fetching logs:", logsError);
            return { success: false, error: "Failed to fetch logs" };
        }

        // 3. Aggregate Logs
        const initialStats: DailyStats["consumed"] = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            fiber: 0,
            water: 0
        };

        const consumed = (logs || []).reduce(
            (acc: DailyStats["consumed"], log: any) => ({
                calories: acc.calories + (log.calories || 0),
                protein: acc.protein + (log.protein || 0),
                carbs: acc.carbs + (log.carbs || 0),
                fats: acc.fats + (log.fats || 0),
                fiber: acc.fiber + (log.fiber || 0),
                water: acc.water + (0), // Water not yet in DB, default 0
            }),
            initialStats
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
                    fiber: 30, // Default target
                    water: 2000, // Default target in ml
                },
                streak
            },
        };
    } catch (error) {
        console.error("Server error:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

export async function getDailyLog(dateStr?: string): Promise<{ success: boolean; data?: FoodLogItem[]; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Unauthorized" };

        // Default to today if no date provided
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: logs, error } = await supabase
            .from("food_logs")
            .select("*")
            .eq("user_id", user.id)
            .gte("logged_at", startOfDay.toISOString())
            .lte("logged_at", endOfDay.toISOString())
            .order("logged_at", { ascending: false });

        if (error) {
            console.error("Fetch daily log error:", error);
            return { success: false, error: "Failed to fetch logs" };
        }

        const mappedLogs: FoodLogItem[] = logs.map(log => ({
            id: log.id,
            meal_type: log.meal_type || "snack",
            name: log.meal_name,
            calories: log.calories,
            protein: log.protein,
            carbs: log.carbs,
            fats: log.fats,
            fiber: log.fiber,
            portion: log.note || "1 serving",
            logged_at: log.logged_at
        }));

        return { success: true, data: mappedLogs };
    } catch (error) {
        console.error("Server error:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
