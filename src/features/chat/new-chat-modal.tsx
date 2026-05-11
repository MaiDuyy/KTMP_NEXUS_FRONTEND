"use client";

import { useState } from "react";
import { useGetFriendsQuery } from "@/src/redux/feature/friendApi";
import {
    useGetOrCreatePrivateChatMutation,
    useCreateGroupChatMutation,
} from "@/src/redux/feature/chatApi";
import { Friend } from "@/src/type/chat.types";
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
import { Search, Users, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";

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

    const { data: friendsData } = useGetFriendsQuery();
    const [createPrivateChat, { isLoading: creatingPrivate }] =
        useGetOrCreatePrivateChatMutation();
    const [createGroupChat, { isLoading: creatingGroup }] =
        useCreateGroupChatMutation();

    const friends = friendsData?.friends || [];
    const filteredFriends = searchQuery
        ? friends.filter((f) =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : friends;

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

                {/* Friends list */}
                <div className="max-h-64 overflow-y-auto space-y-1">
                    {filteredFriends.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">
                            {friends.length === 0
                                ? "Chưa có bạn bè. Hãy thêm bạn bè trước!"
                                : "Không tìm thấy bạn bè"}
                        </p>
                    ) : (
                        filteredFriends.map((friend) => (
                            <div
                                key={friend.id}
                                onClick={() =>
                                    activeTab === "private"
                                        ? handleCreatePrivateChat(friend.id)
                                        : toggleMember(friend.id)
                                }
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === "group" && selectedMembers.includes(friend.id)
                                        ? "bg-blue-50 dark:bg-blue-900/30"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {activeTab === "group" && (
                                    <Checkbox
                                        checked={selectedMembers.includes(friend.id)}
                                        onCheckedChange={() => toggleMember(friend.id)}
                                        className="pointer-events-none"
                                    />
                                )}
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={friend.avatar || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                                        {friend.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {friend.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {friend.status || ""}
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
