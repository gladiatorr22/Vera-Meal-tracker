"use client";

import { motion } from "framer-motion";
import { X, User, Edit2, LogOut, ChevronRight, Settings, Shield, Award, Calendar } from "lucide-react";

interface ProfilePanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: any; // Using any for now, will type properly later
    profile: any; // Placeholder for profile data
    onSignOut: () => void;
}

export function ProfilePanel({ isOpen, onClose, user, profile, onSignOut }: ProfilePanelProps) {
    const slideIn = {
        hidden: { x: "100%" },
        visible: { x: 0 },
        exit: { x: "100%" },
    };

    const userName = user?.user_metadata?.full_name || "Friend";
    const userEmail = user?.email || "";
    const joinDate = new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
                />
            )}

            {/* Side Panel */}
            <motion.div
                variants={slideIn}
                initial="hidden"
                animate={isOpen ? "visible" : "hidden"}
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm bg-[#0F0F10] border-l border-white/10 shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-serif">Profile</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* User Info */}
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-terracotta to-peach rounded-full p-[2px] mb-4 shadow-lg shadow-terracotta/20">
                            <div className="w-full h-full bg-[#1C1C1E] rounded-full flex items-center justify-center overflow-hidden">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt={userName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl">🧘</span>
                                )}
                            </div>
                        </div>
                        <h3 className="text-xl font-medium mb-1">{userName}</h3>
                        <p className="text-sm text-white/40">{userEmail}</p>
                        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-white/30">
                            <Calendar className="w-3 h-3" />
                            <span>Member since {joinDate}</span>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                            <div className="text-2xl font-serif text-terracotta mb-1">🔥 12</div>
                            <div className="text-[10px] uppercase tracking-wider text-white/40">Day Streak</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                            <div className="text-2xl font-serif text-peach mb-1">🥗 480</div>
                            <div className="text-[10px] uppercase tracking-wider text-white/40">Meals Tracked</div>
                        </div>
                    </div>

                    {/* Settings Groups */}
                    <div className="space-y-6">
                        {/* Personal Settings */}
                        <div>
                            <h4 className="text-xs uppercase tracking-widest text-white/30 mb-3 ml-2">Personal</h4>
                            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                                <MenuItem icon={<User className="w-4 h-4" />} label="Edit Profile" />
                                <MenuItem icon={<Award className="w-4 h-4" />} label="Goals & Targets" />
                                <MenuItem icon={<Settings className="w-4 h-4" />} label="Preferences" border={false} />
                            </div>
                        </div>

                        {/* Account Settings */}
                        <div>
                            <h4 className="text-xs uppercase tracking-widest text-white/30 mb-3 ml-2">Account</h4>
                            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                                <MenuItem icon={<Shield className="w-4 h-4" />} label="Privacy & Security" />
                                <MenuItem icon={<LogOut className="w-4 h-4" />} label="Sign Out" border={false} onClick={onSignOut} customColor="text-destructive hover:bg-destructive/10" />
                            </div>
                        </div>
                    </div>

                    {/* Version */}
                    <div className="text-center">
                        <p className="text-xs text-white/20">Vera v0.1.0 (Beta)</p>
                    </div>

                </div>
            </motion.div>
        </>
    );
}

// Helper Component for Menu Items
function MenuItem({ icon, label, border = true, onClick, customColor }: { icon: React.ReactNode; label: string; border?: boolean; onClick?: () => void; customColor?: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors ${border ? "border-b border-white/5" : ""} ${customColor ? customColor : "text-white/80"}`}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-medium">{label}</span>
            </div>
            {!customColor && <ChevronRight className="w-4 h-4 text-white/20" />}
        </button>
    );
}
