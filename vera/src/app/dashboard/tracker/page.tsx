"use client";

import { DietTracker } from "@/components/tracker/DietTracker";

export default function TrackerPage() {
    return (
        <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-serif mb-2">My Journey</h1>
                <p className="text-white/40">Track your meals and stay in rhythm.</p>
            </header>

            <DietTracker />
        </div>
    );
}
