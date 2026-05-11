import React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface GroupSettingsHeaderProps {
    title: string;
    action?: () => void;
    actionLabel?: string;
}

export function GroupSettingsHeader({ title, action, actionLabel }: GroupSettingsHeaderProps) {
    return (
        <div className="h-12 border-b border-slate-100 px-5 flex items-center justify-between flex-shrink-0 bg-white">
            <h2 className="text-[13px] font-semibold text-slate-800">{title}</h2>
            {action && (
                <Button
                    size="sm"
                    className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3"
                    onClick={action}
                >
                    <UserPlus className="w-3 h-3" />
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}