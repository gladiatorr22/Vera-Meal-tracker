"use server";

import { createClient } from "@/lib/supabase/server";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";

export type MealLog = {
    id: string;
    meal_name: string;
    meal_type: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    logged_at: string;
};

export type DailyTargets = {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    water: number;
};

export type TrackerDataResult = {
    logs: MealLog[];
    targets: DailyTargets;
};

export type ProgressStats = {
    totalCalories: number;
    avgCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
    daysLogged: number;
    period: string;
    history: { date: string; calories: number; protein: number; carbs: number; fats: number }[];
};

// Fetch meals for a specific date
export async function getTrackerData(date: string): Promise<{ success: boolean; data?: TrackerDataResult; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Unauthorized" };

        const targetDate = new Date(date);
        const dayStart = startOfDay(targetDate).toISOString();
        const dayEnd = endOfDay(targetDate).toISOString();

        // Parallel fetch: Logs + Profile Targets
        const [logsRes, profileRes] = await Promise.all([
            supabase
                .from("food_logs")
                .select("id, meal_name, meal_type, calories, protein, carbs, fats, fiber, logged_at")
                .eq("user_id", user.id)
                .gte("logged_at", dayStart)
                .lte("logged_at", dayEnd)
                .order("logged_at", { ascending: true }),
            supabase
                .from("profiles")
                .select("target_calories, target_protein, target_carbs, target_fat")
                .eq("user_id", user.id)
                .single()
        ]);

        if (logsRes.error) {
            console.error("Tracker logs error:", logsRes.error);
            return { success: false, error: "Failed to fetch tracker data" };
        }

        // Default targets if profile missing or fields empty
        const targets: DailyTargets = {
            calories: profileRes.data?.target_calories || 2000,
            protein: profileRes.data?.target_protein || 150,
            carbs: profileRes.data?.target_carbs || 250,
            fats: profileRes.data?.target_fat || 70,
            fiber: 30, // Hardcoded for now
            water: 2500, // Hardcoded in ml
        };

        return { success: true, data: { logs: logsRes.data || [], targets } };
    } catch (err) {
        console.error("Server error:", err);
        return { success: false, error: "Internal Server Error" };
    }
}

// Get aggregated progress for a period
export async function getProgressByPeriod(
    period: "week" | "month" | "year",
    referenceDate?: string
): Promise<{ success: boolean; data?: ProgressStats; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Unauthorized" };

        const refDate = referenceDate ? new Date(referenceDate) : new Date();

        let periodStart: Date;
        let periodEnd: Date;
        let periodLabel: string;

        switch (period) {
            case "week":
                const day = refDate.getDay();
                const diff = refDate.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
                periodStart = new Date(refDate.setDate(diff));
                periodStart.setHours(0, 0, 0, 0);
                periodEnd = new Date(periodStart);
                periodEnd.setDate(periodStart.getDate() + 6);
                periodEnd.setHours(23, 59, 59, 999);
                periodLabel = `Week of ${format(periodStart, "MMM d")}`;
                break;
            case "month":
                periodStart = startOfMonth(refDate);
                periodEnd = endOfMonth(refDate);
                periodLabel = format(refDate, "MMMM yyyy");
                break;
            case "year":
                periodStart = startOfYear(refDate);
                periodEnd = endOfYear(refDate);
                periodLabel = format(refDate, "yyyy");
                break;
        }

        const { data: logs, error } = await supabase
            .from("food_logs")
            .select("calories, protein, carbs, fats, logged_at")
            .eq("user_id", user.id)
            .gte("logged_at", periodStart.toISOString())
            .lte("logged_at", periodEnd.toISOString());

        if (error) {
            console.error("Progress fetch error:", error);
            return { success: false, error: "Failed to fetch progress data" };
        }

        const uniqueDays = new Set(logs?.map(log => format(new Date(log.logged_at), "yyyy-MM-dd")) || []);
        const daysLogged = uniqueDays.size;

        const totals = (logs || []).reduce(
            (acc, log) => ({
                calories: acc.calories + (log.calories || 0),
                protein: acc.protein + (log.protein || 0),
                carbs: acc.carbs + (log.carbs || 0),
                fats: acc.fats + (log.fats || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        const historyMap = new Map<string, { calories: number; protein: number; carbs: number; fats: number }>();

        // Initialize based on period
        if (period === "week" || period === "month") {
            // Fill all days
            let current = new Date(periodStart);
            while (current <= periodEnd) {
                historyMap.set(format(current, "yyyy-MM-dd"), { calories: 0, protein: 0, carbs: 0, fats: 0 });
                current.setDate(current.getDate() + 1);
            }
        } else if (period === "year") {
            // Fill all months
            for (let i = 0; i < 12; i++) {
                const monthDate = new Date(refDate.getFullYear(), i, 1);
                historyMap.set(format(monthDate, "yyyy-MM"), { calories: 0, protein: 0, carbs: 0, fats: 0 });
            }
        }

        // Aggregate logs into history
        (logs || []).forEach(log => {
            const dateKey = period === "year"
                ? format(new Date(log.logged_at), "yyyy-MM")
                : format(new Date(log.logged_at), "yyyy-MM-dd");

            const current = historyMap.get(dateKey) || { calories: 0, protein: 0, carbs: 0, fats: 0 };
            historyMap.set(dateKey, {
                calories: current.calories + (log.calories || 0),
                protein: current.protein + (log.protein || 0),
                carbs: current.carbs + (log.carbs || 0),
                fats: current.fats + (log.fats || 0),
            });
        });

        return {
            success: true,
            data: {
                totalCalories: totals.calories,
                avgCalories: daysLogged > 0 ? Math.round(totals.calories / daysLogged) : 0,
                totalProtein: totals.protein,
                totalCarbs: totals.carbs,
                totalFats: totals.fats,
                daysLogged,
                period: periodLabel,
                history: Array.from(historyMap.entries()).map(([date, stats]) => ({ date, ...stats })),
            },
        };
    } catch (err) {
        console.error("Server error:", err);
        return { success: false, error: "Internal Server Error" };
    }
}
