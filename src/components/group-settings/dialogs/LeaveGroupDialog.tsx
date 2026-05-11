"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface LeaveGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupName: string;
    isLoading: boolean;
    onConfirm: () => void;
}

export function LeaveGroupDialog({
    open,
    onOpenChange,
    groupName,
    isLoading,
    onConfirm,
}: LeaveGroupDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Rời khỏi nhóm?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bạn có chắc muốn rời khỏi nhóm{" "}
                        <span className="font-semibold">{groupName}</span>? Bạn sẽ không
                        nhận được tin nhắn mới từ nhóm này nữa.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Rời nhóm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}