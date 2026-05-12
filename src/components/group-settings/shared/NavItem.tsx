import React from "react";
import { cn } from "@/lib/utils";

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    badge?: number | string;
    danger?: boolean;
    onClick: () => void;
}

export function NavItem({
    icon: Icon,
    label,
    active,
    badge,
    danger,
    onClick,
}: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-left",
                active
                    ? "bg-blue-50 text-blue-700"
                    : danger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
        >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge !== undefined && (
                <span className="text-[10px] font-semibold bg-blue-600 text-white rounded-full px-1.5 py-0.5 leading-none">
                    {badge}
                </span>
            )}
        </button>
    );
}