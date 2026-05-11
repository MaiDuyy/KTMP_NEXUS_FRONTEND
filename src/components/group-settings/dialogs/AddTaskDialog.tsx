import React from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "../shared/MemberAvatar";
import { Participant } from "../types";

interface AddTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskTitle: string;
    setTaskTitle: (val: string) => void;
    taskStartTime: string;
    setTaskStartTime: (val: string) => void;
    taskDeadline: string;
    setTaskDeadline: (val: string) => void;
    selectedTaskAssignees: string[];
    setSelectedTaskAssignees: (val: string[]) => void;
    participants: Participant[];
    getMemberId: (p: Participant) => string | undefined;
    getMemberName: (p: Participant) => string;
    onCreateTask: () => void;
    isCreatingTask: boolean;
}

export function AddTaskDialog({
    open,
    onOpenChange,
    taskTitle,
    setTaskTitle,
    taskStartTime,
    setTaskStartTime,
    taskDeadline,
    setTaskDeadline,
    selectedTaskAssignees,
    setSelectedTaskAssignees,
    participants,
    getMemberId,
    getMemberName,
    onCreateTask,
    isCreatingTask,
}: AddTaskDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <CheckSquare className="w-4 h-4 text-blue-600" /> Tạo kế hoạch mới
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-3">
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Tiêu đề *</label>
                        <Input
                            placeholder="Nhập tiêu đề kế hoạch..."
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            className="h-9 text-sm rounded-lg"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Bắt đầu</label>
                            <Input
                                type="datetime-local"
                                value={taskStartTime}
                                onChange={(e) => setTaskStartTime(e.target.value)}
                                className="h-9 text-sm rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Deadline</label>
                            <Input
                                type="datetime-local"
                                value={taskDeadline}
                                onChange={(e) => setTaskDeadline(e.target.value)}
                                className="h-9 text-sm rounded-lg"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Giao cho</label>
                        <ScrollArea className="h-40 border border-slate-100 rounded-xl p-2">
                            {participants.map((p, i) => {
                                const id = getMemberId(p) as string;
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all",
                                            selectedTaskAssignees.includes(id) ? "bg-blue-50" : "hover:bg-slate-50"
                                        )}
                                        onClick={() =>
                                            setSelectedTaskAssignees(
                                                selectedTaskAssignees.includes(id)
                                                    ? selectedTaskAssignees.filter((x) => x !== id)
                                                    : [...selectedTaskAssignees, id]
                                            )
                                        }
                                    >
                                        <Checkbox checked={selectedTaskAssignees.includes(id)} className="rounded" />
                                        <MemberAvatar participant={p} size="sm" />
                                        <span className="text-[13px] font-medium text-slate-700">{getMemberName(p)}</span>
                                    </div>
                                );
                            })}
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={onCreateTask}
                        disabled={isCreatingTask || !taskTitle.trim()}
                    >
                        {isCreatingTask && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                        Tạo kế hoạch
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}