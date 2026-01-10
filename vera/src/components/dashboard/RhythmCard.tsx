"use client";

import { motion } from "framer-motion";
import { type DailyStats } from "@/app/actions/dashboard";

export function RhythmCard({ stats }: { stats: DailyStats | null }) {

    // Calculate percentages safely
    const getProgress = (consumed: number, target: number) =>
        Math.min((consumed / (target || 1)) * 100, 100);

    const proteinProps = { val: stats?.consumed.protein || 0, target: stats?.targets.protein || 150, color: "bg-terracotta" };
    const carbsProps = { val: stats?.consumed.carbs || 0, target: stats?.targets.carbs || 250, color: "bg-cream" };
    const fatProps = { val: stats?.consumed.fats || 0, target: stats?.targets.fats || 70, color: "bg-peach" };

    const proteinPct = getProgress(proteinProps.val, proteinProps.target);
    const carbsPct = getProgress(carbsProps.val, carbsProps.target);
    const fatPct = getProgress(fatProps.val, fatProps.target);

    // Radius for svg rings (circumference calculations) - Scaled down for compact view
    const rProtein = 70, cProtein = 2 * Math.PI * rProtein;
    const rCarbs = 55, cCarbs = 2 * Math.PI * rCarbs;
    const rFats = 40, cFats = 2 * Math.PI * rFats;

    return (
        <div className="glass-card p-6 flex flex-col items-center">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6">
                <h2 className="text-lg font-serif">Today's Rhythm</h2>
                <span className="text-xs text-white/40">{Math.round((stats?.consumed.calories || 0) / (stats?.targets.calories || 2000) * 100)}%</span>
            </div>

            {/* Visual: Concentric Rings */}
            <div className="flex flex-col items-center w-full max-w-[240px] mb-8">
                <div className="relative aspect-square w-full flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                        {/* Protein Ring (Outer) */}
                        <circle cx="100" cy="100" r={rProtein} fill="none" stroke="#1c1c1e" strokeWidth="12" />
                        <motion.circle
                            initial={{ strokeDashoffset: cProtein }}
                            animate={{ strokeDashoffset: cProtein - (proteinPct / 100) * cProtein }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            cx="100" cy="100" r={rProtein} fill="none" stroke="#E07A5F" strokeWidth="12"
                            strokeDasharray={cProtein} strokeLinecap="round"
                        />

                        {/* Carbs Ring (Middle) */}
                        <circle cx="100" cy="100" r={rCarbs} fill="none" stroke="#1c1c1e" strokeWidth="12" />
                        <motion.circle
                            initial={{ strokeDashoffset: cCarbs }}
                            animate={{ strokeDashoffset: cCarbs - (carbsPct / 100) * cCarbs }}
                            transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
                            cx="100" cy="100" r={rCarbs} fill="none" stroke="#F5F2E8" strokeWidth="12"
                            strokeDasharray={cCarbs} strokeLinecap="round"
                        />

                        {/* Fat Ring (Inner) */}
                        <circle cx="100" cy="100" r={rFats} fill="none" stroke="#1c1c1e" strokeWidth="12" />
                        <motion.circle
                            initial={{ strokeDashoffset: cFats }}
                            animate={{ strokeDashoffset: cFats - (fatPct / 100) * cFats }}
                            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                            cx="100" cy="100" r={rFats} fill="none" stroke="#F4A261" strokeWidth="12"
                            strokeDasharray={cFats} strokeLinecap="round"
                        />
                    </svg>
                </div>

                {/* Text Below */}
                <div className="flex flex-col items-center mt-2">
                    <span className="text-4xl font-serif font-medium">{stats?.consumed.calories || 0}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">Calories</span>
                </div>
            </div>

            {/* Macro Bars */}
            <div className="w-full space-y-4">
                {[
                    { label: "Protein", ...proteinProps, pct: proteinPct },
                    { label: "Carbs", ...carbsProps, pct: carbsPct },
                    { label: "Fats", ...fatProps, pct: fatPct },
                ].map((macro) => (
                    <div key={macro.label} className="w-full">
                        <div className="flex justify-between items-end mb-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${macro.color.replace('bg-', 'bg-')}`} />
                                {macro.label}
                            </h4>
                            <div className="text-right">
                                <span className="text-sm font-serif">{macro.val}</span>
                                <span className="text-xs text-white/40"> / {macro.target}g</span>
                            </div>
                        </div>
                        {/* Bar container */}
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${macro.pct}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className={`absolute inset-y-0 left-0 ${macro.color} rounded-full`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
