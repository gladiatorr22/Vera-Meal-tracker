"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

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
        <div className="min-h-screen bg-white text-black flex items-center justify-center p-6 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-100 rounded-full blur-3xl pointer-events-none opacity-50" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-100 rounded-full blur-3xl pointer-events-none opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md bg-white p-8 md:p-12 relative z-10 rounded-3xl shadow-xl border border-neutral-100"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <Link href="/" className="inline-block mb-6">
                        <span className="font-serif italic text-3xl text-black">Vera.</span>
                    </Link>
                    <h1 className="text-2xl font-serif mb-2 text-black">Welcome Back</h1>
                    <p className="text-neutral-500 text-sm">Continue your journey to intuitive nutrition.</p>
                </div>

                {/* Google Sign In */}
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                    onClick={handleGoogleSignIn}
                    className="w-full py-3 rounded-full border border-neutral-200 font-medium flex items-center justify-center gap-3 hover:bg-neutral-50 transition-colors mb-8 text-sm text-black"
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
                    <div className="flex-1 h-px bg-neutral-100" />
                    <span className="text-neutral-400 text-xs uppercase tracking-widest">Or with email</span>
                    <div className="flex-1 h-px bg-neutral-100" />
                </div>

                {/* Form */}
                <form onSubmit={handleSignIn} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-neutral-500 ml-1">Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-neutral-500 ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
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
                            className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-lg"
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
                        className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-neutral-800 transition-colors shadow-lg shadow-black/10 mt-4 flex items-center justify-center gap-2"
                    >
                        {loading ? "Verifying..." : "Sign In"}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </motion.button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-neutral-500 mt-10">
                    New to Vera?{" "}
                    <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 transition-colors font-medium">
                        Create an account
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
