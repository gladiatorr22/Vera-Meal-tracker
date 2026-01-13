"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mic, Type, LogOut, Zap, Flame, Droplets, ArrowUpRight, Loader2, X, ScanBarcode } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDashboardData, type DailyStats } from "@/app/actions/dashboard";
import { analyzeFood } from "@/app/actions/analyzeFood";
import { ImageInput } from "@/components/ImageInput";
import { AudioRecorder } from "@/components/AudioRecorder";
import { TextInput } from "@/components/TextInput";
import { MealEditor, type FoodItem } from "@/components/MealEditor";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ProfilePanel } from "@/components/ProfilePanel";
import { RhythmCard } from "@/components/dashboard/RhythmCard";
import type { ProductNutrition } from "@/app/actions/barcode";
import type { User } from "@supabase/supabase-js";
import type { NutritionResult, MealHealthScore } from "@/lib/ai/client";

type InputMode = "photo" | "voice" | "text" | "barcode";
type ViewMode = "input" | "editor" | "scanner";

const spring = {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
};

const inputModes: { id: InputMode; icon: React.ReactNode; label: string }[] = [
    { id: "photo", icon: <Camera className="w-5 h-5" />, label: "Photo" },
    { id: "voice", icon: <Mic className="w-5 h-5" />, label: "Voice" },
    { id: "text", icon: <Type className="w-5 h-5" />, label: "Text" },
    { id: "barcode", icon: <ScanBarcode className="w-5 h-5" />, label: "Scan" },
];

// Convert barcode product to FoodItem
function productToFoodItem(product: ProductNutrition): FoodItem {
    return {
        id: `barcode-${Date.now()}`,
        name: product.brand ? `${product.brand} ${product.name}` : product.name,
        portion: product.servingSize || `${product.servingGrams}g`,
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fats: product.fats,
        fiber: product.fiber,
        isAiGenerated: false,
    };
}

// Convert AI result to FoodItem for editor
function nutritionToFoodItem(result: NutritionResult): FoodItem {
    return {
        id: `ai-${Date.now()}`,
        name: result.name,
        portion: result.portionSize ? `${result.portionSize} (${result.portionGrams}g)` : "1 serving",
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fats: result.fats,
        fiber: result.fiber || 0,
        isAiGenerated: true,
    };
}

