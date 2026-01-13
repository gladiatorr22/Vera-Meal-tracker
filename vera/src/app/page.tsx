"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Camera, Flame, Droplets, Mic, ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Elegant spring physics
const springTransition = {
  type: "spring",
  stiffness: 70,
  damping: 20,
};

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]); // Reduced parallax for better centering
  const y2 = useTransform(scrollY, [0, 500], [0, -80]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden selection:bg-blue-100 selection:text-blue-900">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl tracking-tight italic text-black">
            Vera.
          </Link>

          <div className="hidden md:flex items-center gap-8 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-black/5 shadow-sm">
            <Link href="#features" className="text-sm font-medium text-neutral-600 hover:text-black transition-colors">Features</Link>
            <Link href="#rhythm" className="text-sm font-medium text-neutral-600 hover:text-black transition-colors">Rhythm</Link>
            <Link href="#stories" className="text-sm font-medium text-neutral-600 hover:text-black transition-colors">Stories</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-neutral-600 hover:text-black transition-colors">
              Log in
            </Link>
            <Link href="/sign-up" className="px-5 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors shadow-lg shadow-black/10">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-[110vh] flex items-center justify-center -mt-20 overflow-hidden pb-60 md:pb-0 bg-white">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0">
          <div className="metric-floating top-[20%] right-[10%] opacity-10 blur-3xl w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply animate-float-slow" />
          <div className="metric-floating bottom-[10%] left-[10%] opacity-10 blur-3xl w-[500px] h-[500px] bg-indigo-200 rounded-full mix-blend-multiply animate-float-medium" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center pt-32 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-left"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-light mb-6 mt-10 tracking-tight leading-[1.1]">
              Nutrition <br />
              <span className="italic font-normal relative">
                Intuition.
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-blue-100/50 -z-10" />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-500 max-w-md mb-8 leading-relaxed">
              Experience nutrition tracking reimagined. Vera uses computer vision and voice AI to understand your meals, beautifully creating a rhythm of balance in your life.
            </p>

            <div className="flex items-center gap-4">
              <Link href="/sign-up" className="group px-8 py-4 bg-black text-white rounded-full font-medium transition-all hover:scale-105 shadow-xl shadow-black/10">
                <span className="flex items-center gap-2">
                  Begin Journey
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <button className="flex items-center gap-3 px-6 py-4 rounded-full hover:bg-black/5 transition-colors text-black border border-black/5">
                <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center bg-white">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-black border-b-[6px] border-b-transparent ml-1"></div>
                </div>
                <span className="text-sm font-medium tracking-wide">Watch Film</span>
              </button>
            </div>
          </motion.div>

          {/* App Showcase - Floating 3D */}
          <motion.div
            style={{ y: y1 }}
            className="relative lg:h-[800px] flex items-center justify-center"
          >
            {/* Abstract Food Elements behind phone */}
            <motion.div
              style={{ y: y2 }}
              className="absolute top-20 right-0 z-0 opacity-60"
            >
              <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-blue-100 to-transparent blur-2xl opacity-60"></div>
            </motion.div>

            {/* Phone Mockup Frame */}
            <div className="relative z-10 w-[280px] h-[550px] md:w-[300px] md:h-[600px] bg-black rounded-[40px] md:rounded-[48px] border-[8px] border-neutral-800 shadow-2xl overflow-hidden ring-1 ring-white/10">
              {/* Dynamic Island */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[35px] w-[120px] bg-black rounded-b-[20px] z-50"></div>

              {/* Screen Content */}
              <div className="relative h-full w-full bg-black flex flex-col pt-14 px-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Scanning</span>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/10">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Scan Area */}
                <div className="relative flex-1 rounded-3xl bg-neutral-900 border border-white/10 overflow-hidden mb-6 group cursor-pointer">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                    <div className="border-r border-white/20"></div>
                    <div className="border-r border-white/20"></div>
                  </div>

                  {/* Scan Line Animation */}
                  <motion.div
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                    className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20"
                  />

                  {/* AI Tags */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="flex flex-wrap justify-center gap-2">
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}
                        className="px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold backdrop-blur-md shadow-sm border border-white/10"
                      >
                        Avocado 🥑
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 }}
                        className="px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold backdrop-blur-md shadow-sm border border-white/10"
                      >
                        Sourdough 🍞
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9 }}
                        className="px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold backdrop-blur-md shadow-sm border border-white/10"
                      >
                        Poached Egg 🥚
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Bottom Stats */}
                <div className="h-32 bg-neutral-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-white/10 p-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">Total Calories</p>
                      <p className="text-3xl font-serif text-white">480 <span className="text-sm font-sans text-neutral-500">kcal</span></p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-black shadow-lg shadow-white/10">
                      <ArrowRight className="w-5 h-5 -rotate-45" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Soft Shadow under phone */}
            <div className="absolute bottom-0 w-[200px] h-[20px] bg-black/10 blur-xl rounded-[100%] translate-y-10"></div>
          </motion.div>
        </div>
      </header>

      {/* Rhythm Section - Data Viz */}
      <section id="rhythm" className="py-32 relative bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20 items-center">

            <div className="order-2 md:order-1 relative">
              {/* Macro Rings Graphic */}
              <div className="relative w-full aspect-square max-w-md mx-auto">
                {/* Decorative background circles */}
                <div className="absolute inset-0 rounded-full border border-black/5"></div>
                <div className="absolute inset-[20%] rounded-full border border-black/5"></div>

                {/* Main Circles */}
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* Protein Ring */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f5f5f5" strokeWidth="6" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="6" strokeDasharray="251" strokeDashoffset="60" strokeLinecap="round" />
                  {/* Carbs Ring */}
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#f5f5f5" strokeWidth="6" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#0ea5e9" strokeWidth="6" strokeDasharray="188" strokeDashoffset="80" strokeLinecap="round" />
                  {/* Fats Ring */}
                  <circle cx="50" cy="50" r="20" fill="none" stroke="#f5f5f5" strokeWidth="6" />
                  <circle cx="50" cy="50" r="20" fill="none" stroke="#6366f1" strokeWidth="6" strokeDasharray="125" strokeDashoffset="40" strokeLinecap="round" />
                </svg>

                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-serif text-black">82<span className="text-sm align-top text-blue-500">%</span></span>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">Daily Rhythm</span>
                </div>
              </div>

              {/* Float Cards */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-10 -right-4 glass-card p-4 flex items-center gap-3 w-40 bg-white/80 backdrop-blur-md shadow-lg border border-black/5"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-[10px] uppercase text-neutral-400 tracking-wider">Protein</p>
                  <p className="text-sm font-medium text-black">170g / 180g</p>
                </div>
              </motion.div>
            </div>

            <div className="order-1 md:order-2">
              <span className="text-sm font-medium text-blue-600 block mb-6 uppercase tracking-wider">Your Body's Rhythm</span>
              <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">
                Visualize your <br />
                vitalit<span className="italic text-blue-400">y</span>.
              </h2>
              <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
                Move beyond simple calorie counting. Vera visualizes your macro-nutrients as a daily rhythm, helping you understand the balance of protein, carbs, and healthy fats at a glance.
              </p>

              <ul className="space-y-6">
                {[
                  { label: "Protein Focus", desc: "Muscle repair & synthesis tracking", color: "bg-blue-500" },
                  { label: "Smart Carbs", desc: "Energy optimization hints", color: "bg-sky-400" },
                  { label: "Healthy Fats", desc: "Hormonal balance metrics", color: "bg-indigo-500" }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.color} mt-2.5 shadow-[0_0_10px_currentColor]`} />
                    <div>
                      <h4 className="text-lg font-medium mb-1 text-black">{item.label}</h4>
                      <p className="text-sm text-neutral-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid - Bento Box */}
      <section id="features" className="py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif mb-4 text-black">Crafted for Clarity</h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">Everything you need to nurture your intuition, nothing you don't.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-auto md:auto-rows-[300px]">
            {/* Feature 1 - Large */}
            <div className="md:col-span-2 glass-card p-8 relative overflow-hidden group min-h-[300px] bg-white border border-black/5 shadow-sm hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Camera className="w-32 h-32 text-black" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-6 border border-black/5">
                    <Camera className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-2xl font-serif mb-2 text-black">Instant Capture</h3>
                  <p className="text-neutral-500 max-w-sm">Wait less, live more. Our advanced computer vision identifies complex meals in milliseconds.</p>
                </div>
                <div className="flex gap-2 mt-8 md:mt-0">
                  <div className="px-3 py-1 bg-black/5 rounded-full text-xs border border-black/5 text-neutral-600">Auto-Detect</div>
                  <div className="px-3 py-1 bg-black/5 rounded-full text-xs border border-black/5 text-neutral-600">Desi Mode</div>
                </div>
              </div>
            </div>

            {/* Feature 2 - Tall */}
            <div className="md:row-span-2 glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[350px] md:min-h-0 bg-white border border-black/5 shadow-sm hover:shadow-md transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50" />
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-8 mx-auto ring-1 ring-blue-100">
                  <Flame className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-serif mb-4 text-black">Consistency Streak</h3>
                <p className="text-neutral-500 text-sm mb-8">Build habits that stick. Watch your flame grow as you nourish your body daily.</p>
                <div className="text-5xl font-serif text-blue-500">24</div>
                <div className="text-xs uppercase tracking-widest text-neutral-400 mt-2">Days Active</div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-8 flex flex-col justify-between relative overflow-hidden group bg-white border border-black/5 shadow-sm hover:shadow-md transition-all">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl group-hover:bg-blue-200 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-6 border border-black/5">
                <Droplets className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-serif mb-2 text-black">Hydration</h3>
                <p className="text-neutral-500 text-sm">Smart water tracking with intelligent reminders.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="glass-card p-8 flex flex-col justify-between relative overflow-hidden group bg-white border border-black/5 shadow-sm hover:shadow-md transition-all">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl group-hover:bg-indigo-200 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-6 border border-black/5">
                <Mic className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-xl font-serif mb-2 text-black">Voice Log</h3>
                <p className="text-neutral-500 text-sm">Just say what you ate. We'll handle the math.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="stories" className="py-32 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h2 className="text-4xl font-serif mb-6 text-black">Loved by<br />Thousands</h2>
              <p className="text-lg text-neutral-500 mb-8">
                Join a community of mindful eaters finding their balance with Vera.
              </p>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 text-black fill-black" />)}
              </div>
              <p className="text-sm text-neutral-400">4.9/5 from 2,000+ reviews</p>
            </div>

            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
              {[
                { name: "Priya S.", role: "Yoga Instructor", text: "Finally, an app that actually understands Indian cooking. No more guessing dal calories!" },
                { name: "Arjun K.", role: "Marathon Runner", text: "The design is calm and beautiful. It doesn't scream 'diet app', it feels like a lifestyle tool." },
              ].map((review, i) => (
                <div key={i} className="glass-card p-6 border border-black/5 hover:border-black/10 transition-colors bg-neutral-50">
                  <p className="text-lg italic font-serif leading-relaxed mb-6 text-black">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-sm font-bold text-white">
                      {review.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-black">{review.name}</p>
                      <p className="text-xs text-neutral-500">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-black/5 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-sm font-medium uppercase tracking-widest mb-8 text-neutral-400">Vera AI</h2>
          <h3 className="text-3xl font-serif mb-12 text-black">Nourish your potential.</h3>

          <Link href="/sign-up" className="inline-flex items-center gap-2 group px-6 py-3 bg-black text-white rounded-full font-medium transition-all hover:scale-105 shadow-lg shadow-black/10">
            Start Your Free Trial
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="mt-20 flex justify-center gap-8 text-sm text-neutral-500">
            <Link href="#" className="hover:text-black transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-black transition-colors">Terms</Link>
            <Link href="#" className="hover:text-black transition-colors">Contact</Link>
          </div>
          <p className="mt-8 text-xs text-neutral-400">&copy; 2026 Vera AI Inc. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
