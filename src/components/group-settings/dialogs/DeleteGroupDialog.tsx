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

interface DeleteGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isLoading: boolean;
    onConfirm: () => void;
}

export function DeleteGroupDialog({
    open,
    onOpenChange,
    isLoading,
    onConfirm,
}: DeleteGroupDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600">
                        Giải tán nhóm chat?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Hành động này <span className="font-bold">không thể hoàn tác</span>.
                        Tất cả tin nhắn sẽ bị xóa và toàn bộ thành viên sẽ mất quyền truy
                        cập vào nhóm này.
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
                        Xóa nhóm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}