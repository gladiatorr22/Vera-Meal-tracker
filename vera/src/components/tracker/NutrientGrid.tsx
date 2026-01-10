"use client";

import { motion } from "framer-motion";
import { Droplets, Wheat, Leaf, Candy, Activity, Flame, Zap, Droplet } from "lucide-react";
import type { DailyStats } from "@/app/actions/dashboard";

interface NutrientGridProps {
    stats: DailyStats | null;
}

export function NutrientGrid({ stats }: NutrientGridProps) {
    const Nutrients = [
        {
            label: "Calories",
            icon: Flame,
            value: stats?.consumed.calories || 0,
            target: stats?.targets.calories || 2000,
            unit: "kcal",
            color: "text-terracotta",
            bg: "bg-terracotta/10",
        },
        {
            label: "Protein",
            icon: Zap,
            value: stats?.consumed.protein || 0,
            target: stats?.targets.protein || 150,
            unit: "g",
            color: "text-cream",
            bg: "bg-cream/10",
        },
        {
            label: "Carbs",
            icon: Wheat,
            value: stats?.consumed.carbs || 0,
            target: stats?.targets.carbs || 250,
            unit: "g",
            color: "text-blue-400",
            bg: "bg-blue-400/10",
        },
        {
            label: "Fats",
            icon: Droplet,
            value: stats?.consumed.fats || 0,
            target: stats?.targets.fats || 70,
            unit: "g",
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
        },
        {
            label: "Fiber",
            icon: Leaf,
            value: stats?.consumed.fiber || 0,
            target: 30,
            unit: "g",
            color: "text-green-400",
            bg: "bg-green-400/10",
        },
        {
            label: "Water",
            icon: Droplets,
            value: (stats?.consumed.water || 0) / 1000, // Convert ml to L? Or glasses?
            target: 2.5, // Liters target
            unit: "L",
            color: "text-cyan-400",
            bg: "bg-cyan-400/10",
        },
        // Placeholders for future data
        {
            label: "Sugar",
            icon: Candy,
            value: 0,
            target: 50,
            unit: "g",
            color: "text-pink-400",
            bg: "bg-pink-400/10",
            isPlaceholder: true,
        },
        {
            label: "Sodium",
            icon: Activity,
            value: 0,
            target: 2300,
            unit: "mg",
            color: "text-zinc-400",
            bg: "bg-zinc-400/10",
            isPlaceholder: true,
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Nutrients.map((item, index) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`glass-card p-4 flex flex-col items-center justify-center text-center group ${item.isPlaceholder ? "opacity-50 grayscale" : ""}`}
                >
                    <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="text-2xl font-serif font-medium mb-1">
                        {item.value}
                        <span className="text-xs font-sans text-white/40 ml-1">{item.unit}</span>
                    </div>
                    <div className="text-xs uppercase tracking-widest text-white/40 mb-2">{item.label}</div>

                    {!item.isPlaceholder && (
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((item.value / item.target) * 100, 100)}%` }}
                                className={`h-full ${item.color.replace("text-", "bg-")}`}
                            />
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
