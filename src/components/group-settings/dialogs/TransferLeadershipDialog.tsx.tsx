"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Loader2 } from "lucide-react";

interface Participant {
    id: string;
    accountId?: string;
    userId?: string;
    role: string;
    account?: {
        id: string;
        name: string;
        avatar: string | null;
    };
    name?: string;
    avatar?: string | null;
}

interface TransferLeadershipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    participants: Participant[];
    currentUserId?: string;
    selectedSuccessor: string | null;
    setSelectedSuccessor: (id: string | null) => void;
    groupName: string;
    isLoading: boolean;
    onConfirm: () => void;
    getMemberId: (p: Participant) => string | undefined;
    getMemberName: (p: Participant) => string;
    getMemberAvatar: (p: Participant) => string | null | undefined;
    getInitials: (name: string) => string;
    normalizeUrl: (url: string) => string;
}

export function TransferLeadershipDialog({
    open,
    onOpenChange,
    participants,
    currentUserId,
    selectedSuccessor,
    setSelectedSuccessor,
    groupName,
    isLoading,
    onConfirm,
    getMemberId,
    getMemberName,
    getMemberAvatar,
    getInitials,
    normalizeUrl,
}: TransferLeadershipDialogProps) {
    const otherMembers = participants.filter(
        (p) => getMemberId(p) !== currentUserId
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Chuyển quyền Trưởng nhóm</DialogTitle>
                    <DialogDescription>
                        Bạn là Trưởng nhóm. Trước khi rời khỏi nhóm{" "}
                        <span className="font-semibold text-gray-900">{groupName}</span>,
                        bạn cần chỉ định một người kế nhiệm.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <ScrollArea className="h-60 border rounded-2xl p-2 bg-gray-50/50">
                        <div className="space-y-2">
                            {otherMembers.map((p) => {
                                const memberId = getMemberId(p);
                                if (!memberId) return null;
                                return (
                                    <div
                                        key={memberId}
                                        onClick={() => setSelectedSuccessor(memberId)}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${selectedSuccessor === memberId
                                                ? "bg-blue-50 border-blue-500 shadow-sm"
                                                : "bg-white border-transparent hover:border-gray-200"
                                            }`}
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={normalizeUrl(getMemberAvatar(p) || "")}
                                            />
                                            <AvatarFallback>
                                                {getInitials(getMemberName(p))}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">
                                                {getMemberName(p)}
                                            </p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                                                {p.role === "CHANNEL_MODERATOR" ? "Nhóm phó" : "Thành viên"}
                                            </p>
                                        </div>
                                        {selectedSuccessor === memberId && (
                                            <Check className="w-5 h-5 text-blue-600" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Để sau
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!selectedSuccessor || isLoading}
                        onClick={onConfirm}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Chuyển quyền & Rời nhóm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}