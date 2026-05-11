import React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield } from "lucide-react";

export function RoleBadge({ role }: { role: string }) {
    if (role === "CHANNEL_OWNER")
        return (
            <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-semibold gap-1">
                <Crown className="w-2.5 h-2.5" /> Leader
            </Badge>
        );
    if (role === "CHANNEL_MODERATOR")
        return (
            <Badge className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 font-semibold gap-1">
                <Shield className="w-2.5 h-2.5" /> Phó nhóm
            </Badge>
        );
    return (
        <Badge variant="outline" className="text-[10px] text-slate-500 font-medium">
            Thành viên
        </Badge>
    );
}