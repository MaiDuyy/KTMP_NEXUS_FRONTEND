"use client";

import { useState } from "react";
import { useSearchDirectoryQuery } from "@/src/redux/feature/userApi";
import {
    useGetOrCreatePrivateChatMutation,
    useCreateGroupChatMutation,
} from "@/src/redux/feature/chatApi";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Users, MessageCircle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAvatarUrl } from "@/src/utils/image-utils";
import { useSelector } from "react-redux";
import { RootState } from "@/src/redux/store";
import { useEffect } from "react";

interface NewChatModalProps {
    open: boolean;
    onClose: () => void;
    onChatCreated: (chatId: string) => void;
}

type TabType = "private" | "group";

export default function NewChatModal({
    open,
    onClose,
    onChatCreated,
}: NewChatModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("private");
    const [searchQuery, setSearchQuery] = useState("");
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const { data: directoryData, isLoading: directoryLoading } = useSearchDirectoryQuery({
        searchTerm: debouncedSearch,
        workspaceId: currentWorkspaceId || undefined
    }, {
        // skip: debouncedSearch.length < 2
    });

    const [createPrivateChat, { isLoading: creatingPrivate }] =
        useGetOrCreatePrivateChatMutation();
    const [createGroupChat, { isLoading: creatingGroup }] =
        useCreateGroupChatMutation();

    const users = directoryData?.users || [];

    // Handle create private chat
    const handleCreatePrivateChat = async (friendId: string) => {
        try {
            const result = await createPrivateChat({ partnerId: friendId }).unwrap();
            onChatCreated(result.chat.id);
            handleClose();
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi tạo chat!");
        }
    };

    // Handle create group chat
    const handleCreateGroupChat = async () => {
        if (!groupName.trim()) {
            toast.error("Vui lòng nhập tên nhóm!");
            return;
        }
        if (selectedMembers.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 thành viên!");
            return;
        }

        try {
            const result = await createGroupChat({
                name: groupName.trim(),
                memberIds: selectedMembers,
            }).unwrap();
            toast.success("Tạo nhóm thành công!");
            onChatCreated(result.chat.id);
            handleClose();
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi tạo nhóm!");
        }
    };

    // Toggle member selection
    const toggleMember = (memberId: string) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    // Reset state on close
    const handleClose = () => {
        setSearchQuery("");
        setGroupName("");
        setSelectedMembers([]);
        setActiveTab("private");
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Cuộc trò chuyện mới</DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button
                        onClick={() => setActiveTab("private")}
                        className={`flex-1 py-3 text-sm font-medium relative flex items-center justify-center gap-2 ${activeTab === "private"
                                ? "text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <MessageCircle className="h-4 w-4" />
                        Chat 1-1
                        {activeTab === "private" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("group")}
                        className={`flex-1 py-3 text-sm font-medium relative flex items-center justify-center gap-2 ${activeTab === "group"
                                ? "text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Users className="h-4 w-4" />
                        Tạo nhóm
                        {activeTab === "group" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                    </button>
                </div>

                {/* Group name input */}
                {activeTab === "group" && (
                    <div className="mb-4">
                        <Label htmlFor="groupName" className="text-sm font-medium mb-2 block">
                            Tên nhóm
                        </Label>
                        <Input
                            id="groupName"
                            placeholder="Nhập tên nhóm..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="bg-gray-100 dark:bg-gray-700 border-0"
                        />
                    </div>
                )}

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm bạn bè..."
                        className="pl-9 bg-gray-100 dark:bg-gray-700 border-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Selected members count */}
                {activeTab === "group" && selectedMembers.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-blue-600">
                        <Check className="h-4 w-4" />
                        Đã chọn {selectedMembers.length} thành viên
                    </div>
                )}

                {/* Directory list */}
                <div className="max-h-64 overflow-y-auto space-y-1">
                    {directoryLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <p className="text-xs">Đang tìm kiếm...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">
                            {searchQuery.length < 2
                                ? "Nhập tên hoặc email để tìm kiếm"
                                : "Không tìm thấy người dùng phù hợp"}
                        </p>
                    ) : (
                        users.map((user) => (
                            <div
                                key={user.id}
                                onClick={() =>
                                    activeTab === "private"
                                        ? handleCreatePrivateChat(user.id)
                                        : toggleMember(user.id)
                                }
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === "group" && selectedMembers.includes(user.id)
                                        ? "bg-blue-50 dark:bg-blue-900/30"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {activeTab === "group" && (
                                    <Checkbox
                                        checked={selectedMembers.includes(user.id)}
                                        onCheckedChange={() => toggleMember(user.id)}
                                        className="pointer-events-none"
                                    />
                                )}
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={getAvatarUrl(user.avatar, user.name)} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                                        {user.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {user.email || user.status || ""}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Create group button */}
                {activeTab === "group" && (
                    <div className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleClose}
                        >
                            Hủy
                        </Button>
                        <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={handleCreateGroupChat}
                            disabled={creatingGroup || !groupName.trim() || selectedMembers.length === 0}
                        >
                            {creatingGroup ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang tạo...
                                </span>
                            ) : (
                                <>
                                    <Users className="h-4 w-4 mr-2" />
                                    Tạo nhóm
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
