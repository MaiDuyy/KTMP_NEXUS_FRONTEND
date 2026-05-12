"use client";

import { useState } from "react";
import {
    useGetFriendsQuery,
    useGetReceivedRequestsQuery,
    useGetSentRequestsQuery,
    useSendFriendRequestMutation,
    useAcceptFriendRequestMutation,
    useRejectFriendRequestMutation,
    useCancelFriendRequestMutation,
    useLazySearchFriendsQuery,
} from "@/src/redux/feature/friendApi";
import { useGetOrCreatePrivateChatMutation } from "@/src/redux/feature/chatApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    UserPlus,
    UserCheck,
    UserX,
    MessageCircle,
    Clock,
    Check,
    X,
    Users,
    MoreVertical,
    Ban,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import FriendProfileSheet from "./friend-profile-sheet";
import { getAvatarUrl } from "@/src/utils/image-utils";

interface FriendsPanelProps {
    onlineUsers: Set<string>;
    onStartChat: (chatId: string) => void;
}

type TabType = "all" | "online" | "requests" | "add";

export default function FriendsPanel({ onlineUsers, onStartChat }: FriendsPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [addQuery, setAddQuery] = useState("");
    const [selectedFriend, setSelectedFriend] = useState<any>(null);
    const [showFriendProfile, setShowFriendProfile] = useState(false);

    // API queries
    const { data: friendsData, isLoading: friendsLoading } = useGetFriendsQuery();
    const { data: receivedData } = useGetReceivedRequestsQuery();
    const { data: sentData } = useGetSentRequestsQuery();
    const [searchUsers, { data: searchData, isLoading: searchLoading }] = useLazySearchFriendsQuery();

    // Mutations
    const [sendRequest, { isLoading: sendingRequest }] = useSendFriendRequestMutation();
    const [acceptRequest] = useAcceptFriendRequestMutation();
    const [rejectRequest] = useRejectFriendRequestMutation();
    const [cancelRequest] = useCancelFriendRequestMutation();
    const [getOrCreateChat] = useGetOrCreatePrivateChatMutation();

    const friends = friendsData?.friends || [];
    const receivedRequests = receivedData?.requests || [];
    const sentRequests = sentData?.requests || [];
    const searchResults = searchData?.users || [];

    // Filter friends by search
    const filteredFriends = searchQuery
        ? friends.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : friends;

    // Filter by online
    const onlineFriends = filteredFriends.filter((f) => onlineUsers.has(f.id));

    // Handle search users
    const handleSearchUsers = () => {
        if (addQuery.trim().length >= 2) {
            searchUsers(addQuery);
        }
    };

    // Handle send friend request
    const handleSendRequest = async (userId: string) => {
        try {
            await sendRequest({ receiverId: userId }).unwrap();
            toast.success("Đã gửi lời mời kết bạn!");
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi gửi lời mời!");
        }
    };

    // Handle accept request
    const handleAccept = async (requestId: string) => {
        try {
            const result = await acceptRequest(requestId).unwrap();
            toast.success("Đã chấp nhận lời mời!");
            if (result.chatId) {
                onStartChat(result.chatId);
            }
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi!");
        }
    };

    // Handle reject request
    const handleReject = async (requestId: string) => {
        try {
            await rejectRequest(requestId).unwrap();
            toast.success("Đã từ chối lời mời!");
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi!");
        }
    };

    // Handle cancel request
    const handleCancel = async (requestId: string) => {
        try {
            await cancelRequest(requestId).unwrap();
            toast.success("Đã hủy lời mời!");
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi!");
        }
    };

    // Handle start chat
    const handleStartChat = async (friendId: string) => {
        try {
            const result = await getOrCreateChat({ partnerId: friendId }).unwrap();
            onStartChat(result.chat.id);
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi tạo chat!");
        }
    };

    const tabs = [
        { id: "all" as TabType, label: "Tất cả", count: friends.length },
        { id: "online" as TabType, label: "Online", count: onlineFriends.length },
        { id: "requests" as TabType, label: "Lời mời", count: receivedRequests.length + sentRequests.length },
        { id: "add" as TabType, label: "Thêm bạn", icon: UserPlus },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2.5 px-2 text-xs font-medium relative transition-colors flex items-center justify-center gap-1 ${activeTab === tab.id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        {tab.icon ? <tab.icon className="h-4 w-4" /> : tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <Badge
                                variant="secondary"
                                className="h-5 min-w-[20px] px-1.5 text-[10px]"
                            >
                                {tab.count}
                            </Badge>
                        )}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                    </button>
                ))}
            </div>

            {/* Search bar for friends */}
            {(activeTab === "all" || activeTab === "online") && (
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm bạn bè..."
                            className="pl-9 bg-gray-100 dark:bg-gray-700 border-0 h-9 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* All Friends / Online Friends */}
                {(activeTab === "all" || activeTab === "online") && (
                    <>
                        {friendsLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (activeTab === "online" ? onlineFriends : filteredFriends).length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                                <Users className="h-10 w-10 mb-2 text-gray-300" />
                                <p className="text-sm">
                                    {activeTab === "online" ? "Không có bạn bè online" : "Chưa có bạn bè"}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {(activeTab === "online" ? onlineFriends : filteredFriends).map((friend) => (
                                    <div
                                        key={friend.id}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setSelectedFriend(friend);
                                            setShowFriendProfile(true);
                                        }}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-11 w-11">
                                                <AvatarImage src={getAvatarUrl(friend.avatar, friend.name)} />
                                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                                                    {friend.name.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            {onlineUsers.has(friend.id) && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                {friend.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {onlineUsers.has(friend.id) ? (
                                                    <span className="text-green-500">Đang hoạt động</span>
                                                ) : friend.lastSeen ? (
                                                    `Hoạt động ${formatDistanceToNow(new Date(friend.lastSeen), { addSuffix: true, locale: vi })}`
                                                ) : (
                                                    friend.status || "Offline"
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartChat(friend.id);
                                            }}
                                        >
                                            <MessageCircle className="h-5 w-5 text-blue-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Friend Requests */}
                {activeTab === "requests" && (
                    <div>
                        {/* Received */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                                Lời mời đã nhận ({receivedRequests.length})
                            </p>
                        </div>
                        {receivedRequests.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">
                                Không có lời mời nào
                            </p>
                        ) : (
                            receivedRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-700"
                                >
                                    <Avatar className="h-11 w-11">
                                        <AvatarImage src={getAvatarUrl(request.sender?.avatar, request.sender?.name)} />
                                        <AvatarFallback className="bg-gradient-to-br from-green-400 to-teal-500 text-white">
                                            {request.sender?.name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {request.sender?.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: vi })}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 bg-green-100 hover:bg-green-200 dark:bg-green-900/30"
                                        onClick={() => handleAccept(request.id)}
                                    >
                                        <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 bg-red-100 hover:bg-red-200 dark:bg-red-900/30"
                                        onClick={() => handleReject(request.id)}
                                    >
                                        <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            ))
                        )}

                        {/* Sent */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 mt-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                                Đã gửi ({sentRequests.length})
                            </p>
                        </div>
                        {sentRequests.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">
                                Chưa gửi lời mời nào
                            </p>
                        ) : (
                            sentRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-700"
                                >
                                    <Avatar className="h-11 w-11">
                                        <AvatarImage src={getAvatarUrl(request.receiver?.avatar, request.receiver?.name)} />
                                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white">
                                            {request.receiver?.name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {request.receiver?.name}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Đang chờ phản hồi
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCancel(request.id)}
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Add Friend */}
                {activeTab === "add" && (
                    <div className="p-3">
                        <div className="flex gap-2 mb-4">
                            <Input
                                placeholder="Nhập tên hoặc email..."
                                className="bg-gray-100 dark:bg-gray-700 border-0"
                                value={addQuery}
                                onChange={(e) => setAddQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                            />
                            <Button onClick={handleSearchUsers} disabled={addQuery.length < 2}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>

                        {searchLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : searchResults.length === 0 && addQuery.length >= 2 ? (
                            <p className="text-sm text-gray-400 text-center py-6">
                                Không tìm thấy người dùng
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {searchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => {
                                            setSelectedFriend(user);
                                            setShowFriendProfile(true);
                                        }}
                                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                    >
                                        <Avatar className="h-11 w-11">
                                            <AvatarImage src={getAvatarUrl(user.avatar, user.name)} />
                                            <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                                                {user.name.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{user.status || ""}</p>
                                        </div>
                                        {user.relation === "friend" ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                <UserCheck className="h-3 w-3 mr-1" />
                                                Bạn bè
                                            </Badge>
                                        ) : user.relation === "request_sent" ? (
                                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Đã gửi
                                            </Badge>
                                        ) : user.relation === "request_received" ? (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => user.requestId && handleAccept(user.requestId)}
                                            >
                                                Chấp nhận
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => handleSendRequest(user.id)}
                                                disabled={sendingRequest}
                                            >
                                                <UserPlus className="h-4 w-4 mr-1" />
                                                Kết bạn
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Friend Profile Sheet */}
            <FriendProfileSheet
                friend={selectedFriend}
                isOpen={showFriendProfile}
                onClose={() => {
                    setShowFriendProfile(false);
                    setSelectedFriend(null);
                }}
                onStartChat={onStartChat}
                isOnline={selectedFriend ? onlineUsers.has(selectedFriend.id) : false}
            />
        </div >
    );
}
