import React from "react";
import { Loader2, Calendar, Check, Trash2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { StatCard } from "../shared/StatCard";
import { TaskStatusBadge } from "../shared/TaskStatusBadge";
import { getInitials, normalizeUrl, avatarColor } from "../shared/utils";
import { toast } from "sonner";

interface TasksTabProps {
    tasks: any[];
    tasksLoading: boolean;
    doneTasks: number;
    inProgressTasks: number;
    handleUpdateTaskStatus: (taskId: string, status: string) => void;
    handleDeleteTask: (taskId: string) => void;
    currentUserId?: string;
    isAdmin: boolean;
}

export function TasksTab({
    tasks,
    tasksLoading,
    doneTasks,
    inProgressTasks,
    handleUpdateTaskStatus,
    handleDeleteTask,
    currentUserId,
    isAdmin,
}: TasksTabProps) {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 mb-2">
                <StatCard label="Tổng kế hoạch" value={tasks.length} />
                <StatCard
                    label="Hoàn thành"
                    value={doneTasks}
                    sub={tasks.length ? `${Math.round((doneTasks / tasks.length) * 100)}%` : "0%"}
                />
                <StatCard label="Đang thực hiện" value={inProgressTasks} />
            </div>

            {tasksLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-16 text-sm text-slate-400">Chưa có kế hoạch nào</div>
            ) : (
                <div className="border border-slate-100 rounded-xl divide-y divide-slate-50">
                    {tasks.map((task: any) => {
                        const isAssignee = task.assignees?.some((a: any) => a.accountId === currentUserId);
                        const canUpdate = isAdmin || isAssignee;

                        const now = new Date();
                        const isEarly = task.startAt && new Date(task.startAt) > now;
                        const isOverdue = task.deadlineAt && new Date(task.deadlineAt) < now;
                        const isCancelled = task.status === "CANCELLED";

                        return (
                            <div key={task.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 group/item transition-colors">
                                <button
                                    onClick={() => {
                                        if (isCancelled) return toast.error("Kế hoạch đã bị hủy, không thể đánh dấu!");
                                        if (!canUpdate) {
                                            return toast.error("Chỉ quản trị viên hoặc người được giao mới có quyền cập nhật!");
                                        }

                                        // Restrictions: Only block going TO "DONE"
                                        if (task.status !== "DONE") {
                                            if (isEarly) {
                                                return toast.error("Kế hoạch chưa đến thời gian thực hiện!");
                                            }
                                            if (isOverdue) {
                                                return toast.error("Kế hoạch đã quá hạn, không thể đánh dấu hoàn thành!");
                                            }
                                        }

                                        handleUpdateTaskStatus(task.id, task.status === "DONE" ? "TODO" : "DONE");
                                    }}
                                    className={cn(
                                        "mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                                        task.status === "DONE"
                                            ? "bg-blue-600 border-blue-600"
                                            : isCancelled
                                            ? "border-slate-200 bg-slate-50 cursor-not-allowed"
                                            : "border-slate-300 hover:border-blue-400",
                                        (!canUpdate || isCancelled || (task.status !== "DONE" && (isEarly || isOverdue))) && "opacity-50 cursor-not-allowed"
                                    )}
                                    disabled={isCancelled}
                                >
                                    {task.status === "DONE" && <Check className="w-2.5 h-2.5 text-white" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={cn(
                                            "text-[13px] font-medium text-slate-800",
                                            (task.status === "DONE" || isCancelled) && "line-through text-slate-400"
                                        )}
                                    >
                                        {task.title}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                        {task.startAt && (
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-slate-300" />
                                                Bắt đầu: {format(new Date(task.startAt), "dd/MM HH:mm")}
                                            </p>
                                        )}
                                        {task.deadlineAt && (
                                            <p className="text-[10px] text-orange-600 font-medium tracking-tighter flex items-center gap-1">
                                                <Calendar className="w-3 h-3 opacity-70" />
                                                Hạn: {format(new Date(task.deadlineAt), "dd/MM HH:mm")}
                                            </p>
                                        )}
                                    </div>
                                    {task.assignees?.length > 0 && (
                                        <div className="flex items-center gap-1 mt-2">
                                            <div className="flex -space-x-1">
                                                {task.assignees.slice(0, 4).map((a: any, i: number) => (
                                                    <Avatar key={i} className="h-5 w-5 rounded-md border border-white mr-2">
                                                        <AvatarImage src={normalizeUrl(a.avatar || "")} />
                                                        <AvatarFallback className={cn("rounded-md text-[9px] font-semibold", avatarColor(a.name || ""))}>
                                                            {getInitials(a.name || "")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            </div>
                                            {task.assignees.length > 4 && (
                                                <span className="text-[10px] text-slate-400">+{task.assignees.length - 4}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 self-start pt-0.5">
                                    {isAdmin && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            {!isCancelled && task.status !== "DONE" && (
                                                <button
                                                    onClick={() => handleUpdateTaskStatus(task.id, "CANCELLED")}
                                                    className="p-1 px-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all text-[10px] font-medium flex items-center gap-1"
                                                    title="Hủy kế hoạch"
                                                >
                                                    <XCircle className="w-2.5 h-2.5" /> Hủy
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (window.confirm("Bạn có chắc chắn muốn xóa kế hoạch này?")) {
                                                        handleDeleteTask(task.id);
                                                    }
                                                }}
                                                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                                title="Xóa kế hoạch"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    <TaskStatusBadge task={task} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}