"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mic, Type, LogOut, Zap, Flame, Droplets, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDashboardData, type DailyStats } from "@/app/actions/dashboard";
import { ImageInput } from "@/components/ImageInput";
import { AudioRecorder } from "@/components/AudioRecorder";
import { TextInput } from "@/components/TextInput";
import type { User } from "@supabase/supabase-js";

type InputMode = "photo" | "voice" | "text";

const spring = {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
};

const inputModes: { id: InputMode; icon: React.ReactNode; label: string }[] = [
    { id: "photo", icon: <Camera className="w-5 h-5" />, label: "Photo" },
    { id: "voice", icon: <Mic className="w-5 h-5" />, label: "Voice" },
    { id: "text", icon: <Type className="w-5 h-5" />, label: "Text" },
];

export default function Dashboard() {
    const router = useRouter();
    const supabase = createClient();

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<DailyStats | null>(null);
    const [activeMode, setActiveMode] = useState<InputMode>("photo");

    // Input states
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [textInput, setTextInput] = useState("");

    useEffect(() => {
        setMounted(true);

        async function checkUserAndOnboarding() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Check onboarding status
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("onboarding_completed")
                    .eq("user_id", user.id)
                    .single();

                if (!profile || !profile.onboarding_completed) {
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
                    <h1 className="text-2xl md:text-4xl font-serif font-light">
                        Good evening, <span className="italic text-terracotta block md:inline">{firstName}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/5 rounded-full border border-white/5">
                        <Flame className="w-3 h-3 md:w-4 md:h-4 text-peach" />
                        <span className="text-xs md:text-sm font-medium">{stats?.streak || 0} Day Streak</span>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        transition={spring}
                        onClick={handleSignOut}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors group"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4 md:w-5 md:h-5 text-white/60 group-hover:text-white" />
                    </motion.button>
                </div>
            </header>

            {/* Main Grid Layout - Stacked on Mobile */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-32">

                {/* Left Col - Input & Action */}
                <section className="lg:col-span-2 flex flex-col gap-6 order-2 lg:order-1">

                    {/* Input Card */}
                    <div className="flex-1 glass-card p-4 md:p-8 flex flex-col relative overflow-hidden min-h-[400px] md:min-h-[500px]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <h2 className="text-xl md:text-2xl font-serif">Capture Meal</h2>

                            {/* Input Tabs */}
                            <div className="flex bg-black/40 rounded-full p-1 border border-white/5 self-start md:self-auto">
                                {inputModes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => setActiveMode(mode.id)}
                                        className={`relative px-4 py-2 md:px-5 rounded-full text-[10px] md:text-xs font-medium uppercase tracking-wide transition-all ${activeMode === mode.id
                                            ? "text-black bg-white"
                                            : "text-white/40 hover:text-white"
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
                        <div className="flex-1 rounded-2xl border border-white/5 bg-black/20 relative flex items-center justify-center overflow-hidden">
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

                    {/* Analyze Bar */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        disabled={!hasContent}
                        className={`w-full py-4 md:py-6 rounded-2xl font-medium tracking-wide transition-all flex items-center justify-between px-6 md:px-8 text-base md:text-lg ${hasContent
                            ? "bg-gradient-to-r from-terracotta to-peach text-black shadow-[0_0_30px_rgba(224,122,95,0.3)]"
                            : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Zap className={`w-5 h-5 ${hasContent ? "fill-black" : ""}`} />
                            {hasContent ? "Analyze Rhythm" : "Add content to analyze"}
                        </div>
                        {hasContent && <ArrowUpRight className="w-5 h-5" />}
                    </motion.button>

                </section>

                {/* Right Col - Stats & Context */}
                <section className="flex flex-col gap-6 order-1 lg:order-2">

                    {/* Today's Rhythm Card */}
                    <div className="glass-card p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-serif">Today's Rhythm</h3>
                            <div className="text-xs text-white/40 uppercase tracking-widest">{calProgress.toFixed(0)}%</div>
                        </div>

                        {/* Rings Viz (Real Data) */}
                        <div className="aspect-square relative flex items-center justify-center mb-8 max-w-[280px] mx-auto">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                {/* Protein Ring */}
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#1c1c1e" strokeWidth="8" />
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#E07A5F" strokeWidth="8"
                                    strokeDasharray={cProtein}
                                    strokeDashoffset={cProtein - (proteinProgress / 100) * cProtein}
                                    strokeLinecap="round"
                                />

                                {/* Carbs Ring */}
                                <circle cx="50" cy="50" r="35" fill="none" stroke="#1c1c1e" strokeWidth="8" />
                                <circle cx="50" cy="50" r="35" fill="none" stroke="#F5F2E8" strokeWidth="8"
                                    strokeDasharray={cCarbs}
                                    strokeDashoffset={cCarbs - (carbsProgress / 100) * cCarbs}
                                    strokeLinecap="round"
                                />

                                {/* Fat Ring */}
                                <circle cx="50" cy="50" r="25" fill="none" stroke="#1c1c1e" strokeWidth="8" />
                                <circle cx="50" cy="50" r="25" fill="none" stroke="#F4A261" strokeWidth="8"
                                    strokeDasharray={cFats}
                                    strokeDashoffset={cFats - (fatProgress / 100) * cFats}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-serif">{stats?.consumed.calories || 0}</span>
                                <span className="text-[10px] uppercase tracking-widest text-white/40">kcal</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-terracotta"></div>
                                    <span className="text-sm">Protein</span>
                                </div>
                                <span className="text-sm font-medium">{stats?.consumed.protein || 0}g <span className="text-white/30">/ {stats?.targets.protein}g</span></span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-cream"></div>
                                    <span className="text-sm">Carbs</span>
                                </div>
                                <span className="text-sm font-medium">{stats?.consumed.carbs || 0}g <span className="text-white/30">/ {stats?.targets.carbs}g</span></span>
                            </div>
                            <div className="flex justify-between items-center pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-peach"></div>
                                    <span className="text-sm">Fats</span>
                                </div>
                                <span className="text-sm font-medium">{stats?.consumed.fats || 0}g <span className="text-white/30">/ {stats?.targets.fats}g</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Hydration Mini Card (Still Placeholder for now, user asked to remove fake data, so removing hardcoded values) */}
                    <div className="glass-card p-6 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Droplets className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium">Hydration</p>
                                <p className="text-xs text-white/40">Feature coming soon</p>
                            </div>
                        </div>
                    </div>

                </section>

            </main>

        </div>
    );
}
