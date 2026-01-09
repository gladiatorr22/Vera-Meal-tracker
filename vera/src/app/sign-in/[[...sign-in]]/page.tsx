"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const spring = {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
};

export default function SignInPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    const handleGoogleSignIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-terracotta/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-peach/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md glass-card p-8 md:p-12 relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <Link href="/" className="inline-block mb-6">
                        <span className="font-serif italic text-3xl">Vera.</span>
                    </Link>
                    <h1 className="text-2xl font-serif mb-2">Welcome Back</h1>
                    <p className="text-muted-foreground text-sm">Continue your journey to intuitive nutrition.</p>
                </div>

                {/* Google Sign In */}
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                    onClick={handleGoogleSignIn}
                    className="w-full py-3 rounded-full border border-white/10 font-medium flex items-center justify-center gap-3 hover:bg-white/5 transition-colors mb-8 text-sm"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Continue with Google
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/20 text-xs uppercase tracking-widest">Or with email</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Form */}
                <form onSubmit={handleSignIn} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-white/40 ml-1">Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-minimal"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-white/40 ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-minimal pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-400 text-center bg-red-400/10 p-2 rounded-lg"
                        >
                            {error}
                        </motion.p>
                    )}

                    {/* Submit */}
                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        transition={spring}
                        className="w-full btn-cinematic mt-4 flex items-center justify-center gap-2"
                    >
                        {loading ? "Verifying..." : "Sign In"}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </motion.button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-10">
                    New to Vera?{" "}
                    <Link href="/sign-up" className="text-terracotta hover:text-peach transition-colors font-medium">
                        Create an account
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
