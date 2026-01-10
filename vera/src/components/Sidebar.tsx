"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const links = [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/tracker", label: "Tracker", icon: UtensilsCrossed },
    ];

    return (
        <>
            {/* Mobile Toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 rounded-full bg-card/80 backdrop-blur-md border border-white/10 text-foreground"
                >
                    {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar Container */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 bg-[#0A0A0B] border-r border-white/5 transform transition-all duration-300 ease-in-out 
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                    ${isCollapsed ? "w-20" : "w-64"}
                `}
            >
                <div className="flex flex-col h-full relative">
                    {/* Collapse Toggle Button (Desktop Only) */}
                    <button
                        onClick={toggleCollapse}
                        className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 bg-terracotta rounded-full items-center justify-center text-black hover:bg-white transition-colors z-50"
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>

                    {/* Logo Area */}
                    <div className={`h-24 flex items-center ${isCollapsed ? "justify-center" : "px-6"}`}>
                        <Link href="/dashboard" className="font-serif text-3xl tracking-tight italic text-foreground hidden lg:block overflow-hidden whitespace-nowrap">
                            {isCollapsed ? "V." : "Vera."}
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2 px-3">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`relative flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? "bg-white/10 text-white font-medium"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-terracotta" : "group-hover:text-terracotta transition-colors"}`} />

                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="whitespace-nowrap overflow-hidden"
                                        >
                                            {link.label}
                                        </motion.span>
                                    )}

                                    {/* Active Indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className={`absolute ${isCollapsed ? "left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-terracotta" : "right-3 w-1.5 h-1.5 rounded-full bg-terracotta"}`}
                                        />
                                    )}

                                    {/* Tooltip for collapsed mode */}
                                    {isCollapsed && (
                                        <div className="absolute left-full ml-4 px-2 py-1 bg-white/10 backdrop-blur-md rounded-md text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                            {link.label}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className={`p-4 border-t border-white/5 ${isCollapsed ? "flex justify-center" : ""}`}>
                        {isCollapsed ? (
                            <span className="text-xs text-white/20">v1</span>
                        ) : (
                            <p className="text-xs text-white/20 uppercase tracking-widest whitespace-nowrap">Intuition v1.0</p>
                        )}
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
}
