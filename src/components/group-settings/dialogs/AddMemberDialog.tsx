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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials, avatarColor } from "../shared/utils";
import { getAvatarUrl } from "@/src/utils/image-utils";

interface AddMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    directorySearch: string;
    setDirectorySearch: (val: string) => void;
    availableDirectoryUsers: any[];
    directoryLoading: boolean;
    selectedFriends: string[];
    setSelectedFriends: (val: string[]) => void;
    onAddMembers: () => void;
    isAddingMembers: boolean;
}

export function AddMemberDialog({
    open,
    onOpenChange,
    directorySearch,
    setDirectorySearch,
    availableDirectoryUsers,
    directoryLoading,
    selectedFriends,
    setSelectedFriends,
    onAddMembers,
    isAddingMembers,
}: AddMemberDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <UserPlus className="w-4 h-4 text-blue-600" /> Thêm thành viên
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="Tìm theo tên hoặc email..."
                            value={directorySearch}
                            onChange={(e) => setDirectorySearch(e.target.value)}
                            className="pl-9 h-9 text-sm rounded-lg"
                        />
                    </div>
                    <ScrollArea className="h-60 border border-slate-100 rounded-xl p-2">
                        {directoryLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            </div>
                        ) : availableDirectoryUsers.length === 0 ? (
                            <p className="text-center py-8 text-xs text-slate-400">
                                {directorySearch.length < 2
                                    ? "Nhập ít nhất 2 ký tự để tìm kiếm"
                                    : "Không tìm thấy kết quả"}
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {availableDirectoryUsers.map((u: any) => (
                                    <div
                                        key={u.id}
                                        className={cn(
                                            "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all",
                                            selectedFriends.includes(u.id) ? "bg-blue-50" : "hover:bg-slate-50"
                                        )}
                                        onClick={() =>
                                            setSelectedFriends(
                                                selectedFriends.includes(u.id)
                                                    ? selectedFriends.filter((id) => id !== u.id)
                                                    : [...selectedFriends, u.id]
                                            )
                                        }
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Avatar className="h-8 w-8 rounded-lg">
                                                <AvatarImage src={getAvatarUrl(u.avatar || "", u.name)} />
                                                <AvatarFallback className={cn("rounded-lg text-xs font-semibold", avatarColor(u.name))}>
                                                    {getInitials(u.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-[13px] font-medium text-slate-800">{u.name}</p>
                                                {u.email && <p className="text-[11px] text-slate-400">{u.email}</p>}
                                            </div>
                                        </div>
                                        <Checkbox checked={selectedFriends.includes(u.id)} className="rounded" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={onAddMembers}
                        disabled={isAddingMembers || selectedFriends.length === 0}
                    >
                        {isAddingMembers && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                        Thêm ({selectedFriends.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}