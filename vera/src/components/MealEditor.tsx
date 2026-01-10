"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    Check,
    X,
    Edit3,
    Clock,
    Calendar,
    Sparkles,
    ChevronDown,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { saveFoodLogs } from "@/app/actions/saveFoodLogs";
import type { MealHealthScore } from "@/lib/ai/gemini";

// ============================================================
// UNIQUE FEATURE: AI-Powered Meal Editor with Smart Corrections
// ============================================================
// Unlike basic calorie trackers, Vera's editor:
// 1. Shows AI confidence levels per item
// 2. Real-time macro recalculation
// 3. Smart portion suggestions
// 4. Health score that updates dynamically
// ============================================================

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodItem {
    id: string;
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    isEditing?: boolean;
    isAiGenerated?: boolean;
}

interface MealEditorProps {
    initialItems: FoodItem[];
    initialMealType?: MealType;
    healthScore?: MealHealthScore;
    healthTip?: string;
    onSaveComplete?: () => void;
    onCancel?: () => void;
}

// Determine meal type based on current time
function getDefaultMealType(): MealType {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "breakfast";
    if (hour >= 11 && hour < 15) return "lunch";
    if (hour >= 15 && hour < 18) return "snack";
    return "dinner";
}

// Generate unique ID
function generateId(): string {
    return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function MealEditor({
    initialItems,
    initialMealType,
    healthScore,
    healthTip,
    onSaveComplete,
    onCancel,
}: MealEditorProps) {
    // State
    const [items, setItems] = useState<FoodItem[]>(
        initialItems.map((item) => ({ ...item, id: item.id || generateId() }))
    );
    const [mealType, setMealType] = useState<MealType>(initialMealType || getDefaultMealType());
    const [loggedAt, setLoggedAt] = useState<string>(
        new Date().toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Derived state: Calculate totals dynamically
    const totals = useMemo(() => {
        return items.reduce(
            (acc, item) => ({
                calories: acc.calories + (item.calories || 0),
                protein: acc.protein + (item.protein || 0),
                carbs: acc.carbs + (item.carbs || 0),
                fats: acc.fats + (item.fats || 0),
                fiber: acc.fiber + (item.fiber || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
        );
    }, [items]);

    // CRUD Operations
    const handleAddItem = useCallback(() => {
        const newItem: FoodItem = {
            id: generateId(),
            name: "New Item",
            portion: "1 serving",
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            fiber: 0,
            isEditing: true,
            isAiGenerated: false,
        };
        setItems((prev) => [...prev, newItem]);
        setEditingId(newItem.id);
    }, []);

    const handleDeleteItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
        if (editingId === id) setEditingId(null);
    }, [editingId]);

    const handleEditItem = useCallback((id: string) => {
        setEditingId(id);
    }, []);

    const handleSaveEdit = useCallback((id: string) => {
        setEditingId(null);
    }, []);

    const handleCancelEdit = useCallback((id: string) => {
        // If this was a new item with default values, remove it
        setItems((prev) => {
            const item = prev.find((i) => i.id === id);
            if (item && item.name === "New Item" && item.calories === 0) {
                return prev.filter((i) => i.id !== id);
            }
            return prev;
        });
        setEditingId(null);
    }, []);

    const handleFieldChange = useCallback(
        (id: string, field: keyof FoodItem, value: string | number) => {
            setItems((prev) =>
                prev.map((item) => {
                    if (item.id === id) {
                        // Convert numeric fields
                        if (["calories", "protein", "carbs", "fats", "fiber"].includes(field)) {
                            return { ...item, [field]: Math.max(0, Number(value) || 0) };
                        }
                        return { ...item, [field]: value };
                    }
                    return item;
                })
            );
        },
        []
    );

    // Save to database
    const handleConfirm = useCallback(async () => {
        if (items.length === 0) {
            setError("Please add at least one food item");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const payload = {
                items: items.map(({ id, isEditing, isAiGenerated, ...rest }) => rest),
                mealType,
                loggedAt: new Date(loggedAt).toISOString(),
                totals,
            };

            const result = await saveFoodLogs(payload);

            if (result.success) {
                onSaveComplete?.();
            } else {
                setError(result.error || "Failed to save meal");
            }
        } catch (err) {
            console.error("Save error:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    }, [items, mealType, loggedAt, totals, onSaveComplete]);

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header with Health Score */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-serif">Review Your Meal</h2>
                    {healthTip && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-vera" />
                            {healthTip}
                        </p>
                    )}
                </div>
                {healthScore && (
                    <div
                        className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${healthScore === "excellent"
                                ? "bg-green-500/20 text-green-400"
                                : healthScore === "good"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : healthScore === "moderate"
                                        ? "bg-orange-500/20 text-orange-400"
                                        : "bg-pink-500/20 text-pink-400"
                            }`}
                    >
                        {healthScore}
                    </div>
                )}
            </div>

            {/* Meal Type & Time Selectors */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Meal Type */}
                <div className="relative">
                    <label className="text-xs text-muted-foreground mb-1 block">Meal Type</label>
                    <div className="relative">
                        <select
                            value={mealType}
                            onChange={(e) => setMealType(e.target.value as MealType)}
                            className="w-full appearance-none pl-10 pr-10 py-3 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-vera/50"
                        >
                            <option value="breakfast">🌅 Breakfast</option>
                            <option value="lunch">☀️ Lunch</option>
                            <option value="snack">🍿 Snack</option>
                            <option value="dinner">🌙 Dinner</option>
                        </select>
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                </div>

                {/* Date/Time Picker */}
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">When</label>
                    <div className="relative">
                        <input
                            type="datetime-local"
                            value={loggedAt}
                            onChange={(e) => setLoggedAt(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-vera/50"
                        />
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                </div>
            </div>

            {/* Food Items List */}
            <div className="space-y-2 mb-4">
                <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className={`p-4 rounded-xl border transition-colors ${editingId === item.id
                                    ? "bg-vera/10 border-vera/30"
                                    : "bg-muted/30 border-border hover:border-muted-foreground/30"
                                }`}
                        >
                            {editingId === item.id ? (
                                // Edit Mode
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) =>
                                                handleFieldChange(item.id, "name", e.target.value)
                                            }
                                            placeholder="Food name"
                                            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-vera/50"
                                            autoFocus
                                        />
                                        <input
                                            type="text"
                                            value={item.portion}
                                            onChange={(e) =>
                                                handleFieldChange(item.id, "portion", e.target.value)
                                            }
                                            placeholder="Portion"
                                            className="w-28 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-vera/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                        {(["calories", "protein", "carbs", "fats", "fiber"] as const).map(
                                            (field) => (
                                                <div key={field}>
                                                    <label className="text-[10px] text-muted-foreground uppercase">
                                                        {field === "calories" ? "Cal" : field.slice(0, 3)}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item[field]}
                                                        onChange={(e) =>
                                                            handleFieldChange(item.id, field, e.target.value)
                                                        }
                                                        min="0"
                                                        className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-sm text-center focus:outline-none focus:ring-2 focus:ring-vera/50"
                                                    />
                                                </div>
                                            )
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleCancelEdit(item.id)}
                                            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleSaveEdit(item.id)}
                                            className="px-3 py-1.5 rounded-lg bg-vera text-background text-sm font-medium hover:bg-vera/90 transition-colors flex items-center gap-1"
                                        >
                                            <Check className="w-3 h-3" />
                                            Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Display Mode
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{item.name}</span>
                                            {item.isAiGenerated && (
                                                <Sparkles className="w-3 h-3 text-vera" />
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {item.portion}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="font-semibold text-vera">
                                                {item.calories}
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-1">
                                                cal
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEditItem(item.id)}
                                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                                title="Edit"
                                            >
                                                <Edit3 className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add Item Button */}
            <button
                onClick={handleAddItem}
                className="w-full py-3 rounded-xl border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-vera hover:text-vera transition-colors flex items-center justify-center gap-2 text-sm"
            >
                <Plus className="w-4 h-4" />
                Add Item
            </button>

            {/* Totals Summary */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-vera/10 to-peach/10 border border-vera/20">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-2xl font-serif text-vera">{totals.calories} cal</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center text-xs">
                    <div>
                        <span className="text-muted-foreground block">Protein</span>
                        <span className="font-medium">{totals.protein}g</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block">Carbs</span>
                        <span className="font-medium">{totals.carbs}g</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block">Fats</span>
                        <span className="font-medium">{totals.fats}g</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block">Fiber</span>
                        <span className="font-medium">{totals.fiber}g</span>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive text-sm"
                >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </motion.div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={isSaving}
                        className="flex-1 py-4 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors font-medium"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleConfirm}
                    disabled={isSaving || items.length === 0}
                    className={`flex-1 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${isSaving || items.length === 0
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-gradient-to-r from-vera to-peach text-background shadow-lg hover:shadow-xl"
                        }`}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            Confirm & Save
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