export default function Dashboard() {
    const router = useRouter();
    const supabase = createClient();

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<DailyStats | null>(null);
    const [activeMode, setActiveMode] = useState<InputMode>("photo");
    const [viewMode, setViewMode] = useState<ViewMode>("input");

    // Input states
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [textInput, setTextInput] = useState("");

    // Analysis states
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);
    const [analyzedItems, setAnalyzedItems] = useState<FoodItem[]>([]);
    const [healthScore, setHealthScore] = useState<MealHealthScore | undefined>();
    const [healthTip, setHealthTip] = useState<string | undefined>();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        setMounted(true);

        async function checkUserAndOnboarding() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Check onboarding status
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("onboarding_completed")
                    .eq("user_id", user.id)
                    .single();

                // Only redirect to onboarding if:
                // 1. No profile exists (PGRST116 = not found)
                // 2. Profile exists but onboarding_completed is explicitly false
                // Don't redirect on other errors (like missing columns)
                if (profileError) {
                    // No profile found - needs onboarding
                    if (profileError.code === "PGRST116") {
                        router.push("/onboarding");
                        return;
                    }
                    // Other errors (column missing, etc) - continue to dashboard
                    console.warn("Profile query error:", profileError);
                } else if (profile && profile.onboarding_completed === false) {
                    // Profile exists but onboarding not completed
                    router.push("/onboarding");
                    return;
                }

                // Fetch Dashboard Data
                const res = await getDashboardData();
                if (res.success && res.data) {
                    setStats(res.data);
                }
            }
            setLoading(false);
        }

        checkUserAndOnboarding();
    }, [supabase, router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    // Handle Analyze Button Click
    const handleAnalyze = useCallback(async () => {
        setIsAnalyzing(true);
        setAnalyzeError(null);

        try {
            const result = await analyzeFood({
                imageFile: selectedImage || undefined,
                text: textInput || undefined,
                // Audio transcription would go here when implemented
            });

            if (result.success && result.data) {
                // Convert to FoodItem for editor
                const foodItem = nutritionToFoodItem(result.data);
                setAnalyzedItems([foodItem]);
                setHealthScore(result.data.healthScore);
                setHealthTip(result.data.healthTip);
                setViewMode("editor");
            } else {
                setAnalyzeError(result.error || "Failed to analyze food");
            }
        } catch (error) {
            console.error("Analysis error:", error);
            setAnalyzeError("Something went wrong. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [selectedImage, textInput]);

    // Handle save complete - refresh stats and reset
    const handleSaveComplete = useCallback(async () => {
        // Reset input states
        setSelectedImage(null);
        setRecordedAudio(null);
        setTextInput("");
        setAnalyzedItems([]);
        setViewMode("input");

        // Refresh dashboard stats
        const res = await getDashboardData();
        if (res.success && res.data) {
            setStats(res.data);
        }
    }, []);

    // Handle cancel from editor
    const handleCancelEditor = useCallback(() => {
        setViewMode("input");
        setAnalyzedItems([]);
    }, []);

    // Handle barcode product scanned
    const handleProductScanned = useCallback((product: ProductNutrition) => {
        const foodItem = productToFoodItem(product);
        setAnalyzedItems([foodItem]);
        setViewMode("editor");
    }, []);

    // Handle input mode change - open scanner if barcode selected
    const handleModeChange = useCallback((mode: InputMode) => {
        if (mode === "barcode") {
            setViewMode("scanner");
        } else {
            setActiveMode(mode);
            if (viewMode === "scanner") {
                setViewMode("input");
            }
        }
    }, [viewMode]);

    const hasContent = selectedImage || recordedAudio || textInput.trim();
    const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Friend";

    // Progress calculations
    const calProgress = stats ? Math.min((stats.consumed.calories / stats.targets.calories) * 100, 100) : 0;
    const proteinProgress = stats ? Math.min((stats.consumed.protein / stats.targets.protein) * 100, 100) : 0;
    const carbsProgress = stats ? Math.min((stats.consumed.carbs / stats.targets.carbs) * 100, 100) : 0;
    const fatProgress = stats ? Math.min((stats.consumed.fats / stats.targets.fats) * 100, 100) : 0;

    // Radius for svg rings (circumference calculations)
    const rProtein = 45, cProtein = 2 * Math.PI * rProtein;
    const rCarbs = 35, cCarbs = 2 * Math.PI * rCarbs;
    const rFats = 25, cFats = 2 * Math.PI * rFats;

    if (!mounted || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="w-2 h-2 bg-terracotta rounded-full animate-pulse" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col p-4 md:p-6 max-w-7xl mx-auto">
            {/* Cinematic Header */}
            <header className="flex items-center justify-between mb-8 md:mb-12 pt-2 md:pt-4">
                <div>
                    <h1 className="text-2xl md:text-4xl font-serif font-light text-black">
                        Good evening, <span className="italic text-black block md:inline border-b border-black">{firstName}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-black/5 rounded-full border border-black/5">
                        <Flame className="w-3 h-3 md:w-4 md:h-4 text-black" />
                        <span className="text-xs md:text-sm font-medium text-black">{stats?.streak || 0} Day Streak</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Profile Button */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            transition={spring}
                            onClick={() => setIsProfileOpen(true)}
                            className="w-10 h-10 rounded-full border border-black/10 bg-white flex items-center justify-center overflow-hidden hover:border-black/20 transition-colors"
                        >
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-lg">🧘</span>
                            )}
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            transition={spring}
                            onClick={handleSignOut}
                            className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors text-neutral-400 hover:text-black"
                        >
                            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                        </motion.button>
                    </div>

                </div>
            </header >

            {/* Main Grid Layout - Stacked on Mobile */}
            < main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-32" >

                {/* Left Col - Input & Action OR MealEditor */}
                < section className="lg:col-span-2 flex flex-col gap-6 order-2 lg:order-1" >
                    <AnimatePresence mode="wait">
                        {viewMode === "editor" ? (
                            // Meal Editor View
                            <motion.div
                                key="editor"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="glass-card p-6 md:p-8"
                            >
                                <MealEditor
                                    initialItems={analyzedItems}
                                    healthScore={healthScore}
                                    healthTip={healthTip}
                                    onSaveComplete={handleSaveComplete}
                                    onCancel={handleCancelEditor}
                                />
                            </motion.div>
                        ) : (
                            // Input View
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col gap-6"
                            >
                                {/* Input Card */}
                                <div className="flex-1 glass-card p-4 md:p-8 flex flex-col relative overflow-hidden min-h-[400px] md:min-h-[500px]">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                        <h2 className="text-xl md:text-2xl font-serif">Capture Meal</h2>

                                        {/* Input Tabs */}
                                        <div className="flex bg-neutral-100 rounded-full p-1 border border-black/5 self-start md:self-auto">
                                            {inputModes.map((mode) => (
                                                <button
                                                    key={mode.id}
                                                    onClick={() => handleModeChange(mode.id)}
                                                    className={`relative px-4 py-2 md:px-5 rounded-full text-[10px] md:text-xs font-medium uppercase tracking-wide transition-all ${activeMode === mode.id && mode.id !== "barcode"
                                                        ? "text-white bg-black shadow-md"
                                                        : "text-neutral-500 hover:text-black"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {mode.icon}
                                                        <span className="hidden sm:inline">{mode.label}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Input Area */}
                                    <div className="flex-1 rounded-2xl border border-black/5 bg-neutral-50 relative flex items-center justify-center overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            {activeMode === "photo" && (
                                                <motion.div
                                                    key="photo"
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    className="w-full h-full p-6 flex items-center justify-center"
                                                >
                                                    <ImageInput onImageSelect={setSelectedImage} selectedImage={selectedImage} />
                                                </motion.div>
                                            )}

                                            {activeMode === "voice" && (
                                                <motion.div
                                                    key="voice"
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    className="w-full h-full flex items-center justify-center p-6"
                                                >
                                                    <AudioRecorder onAudioRecord={setRecordedAudio} recordedAudio={recordedAudio} />
                                                </motion.div>
                                            )}

                                            {activeMode === "text" && (
                                                <motion.div
                                                    key="text"
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    className="w-full max-w-lg p-6"
                                                >
                                                    <TextInput
                                                        value={textInput}
                                                        onChange={setTextInput}
                                                        placeholder="Example: 'A bowl of rajma chawal and salad'..."
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {analyzeError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between"
                                    >
                                        <span>{analyzeError}</span>
                                        <button onClick={() => setAnalyzeError(null)}>
                                            <X className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}

                                {/* Analyze Bar */}
                                <motion.button
                                    whileHover={{ scale: hasContent && !isAnalyzing ? 1.01 : 1 }}
                                    whileTap={{ scale: hasContent && !isAnalyzing ? 0.99 : 1 }}
                                    disabled={!hasContent || isAnalyzing}
                                    onClick={handleAnalyze}
                                    className={`w-full py-4 md:py-6 rounded-2xl font-medium tracking-wide transition-all flex items-center justify-between px-6 md:px-8 text-base md:text-lg ${hasContent && !isAnalyzing
                                        ? "bg-black text-white shadow-lg hover:shadow-xl hover:scale-[1.01]"
                                        : "bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {isAnalyzing ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Zap className={`w-5 h-5 ${hasContent ? "fill-white" : ""}`} />
                                        )}
                                        {isAnalyzing ? "Analyzing..." : hasContent ? "Analyze Rhythm" : "Add content to analyze"}
                                    </div>
                                    {hasContent && !isAnalyzing && <ArrowUpRight className="w-5 h-5" />}
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section >

                {/* Right Col - Stats & Context */}
                < section className="flex flex-col gap-6 order-1 lg:order-2" >

                    {/* Today's Rhythm Card */}
                    <motion.div
                        layoutId="rhythm-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div onClick={() => router.push('/dashboard/tracker')} className="cursor-pointer transition-transform active:scale-95">
                            <RhythmCard stats={stats} />
                        </div>
                    </motion.div>

                </section>

            </main >

            {/* Barcode Scanner Overlay */}
            <AnimatePresence>
                {
                    viewMode === "scanner" && (
                        <BarcodeScanner
                            onProductScanned={handleProductScanned}
                            onClose={() => setViewMode("input")}
                        />
                    )
                }
            </AnimatePresence >

            <ProfilePanel
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user}
                profile={null} // Will fetch profile data properly in next step
                onSignOut={handleSignOut}
            />

        </div >
    );
}
