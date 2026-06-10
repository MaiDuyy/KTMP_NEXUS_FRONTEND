"use client";

import React, { useState, useEffect } from "react";
import { useGetTasksQuery, useUpdateTaskStatusMutation, useGetChatByIdQuery } from "@/src/redux/feature/chatApi";
import { useSelector } from "react-redux";
import { RootState } from "@/src/redux/store";
import { cn } from "@/lib/utils";
import { Loader2, Check, Calendar, Clock, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/src/utils/image-utils";
import { getInitials, avatarColor } from "../../components/group-settings/shared/utils";

interface TaskMessageBubbleProps {
  taskId: string;
  chatId: string;
  isMe: boolean;
}

export default function TaskMessageBubble({ taskId, chatId, isMe }: TaskMessageBubbleProps) {
  const { data: tasksData, isLoading, error } = useGetTasksQuery(chatId);
  const { data: chatData } = useGetChatByIdQuery(chatId);
  const [updateTaskStatus, { isLoading: isUpdating }] = useUpdateTaskStatusMutation();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?.id;

  const chat = chatData?.chat;
  const myRole = chat?.myRole;
  const isLeader = myRole === "CHANNEL_OWNER";
  const isAdmin = isLeader || myRole === "CHANNEL_MODERATOR";

  const task = tasksData?.tasks?.find((t: any) => t.id === taskId);

  // Reactive time check for real-time overdue update
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 min-w-[280px]">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-3 text-center text-xs opacity-60 min-w-[280px]">
        Không tìm thấy thông tin kế hoạch
      </div>
    );
  }

  const isAssignee = task.assignees?.some((a: any) => a.accountId === currentUserId);
  const canUpdate = isAdmin || isAssignee;

  const isEarly = task.startAt && new Date(task.startAt) > currentTime;
  const isOverdue = task.deadlineAt && new Date(task.deadlineAt) < currentTime;
  const isCancelled = task.status === "CANCELLED";

  const handleCheckboxClick = async () => {
    if (isCancelled) return toast.error("Kế hoạch đã bị hủy!");
    if (!canUpdate) {
      return toast.error("Chỉ quản trị viên hoặc người được giao mới có quyền cập nhật!");
    }

    const nextStatus = task.status === "DONE"
      ? (isEarly ? "TODO" : "IN_PROGRESS")
      : "DONE";

    try {
      await updateTaskStatus({ taskId: task.id, status: nextStatus, chatId }).unwrap();
      toast.success("Đã cập nhật trạng thái");
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTaskStatus({ taskId: task.id, status: newStatus, chatId }).unwrap();
      toast.success("Đã cập nhật trạng thái");
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // Resolve status rendering
  const getStatusDetails = () => {
    if (task.status === "DONE") {
      return {
        label: "Hoàn thành",
        color: "bg-green-500/20 text-green-200 border-green-500/30",
        lightColor: "bg-green-50 text-green-700 border-green-200"
      };
    }
    if (task.status === "CANCELLED") {
      return {
        label: "Đã hủy",
        color: "bg-white/10 text-slate-300 border-white/10",
        lightColor: "bg-slate-100 text-slate-500 border-slate-200"
      };
    }
    if (isOverdue) {
      return {
        label: "Quá hạn",
        color: "bg-red-500/20 text-red-200 border-red-500/30 animate-pulse",
        lightColor: "bg-red-50 text-red-600 border-red-200 animate-pulse"
      };
    }
    if (!isEarly || task.status === "IN_PROGRESS") {
      return {
        label: "Đang làm",
        color: "bg-amber-500/20 text-amber-200 border-amber-500/30",
        lightColor: "bg-amber-50 text-amber-700 border-amber-200"
      };
    }
    return {
      label: "Chưa bắt đầu",
      color: "bg-white/5 text-blue-200 border-white/10",
      lightColor: "bg-slate-50/50 text-slate-400 border-slate-100"
    };
  };

  const statusStyle = getStatusDetails();

  return (
    <div className="py-1 min-w-[280px] max-w-[340px] flex flex-col gap-2.5 transition-all select-none">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-wider flex items-center gap-1",
          isMe ? "text-blue-200" : "text-blue-500"
        )}>
          📋 Kế hoạch công việc
        </span>
        <h4 className={cn(
          "text-sm font-extrabold leading-snug break-words",
          isMe ? "text-white" : "text-slate-800 dark:text-white"
        )}>
          {task.title}
        </h4>
        {task.description && (
          <p className={cn(
            "text-xs mt-0.5 break-words line-clamp-2",
            isMe ? "text-blue-100/80" : "text-slate-500 dark:text-slate-400"
          )}>
            {task.description}
          </p>
        )}
      </div>

      {/* Main Card */}
      <div className={cn(
        "p-3 rounded-lg border flex flex-col gap-2.5 shadow-sm",
        isMe
          ? "bg-white/10 border-white/15 text-white"
          : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100"
      )}>
        {/* Toggle Checkbox & Status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckboxClick}
              disabled={isUpdating || isCancelled}
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                task.status === "DONE"
                  ? isMe ? "bg-white text-blue-600 border-white" : "bg-blue-600 text-white border-blue-600"
                  : isMe ? "border-white/40 hover:border-white" : "border-slate-300 hover:border-blue-400",
                isCancelled && "opacity-50 cursor-not-allowed",
                (!canUpdate && !isCancelled) && "opacity-50 cursor-not-allowed"
              )}
            >
              {task.status === "DONE" && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
            </button>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border font-semibold",
              isMe ? statusStyle.color : statusStyle.lightColor
            )}>
              {statusStyle.label}
            </span>
          </div>

          {/* Quick manual start/pause buttons */}
          {canUpdate && !isCancelled && (
            <div className="flex items-center gap-1">
              {task.status === "TODO" && (
                <button
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  disabled={isUpdating}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 transition-colors",
                    isMe ? "bg-white/20 hover:bg-white/30 text-white" : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  )}
                >
                  <Play size={8} className="fill-current" /> Bắt đầu
                </button>
              )}
              {task.status === "IN_PROGRESS" && (
                <button
                  onClick={() => handleStatusChange("TODO")}
                  disabled={isUpdating}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 transition-colors",
                    isMe ? "bg-white/20 hover:bg-white/30 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  )}
                >
                  <Pause size={8} /> Tạm dừng
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="flex flex-col gap-1 text-[10px] opacity-90">
          {task.startAt && (
            <div className="flex items-center gap-1">
              <Calendar size={11} className="opacity-70" />
              <span>Bắt đầu: {format(new Date(task.startAt), "dd/MM HH:mm")}</span>
            </div>
          )}
          {task.deadlineAt && (
            <div className={cn(
              "flex items-center gap-1 font-semibold",
              isOverdue && task.status !== "DONE" ? "text-red-500" : ""
            )}>
              <Clock size={11} className="opacity-70" />
              <span>Hạn: {format(new Date(task.deadlineAt), "dd/MM HH:mm")}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {task.assignees?.length > 0 && (
          <div className="flex flex-col gap-1 border-t border-dotted border-current/10 pt-2">
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">Người thực hiện</span>
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5 overflow-hidden">
                {task.assignees.slice(0, 4).map((a: any, i: number) => (
                  <Avatar key={i} className={cn("h-4.5 w-4.5 rounded-md border", isMe ? "border-blue-600" : "border-white")}>
                    <AvatarImage src={getAvatarUrl(a.avatar || "", a.name)} />
                    <AvatarFallback className={cn("text-[7px] font-bold rounded-md", avatarColor(a.name || ""))}>
                      {getInitials(a.name || "")}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {task.assignees.length > 4 && (
                <span className="text-[9px] font-bold">+{task.assignees.length - 4}</span>
              )}
              <span className="text-[10px] font-medium truncate max-w-[120px] ml-1">
                {task.assignees.map((a: any) => a.name).join(", ")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
