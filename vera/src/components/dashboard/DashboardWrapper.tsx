"use client";

import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            <div
                className={`flex-1 transition-all duration-300 ease-in-out pl-16 lg:pl-0 ${isCollapsed ? "lg:ml-20" : "lg:ml-64"
                    }`}
            >
                {children}
            </div>
        </div>
    );
}
