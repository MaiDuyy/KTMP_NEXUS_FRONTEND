import React from "react";

interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
    return (
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <p className="text-[11px] text-slate-500 mb-1">{label}</p>
            <p className="text-xl font-semibold text-slate-900">{value}</p>
            {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
    );
}