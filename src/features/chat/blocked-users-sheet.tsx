"use client";

import { useState } from "react";
import {
    useGetBlockedUsersQuery,
    useUnblockUserMutation,
} from "@/src/redux/feature/friendApi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
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
import {
    Ban,
    UserCheck,
    Loader2,
    ShieldOff,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { getAvatarUrl } from "@/src/utils/image-utils";

interface BlockedUsersSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BlockedUsersSheet({
    isOpen,
    onClose,
}: BlockedUsersSheetProps) {
    const [userToUnblock, setUserToUnblock] = useState<{ id: string; name: string } | null>(null);

    const { data, isLoading, refetch } = useGetBlockedUsersQuery(undefined, {
        skip: !isOpen,
    });
    const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();

    const blockedUsers = data?.blockedUsers || [];

    // Handle unblock
    const handleUnblock = async () => {
        if (!userToUnblock) return;

        try {
            await unblockUser(userToUnblock.id).unwrap();
            toast.success(`Đã bỏ chặn ${userToUnblock.name}`);
            setUserToUnblock(null);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi bỏ chặn");
        }
    };

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="w-full sm:w-[400px] p-0">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <Ban className="h-5 w-5 text-red-500" />
                            Danh sách chặn
                        </SheetTitle>
                    </SheetHeader>

                    <div className="p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : blockedUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                    <ShieldOff className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                    Không có người dùng bị chặn
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                    Những người bạn chặn sẽ xuất hiện ở đây
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500 mb-4">
                                    {blockedUsers.length} người dùng bị chặn
                                </p>
                                {blockedUsers.map((blockedItem) => {
                                    const initials = blockedItem.user.name
                                        ? blockedItem.user.name
                                            .split(" ")
                                            .map((n: string) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2)
                                        : "??";

                                    return (
                                        <div
                                            key={blockedItem.id}
                                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 transition-all hover:shadow-sm"
                                        >
                                            <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-900 overflow-hidden">
                                                <AvatarImage 
                                                    src={getAvatarUrl(blockedItem.user.avatar, blockedItem.user.name)} 
                                                    alt={blockedItem.user.name} 
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-xs transition-colors group-hover:from-gray-200 group-hover:to-gray-300">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                                                    {blockedItem.user.name}
                                                </p>
                                                {blockedItem.blockedAt && (
                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                        Đã chặn {format(new Date(blockedItem.blockedAt), "HH:mm, dd MMMM yyyy", { locale: vi })}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setUserToUnblock({ id: blockedItem.user.id, name: blockedItem.user.name })}
                                                className="h-8 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-200 font-bold text-xs rounded-md shadow-sm transition-all active:scale-95"
                                            >
                                                <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                                                Bỏ chặn
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Unblock confirmation dialog */}
            <AlertDialog open={!!userToUnblock} onOpenChange={() => setUserToUnblock(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bỏ chặn {userToUnblock?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Sau khi bỏ chặn, {userToUnblock?.name} sẽ có thể:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Nhắn tin cho bạn</li>
                                <li>Xem trang cá nhân của bạn</li>
                                <li>Gửi lời mời kết bạn cho bạn</li>
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleUnblock}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={isUnblocking}
                        >
                            {isUnblocking ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Bỏ chặn
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
