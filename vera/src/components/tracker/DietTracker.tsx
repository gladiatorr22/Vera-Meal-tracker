"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, addMonths, addYears, addWeeks, startOfWeek, endOfWeek } from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Check,
    Utensils,
    Coffee,
    Sun,
    Moon,
    Trash2,
    Edit2,
    CalendarDays,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressOverview } from "./ProgressOverview";
import { NutrientGrid } from "./NutrientGrid";
import { getTrackerData, getProgressByPeriod, type MealLog, type ProgressStats, type DailyTargets } from "@/app/actions/tracker";
import type { DailyStats } from "@/app/actions/dashboard";

// Types
type MealSlot = "Breakfast" | "Lunch" | "Snacks" | "Dinner";
type ViewMode = "daily" | "progress";
type PeriodFilter = "week" | "month" | "year";

interface MealEntry {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    isEaten: boolean;
    eatenAt?: string;
}

interface DayLog {
    date: string;
    meals: Record<MealSlot, MealEntry[]>;
}

const MEAL_ICONS: Record<MealSlot, React.ElementType> = {
    Breakfast: Coffee,
    Lunch: Sun,
    Snacks: Utensils,
    Dinner: Moon,
};

// Helper to convert DB logs to UI format
function convertLogsToMeals(logs: MealLog[]): Record<MealSlot, MealEntry[]> {
    const meals: Record<MealSlot, MealEntry[]> = {
        Breakfast: [],
        Lunch: [],
        Snacks: [],
        Dinner: [],
    };

    logs.forEach(log => {
        const slotMap: Record<string, MealSlot> = {
            breakfast: "Breakfast",
            lunch: "Lunch",
            snack: "Snacks",
            dinner: "Dinner",
        };
        const slot = slotMap[log.meal_type] || "Snacks";

        meals[slot].push({
            id: log.id,
            name: log.meal_name,
            calories: log.calories,
            protein: log.protein,
            carbs: log.carbs,
            fats: log.fats,
            isEaten: true,
            eatenAt: format(new Date(log.logged_at), "HH:mm"),
        });
    });

    return meals;
}

