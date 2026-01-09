"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, Check } from "lucide-react";
import {
    saveOnboardingProfile,
    type Gender,
    type ActivityLevel,
    type Goal,
} from "@/app/actions/onboarding";

// ──── Types ────
type Step = "intro" | "basics" | "measurements" | "activity" | "goal" | "results";

const STEPS: Step[] = ["intro", "basics", "measurements", "activity", "goal", "results"];

// ──── Options ────
const ACTIVITY_OPTIONS: { value: ActivityLevel; emoji: string; label: string; desc: string }[] = [
    { value: "sedentary", emoji: "🛋️", label: "Sedentary", desc: "Little to no exercise, desk job" },
    { value: "light", emoji: "🚶", label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
    { value: "moderate", emoji: "🏃", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
    { value: "active", emoji: "🔥", label: "Very Active", desc: "Hard exercise 6-7 days/week" },
    { value: "very_active", emoji: "⚡", label: "Extra Active", desc: "Very hard exercise & physical job" },
];

const GOAL_OPTIONS: { value: Goal; emoji: string; label: string; desc: string }[] = [
    { value: "cut", emoji: "📉", label: "Lose Weight", desc: "Create a calorie deficit" },
    { value: "maintain", emoji: "⚖️", label: "Maintain Weight", desc: "Stay at current weight" },
    { value: "bulk", emoji: "💪", label: "Gain Muscle", desc: "Build mass with a surplus" },
];

// ──── Animations ────
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

const cardHover = {
    hover: { scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" },
    tap: { scale: 0.98 },
};

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>("intro");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Data
    const [name, setName] = useState<string>("Friend");
    const [gender, setGender] = useState<Gender>("male");
    const [age, setAge] = useState<number>(25);
    const [height, setHeight] = useState<number>(170);
    const [weight, setWeight] = useState<number>(70);
    const [activity, setActivity] = useState<ActivityLevel>("moderate");
    const [goal, setGoal] = useState<Goal>("maintain");

    // Results
    const [results, setResults] = useState<{
        target_calories: number;
        target_protein: number;
        target_carbs: number;
        target_fat: number;
    } | null>(null);

    const stepIndex = STEPS.indexOf(currentStep);
    const progress = ((stepIndex + 1) / STEPS.length) * 100;

    // ──── Handlers ────
    const nextStep = () => {
        const nextIdx = stepIndex + 1;
        if (nextIdx < STEPS.length) setCurrentStep(STEPS[nextIdx]);
    };

    const prevStep = () => {
        const prevIdx = stepIndex - 1;
        if (prevIdx >= 0) setCurrentStep(STEPS[prevIdx]);
    };

    const calculatePlan = async () => {
        setLoading(true);
        const res = await saveOnboardingProfile({
            age,
            height,
            weight,
            gender,
            activity,
            goal,
        });

        if (res.success && res.data) {
            setResults({
                target_calories: res.data.target_calories,
                target_protein: res.data.target_protein,
                target_carbs: res.data.target_carbs,
                target_fat: res.data.target_fat,
            });
            setCurrentStep("results");
        } else {
            setError(res.error || "Failed to save profile");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-terracotta/5 blur-3xl rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60vh] h-[60vh] bg-peach/5 blur-3xl rounded-full" />
            </div>

            {/* Progress Bar (Skipped on Intro) */}
            {currentStep !== "intro" && (
                <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
                    <motion.div
                        className="h-full bg-gradient-to-r from-terracotta to-peach"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            )}

            {/* Header (Back Button) */}
            <header className="p-6 flex justify-between items-center relative z-20">
                {stepIndex > 0 && currentStep !== "results" ? (
                    <button onClick={prevStep} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                        <ChevronLeft className="w-6 h-6 text-white/60" />
                    </button>
                ) : <div />}
                <span className="font-serif italic text-white/20">Vera AI</span>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full px-6 pb-24 relative z-10">
                <AnimatePresence mode="wait">

                    {/* 1. INTRO */}
                    {currentStep === "intro" && (
                        <motion.div key="intro" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="text-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="w-20 h-20 rounded-full bg-gradient-to-tr from-terracotta to-peach mx-auto mb-8 shadow-[0_0_30px_rgba(224,122,95,0.4)] flex items-center justify-center text-3xl"
                            >
                                ✨
                            </motion.div>
                            <h1 className="text-4xl font-serif mb-4">Namaste.</h1>
                            <p className="text-xl text-muted-foreground leading-relaxed mb-12">
                                I'm Vera, your personal nutrition AI. I'm here to help you find your rhythm with food. <br /><br />Let's build a plan that truly fits you.
                            </p>
                            <button onClick={nextStep} className="w-full btn-cinematic text-lg">
                                Get Started
                            </button>
                        </motion.div>
                    )}

                    {/* 2. BASICS (Gender & Age) */}
                    {currentStep === "basics" && (
                        <motion.div key="basics" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                            <h2 className="text-3xl font-serif mb-2">First things first.</h2>
                            <p className="text-muted-foreground mb-10">To calculate your needs, I need to know a bit about you.</p>

                            <div className="space-y-8">
                                {/* Gender */}
                                <div>
                                    <label className="text-xs uppercase tracking-widest text-white/30 mb-4 block">Biological Sex</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(['male', 'female'] as const).map((g) => (
                                            <motion.button
                                                key={g}
                                                onClick={() => setGender(g)}
                                                whileHover="hover" whileTap="tap" variants={cardHover}
                                                className={`h-32 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${gender === g ? "bg-white/5 border-terracotta shadow-[0_0_20px_rgba(224,122,95,0.1)]" : "bg-transparent border-white/10"
                                                    }`}
                                            >
                                                <span className="text-3xl mb-2">{g === 'male' ? '👨' : '👩'}</span>
                                                <span className="font-medium capitalize">{g}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Age */}
                                <div>
                                    <div className="flex justify-between items-baseline mb-4">
                                        <label className="text-xs uppercase tracking-widest text-white/30">Age</label>
                                        <span className="text-3xl font-serif text-terracotta">{age}</span>
                                    </div>
                                    <input
                                        type="range" min={15} max={80} value={age}
                                        onChange={(e) => setAge(Number(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-terracotta"
                                    />
                                </div>
                            </div>

                            <div className="fixed bottom-8 left-0 right-0 px-6 max-w-xl mx-auto">
                                <button onClick={nextStep} className="w-full btn-cinematic">Next</button>
                            </div>
                        </motion.div>
                    )}

                    {/* 3. MEASUREMENTS */}
                    {currentStep === "measurements" && (
                        <motion.div key="measurements" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                            <h2 className="text-3xl font-serif mb-2">Your measurements.</h2>
                            <p className="text-muted-foreground mb-10">Precision helps me understand your metabolism.</p>

                            <div className="space-y-12">
                                {/* Height */}
                                <div>
                                    <div className="flex justify-between items-baseline mb-4">
                                        <label className="text-xs uppercase tracking-widest text-white/30">Height</label>
                                        <span className="text-4xl font-serif">{height} <span className="text-lg text-white/30 font-sans">cm</span></span>
                                    </div>
                                    <input
                                        type="range" min={100} max={220} value={height}
                                        onChange={(e) => setHeight(Number(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-terracotta"
                                    />
                                </div>

                                {/* Weight */}
                                <div>
                                    <div className="flex justify-between items-baseline mb-4">
                                        <label className="text-xs uppercase tracking-widest text-white/30">Weight</label>
                                        <span className="text-4xl font-serif">{weight} <span className="text-lg text-white/30 font-sans">kg</span></span>
                                    </div>
                                    <input
                                        type="range" min={30} max={180} value={weight}
                                        onChange={(e) => setWeight(Number(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-terracotta"
                                    />
                                </div>
                            </div>

                            <div className="fixed bottom-8 left-0 right-0 px-6 max-w-xl mx-auto">
                                <button onClick={nextStep} className="w-full btn-cinematic">Next</button>
                            </div>
                        </motion.div>
                    )}

                    {/* 4. ACTIVITY */}
                    {currentStep === "activity" && (
                        <motion.div key="activity" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                            <h2 className="text-3xl font-serif mb-2">How active are you?</h2>
                            <p className="text-muted-foreground mb-8">Be honest — this changes your daily calorie target significantly.</p>

                            <div className="space-y-3 pb-24">
                                {ACTIVITY_OPTIONS.map((opt) => (
                                    <motion.button
                                        key={opt.value}
                                        onClick={() => setActivity(opt.value)}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full p-5 rounded-2xl border flex items-center gap-4 text-left transition-all ${activity === opt.value
                                            ? "bg-white/5 border-terracotta ring-1 ring-terracotta/50"
                                            : "bg-transparent border-white/10 hover:bg-white/5"
                                            }`}
                                    >
                                        <span className="text-2xl">{opt.emoji}</span>
                                        <div>
                                            <h3 className={`font-medium ${activity === opt.value ? "text-terracotta" : "text-white"}`}>
                                                {opt.label}
                                            </h3>
                                            <p className="text-sm text-white/40">{opt.desc}</p>
                                        </div>
                                        {activity === opt.value && <Check className="ml-auto w-5 h-5 text-terracotta" />}
                                    </motion.button>
                                ))}
                            </div>

                            <div className="fixed bottom-8 left-0 right-0 px-6 max-w-xl mx-auto bg-background/80 backdrop-blur-xl pt-4">
                                <button onClick={nextStep} className="w-full btn-cinematic">Next</button>
                            </div>
                        </motion.div>
                    )}

                    {/* 5. GOAL */}
                    {currentStep === "goal" && (
                        <motion.div key="goal" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                            <h2 className="text-3xl font-serif mb-2">Your Goal.</h2>
                            <p className="text-muted-foreground mb-8">What do you want to achieve with Vera?</p>

                            <div className="grid gap-4">
                                {GOAL_OPTIONS.map((opt) => (
                                    <motion.button
                                        key={opt.value}
                                        onClick={() => setGoal(opt.value)}
                                        whileTap={{ scale: 0.98 }}
                                        className={`p-6 rounded-2xl border flex items-center gap-6 text-left transition-all ${goal === opt.value
                                            ? "bg-gradient-to-r from-terracotta/10 to-peach/10 border-terracotta"
                                            : "bg-transparent border-white/10 hover:border-white/20"
                                            }`}
                                    >
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${goal === opt.value ? "bg-terracotta text-white" : "bg-white/10 grayscale"
                                            }`}>
                                            {opt.emoji}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-serif mb-1">{opt.label}</h3>
                                            <p className="text-sm text-white/50">{opt.desc}</p>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            <div className="fixed bottom-8 left-0 right-0 px-6 max-w-xl mx-auto">
                                <button onClick={calculatePlan} disabled={loading} className="w-full btn-cinematic">
                                    {loading ? "Calculating Plan..." : "Reveal My Plan"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* 6. RESULTS */}
                    {currentStep === "results" && results && (
                        <motion.div key="results" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                            <div className="text-center mb-8">
                                <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Recommended Rhythm</p>
                                <div className="relative inline-block">
                                    <h2 className="text-6xl font-serif text-white mb-2">{results.target_calories}</h2>
                                    <span className="text-xl text-terracotta absolute -right-8 top-2 font-serif">*</span>
                                </div>
                                <p className="text-white/40">Daily Calories</p>
                            </div>

                            {/* Macro Cards */}
                            <div className="grid grid-cols-3 gap-3 mb-10">
                                <div className="p-4 rounded-2xl bg-white/5 border border-terracotta/30 text-center">
                                    <p className="text-[10px] uppercase tracking-widest text-terracotta mb-1">Protein</p>
                                    <p className="text-2xl font-serif">{results.target_protein}g</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-cream/30 text-center">
                                    <p className="text-[10px] uppercase tracking-widest text-cream mb-1">Carbs</p>
                                    <p className="text-2xl font-serif">{results.target_carbs}g</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-peach/30 text-center">
                                    <p className="text-[10px] uppercase tracking-widest text-peach mb-1">Fats</p>
                                    <p className="text-2xl font-serif">{results.target_fat}g</p>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-24">
                                <h3 className="font-serif text-lg mb-2">💡 Why this plan?</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Based on being a <strong>{age}-year-old {gender}</strong> who is <strong>{activity.replace('_', ' ')}</strong>,
                                    this rhythm will help you <strong>{goal === 'cut' ? 'lose weight' : goal === 'bulk' ? 'gain muscle' : 'maintain your energy'}</strong> effectively while enjoying your favorite Indian meals.
                                </p>
                            </div>

                            <div className="fixed bottom-8 left-0 right-0 px-6 max-w-xl mx-auto">
                                <button onClick={() => router.push('/dashboard')} className="w-full btn-cinematic flex items-center justify-center gap-2">
                                    Start Tracking <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}
