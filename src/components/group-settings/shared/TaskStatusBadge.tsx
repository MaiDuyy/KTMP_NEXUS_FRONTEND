import React from "react";
import { Badge } from "@/components/ui/badge";

export function TaskStatusBadge({ task }: { task: any }) {
    const { status, deadlineAt, startAt } = task;
    const now = new Date();
    const isOverdue = deadlineAt && new Date(deadlineAt) < now;
    const hasStarted = startAt && new Date(startAt) <= now;

    if (status === "DONE")
        return (
            <Badge className="text-[10px] bg-green-50 text-green-700 border-green-200 font-semibold shadow-sm">
                Hoàn thành
            </Badge>
        );

    if (status === "CANCELLED")
        return (
            <Badge className="text-[10px] bg-slate-100 text-slate-500 border-slate-200 font-semibold shadow-sm">
                Đã hủy
            </Badge>
        );

    if (isOverdue)
        return (
            <Badge className="text-[10px] bg-red-50 text-red-600 border-red-200 font-semibold animate-pulse shadow-sm">
                Quá hạn
            </Badge>
        );

    if (hasStarted || status === "IN_PROGRESS")
        return (
            <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-semibold shadow-sm">
                Đang làm
            </Badge>
        );

    return (
        <Badge variant="outline" className="text-[10px] text-slate-400 font-medium bg-slate-50/50">
            Chưa bắt đầu
        </Badge>
    );
}