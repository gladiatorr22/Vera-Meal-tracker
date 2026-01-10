"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Loader2, ChevronRight, Flame, Leaf, Utensils, Cake } from "lucide-react";
import { searchFood, type SearchFoodResult } from "@/app/actions/searchFood";
import type { FoodSuggestion, MealHealthScore } from "@/lib/ai/gemini";

// ============================================================
// UNIQUE FEATURE: AI Smart Search with Health Intelligence
// ============================================================
// Unlike basic autocomplete, Vera's search shows:
// 1. Real-time AI-powered suggestions
// 2. Visual health score badges
// 3. Nutritional preview on hover
// 4. Contextual suggestions based on time of day
// ============================================================

interface SmartFoodSearchProps {
    onSelect: (food: FoodSuggestion) => void;
    placeholder?: string;
}

// Health score icons and colors
const healthScoreConfig: Record<MealHealthScore, { icon: React.ElementType; color: string; bg: string }> = {
    excellent: { icon: Leaf, color: "text-green-600", bg: "bg-green-100" },
    good: { icon: Utensils, color: "text-blue-600", bg: "bg-blue-100" },
    moderate: { icon: Flame, color: "text-orange-500", bg: "bg-orange-100" },
    indulgent: { icon: Cake, color: "text-pink-500", bg: "bg-pink-100" },
};

export function SmartFoodSearch({ onSelect, placeholder = "Search any food..." }: SmartFoodSearchProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [error, setError] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        debounceRef.current = setTimeout(async () => {
            const result: SearchFoodResult = await searchFood(query);

            if (result.success && result.suggestions) {
                setSuggestions(result.suggestions);
                setIsOpen(result.suggestions.length > 0);
            } else {
                setError(result.error || "Search failed");
                setSuggestions([]);
            }
            setIsLoading(false);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < suggestions.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : suggestions.length - 1
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                        handleSelect(suggestions[selectedIndex]);
                    }
                    break;
                case "Escape":
                    setIsOpen(false);
                    setSelectedIndex(-1);
                    break;
            }
        },
        [isOpen, suggestions, selectedIndex]
    );

    // Handle selection
    const handleSelect = useCallback(
        (food: FoodSuggestion) => {
            onSelect(food);
            setQuery("");
            setIsOpen(false);
            setSuggestions([]);
            setSelectedIndex(-1);
        },
        [onSelect]
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Search Input */}
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Search className="w-5 h-5" />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-vera/50 focus:border-vera transition-all"
                />

                {/* AI Badge */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-vera/10 text-vera">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] font-medium">AI</span>
                    </div>
                </div>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 z-50 mt-2 py-2 bg-background border border-border rounded-2xl shadow-xl overflow-hidden"
                    >
                        {error ? (
                            <div className="px-4 py-3 text-sm text-destructive">{error}</div>
                        ) : (
                            suggestions.map((food, index) => {
                                const healthConfig = healthScoreConfig[food.healthScore] || healthScoreConfig.moderate;
                                const HealthIcon = healthConfig.icon;

                                return (
                                    <motion.button
                                        key={`${food.name}-${index}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleSelect(food)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selectedIndex === index
                                                ? "bg-vera/10"
                                                : "hover:bg-muted/50"
                                            }`}
                                    >
                                        {/* Health Score Badge */}
                                        <div
                                            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${healthConfig.bg}`}
                                        >
                                            <HealthIcon className={`w-5 h-5 ${healthConfig.color}`} />
                                        </div>

                                        {/* Food Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground truncate">
                                                    {food.name}
                                                </span>
                                                <span className="flex-shrink-0 text-xs text-muted-foreground">
                                                    {food.portionDescription}
                                                </span>
                                            </div>
                                            {/* Macro Preview */}
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span className="text-vera font-semibold">
                                                    {food.calories} cal
                                                </span>
                                                <span>P: {food.protein}g</span>
                                                <span>C: {food.carbs}g</span>
                                                <span>F: {food.fats}g</span>
                                            </div>
                                        </div>

                                        {/* Arrow indicator */}
                                        <ChevronRight
                                            className={`w-4 h-4 flex-shrink-0 transition-transform ${selectedIndex === index
                                                    ? "text-vera translate-x-1"
                                                    : "text-muted-foreground"
                                                }`}
                                        />
                                    </motion.button>
                                );
                            })
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
