import React from "react";
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
import { Participant } from "../types";

interface RemoveMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    memberToRemove: Participant | null;
    getMemberName: (p: Participant) => string;
    onConfirm: () => void;
    isRemoving: boolean;
}

export function RemoveMemberDialog({
    open,
    onOpenChange,
    memberToRemove,
    getMemberName,
    onConfirm,
    isRemoving,
}: RemoveMemberDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Xóa thành viên?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bạn có chắc muốn xóa <strong>{memberToRemove ? getMemberName(memberToRemove) : ""}</strong> khỏi nhóm? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={onConfirm} disabled={isRemoving}>
                        {isRemoving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                        Xóa khỏi nhóm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}