export function DietTracker() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>("daily");
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("week");
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Data states
    const [currentLog, setCurrentLog] = useState<DayLog>({
        date: format(new Date(), "yyyy-MM-dd"),
        meals: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] }
    });

    const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
    const [dailyTargets, setDailyTargets] = useState<DailyTargets | null>(null);
    const [rawData, setRawData] = useState<MealLog[]>([]);

    // Fetch daily tracker data
    const fetchDailyData = useCallback(async (date: Date) => {
        setIsLoading(true);
        const result = await getTrackerData(format(date, "yyyy-MM-dd"));
        if (result.success && result.data) {
            setRawData(result.data.logs);
            setDailyTargets(result.data.targets);
            setCurrentLog({
                date: format(date, "yyyy-MM-dd"),
                meals: convertLogsToMeals(result.data.logs),
            });
        }
        setIsLoading(false);
    }, []);

    // Fetch progress data
    const fetchProgressData = useCallback(async (period: PeriodFilter, date: Date) => {
        setIsLoading(true);
        const result = await getProgressByPeriod(period, format(date, "yyyy-MM-dd"));
        if (result.success && result.data) {
            setProgressStats(result.data);
        }
        setIsLoading(false);
    }, []);

    // Initial load and date change
    useEffect(() => {
        if (viewMode === "daily") {
            fetchDailyData(selectedDate);
        } else {
            fetchProgressData(periodFilter, selectedDate);
        }
    }, [selectedDate, viewMode, periodFilter, fetchDailyData, fetchProgressData]);

    const handleDateChange = (amount: number) => {
        if (viewMode === "daily") {
            setSelectedDate(prev => addDays(prev, amount));
        } else {
            switch (periodFilter) {
                case "week":
                    setSelectedDate(prev => addWeeks(prev, amount));
                    break;
                case "month":
                    setSelectedDate(prev => addMonths(prev, amount));
                    break;
                case "year":
                    setSelectedDate(prev => addYears(prev, amount));
                    break;
            }
        }
    };

    const handleFilterSelect = (filter: PeriodFilter) => {
        setPeriodFilter(filter);
        setViewMode("progress");
        setShowFilterMenu(false);
    };

    const toggleEaten = (slot: MealSlot, id: string, checked: boolean) => {
        setCurrentLog(prev => {
            const updatedMeals = prev.meals[slot].map(meal => {
                if (meal.id === id) {
                    return {
                        ...meal,
                        isEaten: checked,
                        eatenAt: checked ? format(new Date(), "HH:mm") : undefined
                    };
                }
                return meal;
            });
            return { ...prev, meals: { ...prev.meals, [slot]: updatedMeals } };
        });
    };

    // Format header date based on view
    const getHeaderDate = () => {
        if (viewMode === "daily") return { main: format(selectedDate, "EEEE"), sub: format(selectedDate, "MMMM d, yyyy") };
        switch (periodFilter) {
            case "week":
                const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
                const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
                return { main: "Weekly Overview", sub: `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}` };
            case "month":
                return { main: format(selectedDate, "MMMM"), sub: format(selectedDate, "yyyy") };
            case "year":
                return { main: format(selectedDate, "yyyy"), sub: "Annual Overview" };
        }
    };

    const header = getHeaderDate();

    // Calculate aggregated stats for NutrientGrid
    const dailyStatsMock: DailyStats | null = dailyTargets ? {
        consumed: {
            calories: rawData.reduce((acc, l) => acc + (l.calories || 0), 0),
            protein: rawData.reduce((acc, l) => acc + (l.protein || 0), 0),
            carbs: rawData.reduce((acc, l) => acc + (l.carbs || 0), 0),
            fats: rawData.reduce((acc, l) => acc + (l.fats || 0), 0),
            fiber: rawData.reduce((acc, l) => acc + (l.fiber || 0), 0),
            water: rawData.reduce((acc, l) => acc + (l.meal_type === 'water' ? l.calories : 0), 0) // Placeholder logic
        },
        targets: dailyTargets,
        streak: 0
    } : null;

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-32">

            {/* Header with Calendar Filter */}
            <div className="flex items-center justify-between glass-card p-4 relative z-40">
                <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="text-center flex-1">
                    <h2 className="text-xl font-serif">{header.main}</h2>
                    <p className="text-sm text-white/40">{header.sub}</p>
                </div>

                {/* Calendar Filter Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className={`p-2 rounded-full transition-colors ${showFilterMenu || viewMode === "progress" ? "bg-terracotta/20 text-terracotta" : "hover:bg-white/5"}`}
                    >
                        <CalendarDays className="w-5 h-5" />
                    </button>

                    {/* Filter Dropdown */}
                    <AnimatePresence>
                        {showFilterMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 top-12 z-50 w-48 p-2 border border-white/10 shadow-xl backdrop-blur-2xl rounded-xl bg-zinc-900"
                            >
                                <p className="text-xs text-white/40 px-3 py-2 uppercase tracking-widest">Track Progress</p>
                                {(["week", "month", "year"] as PeriodFilter[]).map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => handleFilterSelect(filter)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${periodFilter === filter && viewMode === "progress"
                                            ? "bg-terracotta/20 text-terracotta"
                                            : "hover:bg-white/5"
                                            }`}
                                    >
                                        By {filter}
                                    </button>
                                ))}
                                <hr className="border-white/5 my-2" />
                                <button
                                    onClick={() => { setViewMode("daily"); setShowFilterMenu(false); }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5"
                                >
                                    Daily View
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* View Mode Tabs (Optional - Hidden when filter active) */}
            {viewMode === "progress" && (
                <div className="flex justify-center">
                    <button onClick={() => setViewMode("daily")} className="text-xs text-terracotta hover:underline">
                        Return to Daily Log
                    </button>
                </div>
            )}

            {/* Nutrient Grid (Only in Daily View) */}
            {viewMode === "daily" && (
                <div className="mb-6">
                    <NutrientGrid stats={dailyStatsMock} />
                </div>
            )}

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {viewMode === "progress" ? (
                    <motion.div
                        key="progress"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <ProgressOverview stats={progressStats} isLoading={isLoading} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="daily"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        {/* Loading State */}
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="glass-card h-32 animate-pulse bg-white/5" />
                                ))}
                            </div>
                        ) : (
                            /* Meal Slots */
                            (Object.keys(currentLog.meals) as MealSlot[]).map((slot) => {
                                const Icon = MEAL_ICONS[slot];
                                const meals = currentLog.meals[slot];
                                const totalCals = meals.reduce((acc, m) => acc + m.calories, 0);

                                return (
                                    <motion.div
                                        key={slot}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass-card overflow-hidden"
                                    >
                                        {/* Slot Header */}
                                        <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                    <Icon className="w-5 h-5 text-terracotta" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">{slot}</h3>
                                                    <p className="text-xs text-white/40">{totalCals} kcal logged</p>
                                                </div>
                                            </div>
                                            <button
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-terracotta/10 text-terracotta hover:bg-terracotta/20 transition-colors text-xs font-medium"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Add
                                            </button>
                                        </div>

                                        {/* Meals List */}
                                        <div className="p-2">
                                            {meals.length === 0 ? (
                                                <div className="text-center py-8 text-white/20 text-sm">
                                                    No meals logged yet.
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {meals.map((meal) => (
                                                        <div key={meal.id} className="group relative flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                                            {/* Checkbox */}
                                                            <div className="relative flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={meal.isEaten}
                                                                    onChange={(e) => toggleEaten(slot, meal.id, e.target.checked)}
                                                                    className="peer w-5 h-5 rounded border-white/20 bg-black/40 checked:bg-terracotta checked:border-terracotta transition-colors cursor-pointer appearance-none border"
                                                                />
                                                                <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-black pointer-events-none opacity-0 peer-checked:opacity-100" />
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <h4 className={`font-medium truncate ${meal.isEaten ? "text-white/40 line-through" : ""}`}>
                                                                        {meal.name}
                                                                    </h4>
                                                                    <span className="text-sm font-medium text-white/60 ml-2">{meal.calories}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                                                                    <span>{meal.protein}g P</span>
                                                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                                                    <span>{meal.carbs}g C</span>
                                                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                                                    <span>{meal.fats}g F</span>
                                                                </div>
                                                            </div>

                                                            {/* Time */}
                                                            {meal.isEaten && meal.eatenAt && (
                                                                <span className="text-xs text-terracotta font-medium">{meal.eatenAt}</span>
                                                            )}

                                                            {/* Actions */}
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                                <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                                                                    <Edit2 className="w-3 h-3" />
                                                                </button>
                                                                <button className="p-2 rounded-lg hover:bg-destructive/10 text-white/40 hover:text-destructive transition-colors">
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
