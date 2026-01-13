"use client";

import { motion } from "framer-motion";
import { TrendingUp, Flame, Zap, Droplet } from "lucide-react";
import type { ProgressStats } from "@/app/actions/tracker";
import { format, parseISO } from "date-fns";

interface ProgressOverviewProps {
    stats: ProgressStats | null;
    isLoading: boolean;
}

export function ProgressOverview({ stats, isLoading }: ProgressOverviewProps) {
    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card p-4 h-24 bg-black/5" />
                    ))}
                </div>
                {/* Grid Skeleton */}
                <div className="grid grid-cols-7 gap-2">
                    {[...Array(14)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-lg bg-black/5" />
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12 text-neutral-400 glass-card">
                No data available for this period.
            </div>
        );
    }

    const statCards = [
        {
            label: "Total Calories",
            value: stats.totalCalories.toLocaleString(),
            unit: "kcal",
            icon: Flame,
            color: "text-black",
            bg: "bg-gray-100",
        },
        {
            label: "Total Protein",
            value: stats.totalProtein.toLocaleString(),
            unit: "g",
            icon: Zap,
            color: "text-blue-600",
            bg: "bg-blue-100",
        },
        {
            label: "Total Carbs",
            value: stats.totalCarbs.toLocaleString(),
            unit: "g",
            icon: TrendingUp,
            color: "text-sky-600",
            bg: "bg-sky-100",
        },
        {
            label: "Total Fats",
            value: stats.totalFats.toLocaleString(),
            unit: "g",
            icon: Droplet,
            color: "text-indigo-600",
            bg: "bg-indigo-100",
        },
    ];

    // Detect period type based on history length and label
    const isYearView = stats.history.length === 12 && stats.period.match(/^\d{4}$/);
    const isWeekView = stats.history.length === 7;
    // Otherwise Month (variable days)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`glass-card p-4 relative overflow-hidden`}
                        >
                            <div className={`absolute top-2 right-2 w-8 h-8 rounded-full ${card.bg} flex items-center justify-center`}>
                                <Icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                            <p className="text-xs text-neutral-400 mb-1">{card.label}</p>
                            <p className="text-2xl font-serif text-black">{card.value}</p>
                            <p className="text-xs text-neutral-400">{card.unit}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* History Grid */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-medium text-lg text-black">{stats.period} Breakdown</h3>
                    <div className="flex gap-4 text-xs text-neutral-400">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-black rounded-full" /> Avg Cals</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full" /> Protein</div>
                    </div>
                </div>

                <div className={`grid gap-3 ${isYearView ? "grid-cols-3 md:grid-cols-4" :
                    isWeekView ? "grid-cols-7" :
                        "grid-cols-7" // Month view also 7 cols
                    }`}>
                    {stats.history.map((day, i) => {
                        const dateObj = isYearView
                            ? parseISO(`${day.date}-01`) // format yyyy-MM 
                            : parseISO(day.date);

                        const label = isYearView
                            ? format(dateObj, "MMM")
                            : format(dateObj, "d");

                        const subLabel = isYearView
                            ? ""
                            : format(dateObj, "EEE");

                        // Intensity color for background based on calories (simple heatmap logic)
                        const opacity = Math.min(day.calories / 3000, 1) * 0.2; // Max 20% opacity
                        const hasData = day.calories > 0;

                        return (
                            <motion.div
                                key={day.date}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className={`
                                    relative flex flex-col items-center justify-center p-2 rounded-xl border transition-colors
                                    ${hasData ? "border-black/5" : "border-black/5 bg-black/[0.02]"}
                                    ${isYearView ? "aspect-[4/3]" : "aspect-[3/4]"}
                                `}
                            >
                                {/* Heatmap Background */}
                                {hasData && (
                                    <div
                                        className="absolute inset-0 bg-neutral-200 rounded-xl"
                                        style={{ opacity }}
                                    />
                                )}

                                <span className="text-xs text-neutral-400 mb-1 z-10">{subLabel}</span>
                                <span className={`font-serif z-10 text-black ${isYearView ? "text-lg" : "text-xl"}`}>{label}</span>

                                {hasData ? (
                                    <div className="mt-2 text-[10px] text-center z-10 space-y-0.5">
                                        <div className="text-neutral-900 font-medium">{day.calories}</div>
                                        <div className="text-blue-600">{day.protein}g P</div>
                                    </div>
                                ) : (
                                    <div className="mt-2 w-1 h-1 rounded-full bg-black/10 z-10" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
