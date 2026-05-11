import { useState, useEffect } from "react";
import { useAppSelector } from "@/src/redux/hooks";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
    MoreVertical,
    Users,
    Check,
    CheckCheck,
    PinIcon,
    Tag,
    UserMinus,
    UserPlus,
    Ban,
    Star,
    Heart,
    Briefcase,
    Loader2,
    Trash2,
    LogOut,
    PinOff,
    Pin,
    BellOff,
    Bell,
    ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import {
    useUnfriendMutation,
    useBlockUserMutation,
    useUnblockUserMutation,
    useSendFriendRequestMutation,
} from "@/src/redux/feature/friendApi";
import {
    useDeleteChatMutation,
    useToggleNotifyChatMutation,
    useLeaveChatMutation,
    useMarkChatAsReadMutation,
    useTogglePinChatMutation,
} from "@/src/redux/feature/chatApi";
import { Chat } from "@/src/type/chat.types";
import { socketService } from "@/src/services/socket.service";
import { LeaveGroupDialog } from "@/src/components/group-settings/dialogs";

// Định nghĩa lại Categories
const FRIEND_CATEGORIES = [
    { id: "favorite", label: "Yêu thích", icon: Star, color: "text-yellow-500" },
    { id: "family", label: "Gia đình", icon: Heart, color: "text-red-500" },
    { id: "work", label: "Công việc", icon: Briefcase, color: "text-blue-500" },
    { id: "friend", label: "Bạn bè", icon: Users, color: "text-green-500" },
];

interface ChatItemProps {
    chat: Chat; // Thay any bằng interface Chat của bạn
    isSelected: boolean;
    isOnline: boolean;
    isTyping: boolean;
    typingUserNames: string;
    onSelectChat: (id: string) => void;
    isFriend?: boolean; // true nếu đã là bạn (chat 1-1)
}

export const ChatItem = ({
    chat,
    isSelected,
    isOnline,
    isTyping,
    typingUserNames,
    onSelectChat,
    isFriend = true, // Mặc định là bạn bè cho chat 1-1
}: ChatItemProps) => {
    const [showUnfriendDialog, setShowUnfriendDialog] = useState(false);
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [showDeleteChatDialog, setShowDeleteChatDialog] = useState(false);
    const [showLeaveGroupDialog, setShowLeaveGroupDialog] = useState(false);

    // Giả lập category hiện tại
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    // API mutations
    const [unfriend, { isLoading: isUnfriending }] = useUnfriendMutation();
    const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
    const [sendFriendRequest, { isLoading: isSendingRequest }] = useSendFriendRequestMutation();
    const [deleteChat, { isLoading: isDeleting }] = useDeleteChatMutation();
    const [togglePinChat] = useTogglePinChatMutation();
    const [toggleNotifyChat] = useToggleNotifyChatMutation();
    const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();
    const [leaveChat, { isLoading: isLeaving }] = useLeaveChatMutation();
    const [markAsRead] = useMarkChatAsReadMutation();

    // useEffect(() => {
    //     if (isSelected && chat.unreadCount > 0) {
    //         markAsRead(chat.id);
    //     }
    // }, []);

    const handleSelectChat = () => {
        onSelectChat(chat.id);
        if (chat.unreadCount > 0) {
            // Chuyển sang dùng WebSocket Flow (Scalable)
            socketService.markRead(chat.id, chat.lastMessage?.id);
        }
    };
    //   const { data: accountData } = useGetAccountDetailsQuery();
    //   const user = accountData?.user;
    const { user: currentUser } = useAppSelector((state) => state.auth);

    // Xử lý logic hiển thị tên và avatar cho chat 1-1
    const getChatPartner = () => {
        if (chat.isGroup) return null;
        return chat.participants?.find(p => p.accountId !== currentUser?.id);
    };

    const partner = getChatPartner();
    const displayName = chat.name || partner?.name || "Người dùng";
    const rawAvatar = chat.avatar || partner?.avatar;

    const getAvatarUrl = (url: string | null | undefined, name: string) => {
        if (!url) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
            return url;
        }
        return `https://${url}`;
    };

    const imageUrl = getAvatarUrl(rawAvatar, displayName);

    const initials = displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Xử lý logic hiển thị thời gian
    const lastMessageTime = chat.lastMessage?.time
        ? formatDistanceToNow(new Date(chat.lastMessage.time), {
            addSuffix: true,
            locale: vi,
        })
        : "";

    // Lấy ID của người chat trong chat 1-1
    // const getPartnerId = () => chat.participants?.[0]?.accountId;
    const getPartnerId = () => {
        if (chat.isGroup) return null;
        return chat.participants?.find(p => p.accountId !== currentUser?.id)?.accountId;
    };

    // --- Handlers ---
    const handleSendFriendRequest = async () => {
        try {
            const partnerId = getPartnerId();
            if (!partnerId) return;

            await sendFriendRequest({ receiverId: partnerId }).unwrap();
            toast.success(`Đã gửi lời mời kết bạn đến ${chat.name}`);
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi gửi lời mời kết bạn");
        }
    };

    const handleUnfriend = async () => {
        try {
            const friendId = getPartnerId();
            if (!friendId) return;

            console.log(friendId);

            await unfriend(friendId).unwrap();
            toast.success(`Đã hủy kết bạn với ${displayName}`);
            setShowUnfriendDialog(false);
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi hủy kết bạn");
        }
    };
    const handleBlock = async () => {
        try {
            const friendId = getPartnerId();
            if (!friendId) return;

            await blockUser(friendId).unwrap();
            toast.success(`Đã chặn ${displayName}`);
            setShowBlockDialog(false);
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi chặn người dùng");
        }
    };

    const handleUnblock = async () => {
        try {
            const friendId = getPartnerId();
            if (!friendId) return;

            await unblockUser(friendId).unwrap();
            toast.success(`Đã mở chặn ${displayName}`);
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi mở chặn người dùng");
        }
    };

    const handleDeleteChat = async () => {
        try {
            if (!chat?.id) {
                toast.error("Không tìm thấy cuộc hội thoại");
                return;
            }
            await deleteChat(chat.id).unwrap();
            toast.success("Đã xóa cuộc hội thoại");
            setShowDeleteChatDialog(false);
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi xóa cuộc hội thoại");
        }
    };

    const handleTogglePin = async () => {
        try {
            if (!chat?.id) {
                toast.error("Không tìm thấy cuộc hội thoại");
                return;
            }
            await togglePinChat({ chatId: chat.id, pin: !chat.pin }).unwrap();
            toast.success(chat.pin ? "Đã bỏ ghim" : "Đã ghim cuộc hội thoại");
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi ghim cuộc hội thoại");
        }
    };

    const handleToggleNotify = async () => {
        try {
            if (!chat?.id) {
                toast.error("Không tìm thấy cuộc hội thoại");
                return;
            }
            await toggleNotifyChat({ chatId: chat.id, notify: chat.notify === false }).unwrap();
            toast.success(chat.notify === false ? "Đã bật thông báo" : "Đã tắt thông báo");
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi thay đổi thông báo");
        }
    };

    const handleLeaveGroup = async () => {
        try {
            if (!chat?.id) {
                toast.error("Không tìm thấy cuộc hội thoại");
                return;
            }
            await leaveChat(chat.id).unwrap();
            toast.success("Đã rời khỏi nhóm");
            setShowLeaveGroupDialog(false);
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi rời nhóm");
        }
    };

    const handleCategoryChange = (categoryId: string) => {
        // Gọi API update category ở đây
        setSelectedCategory(categoryId);
        toast.success("Đã cập nhật phân loại");
    };

    return (
        <>
            <div
                onClick={handleSelectChat}
                className={`
          group relative flex items-center gap-3 p-3 cursor-pointer transition-all duration-200
          hover:bg-blue-50 dark:hover:bg-gray-700
          ${isSelected ? "bg-blue-100 dark:bg-gray-700 border-l-4 border-blue-500" : ""}
          ${!chat.readed ? "bg-blue-50/50 dark:bg-gray-800/50" : ""}
        `}
            >
                {/* Avatar Section */}
                <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-800">
                        <AvatarImage src={imageUrl} alt={displayName} />
                        <AvatarFallback
                            className={`${chat.isGroup
                                ? "bg-gradient-to-br from-green-400 to-green-600"
                                : "bg-gradient-to-br from-blue-400 to-blue-600"
                                } text-white font-medium`}
                        >
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {!chat.isGroup && isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                    )}
                    {chat.isGroup && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Users className="w-3 h-3 text-white" />
                        </span>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                            {chat.pin && <PinIcon className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                            <span
                                className={`font-semibold truncate ${!chat.readed
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-gray-300"
                                    }`}
                            >
                                {displayName}
                            </span>

                            {/* Hiển thị Icon category nếu có */}
                            {selectedCategory && (
                                <Badge variant="outline" className="h-5 px-1 ml-1 hidden sm:flex">
                                    {(() => {
                                        const CatIcon = FRIEND_CATEGORIES.find(c => c.id === selectedCategory)?.icon;
                                        return CatIcon ? <CatIcon className="w-3 h-3" /> : null;
                                    })()}
                                </Badge>
                            )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {lastMessageTime}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <p
                            className={`text-sm truncate flex-1 ${!chat.readed
                                ? "text-gray-800 dark:text-gray-200 font-medium"
                                : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            {isTyping ? (
                                <span className="text-blue-500 italic">
                                    {chat.isGroup
                                        ? `${typingUserNames} đang gõ...`
                                        : "Đang gõ..."}
                                </span>
                            ) : chat.lastMessage ? (
                                <>
                                    {chat.lastMessage.sender.id === "me" && (
                                        <span className="mr-1 inline-block align-middle">
                                            {chat.readed ? (
                                                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                            ) : (
                                                <Check className="w-3.5 h-3.5" />
                                            )}
                                        </span>
                                    )}
                                    {(() => {
                                        const t = chat.lastMessage.type;
                                        if (t === "text") return chat.lastMessage.content;
                                        if (t === "call_ended") return "📞 Cuộc gọi";
                                        if (t === "call_missed") return "📵 Cuộc gọi nhỡ";
                                        if (t === "call_declined") return "📵 Từ chối cuộc gọi";
                                        if (t === "image") return "🖼️ Hình ảnh";
                                        if (t === "video") return "🎥 Video";
                                        if (t === "file") return "📎 Tệp đính kèm";
                                        if (t === "audio") return "🎵 Âm thanh";
                                        if (t === "sticker" || t === "gif") return "🎭 Sticker";
                                        return `[${t}]`;
                                    })()}
                                </>
                            ) : (
                                <span className="italic">Bắt đầu trò chuyện...</span>
                            )}
                        </p>

                        {/* Unread Badge - Ẩn nếu đang được chọn/đang chat */}
                        {chat.unreadCount > 0 && !isSelected && (
                            <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center rounded-full animate-in zoom-in duration-300">
                                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                            </Badge>
                        )}

                        {/* DROPDOWN MENU TRIGGER */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md shadow-sm">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4 text-gray-500" />
                                    </Button>
                                </DropdownMenuTrigger>

                                {/* Menu cho chat 1-1 */}
                                {!chat.isGroup ? (
                                    <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
                                        {/* Ghim/Bỏ ghim */}
                                        <DropdownMenuItem onClick={handleTogglePin}>
                                            {chat.pin ? (
                                                <>
                                                    <PinOff className="h-4 w-4 mr-2" />
                                                    Bỏ ghim
                                                </>
                                            ) : (
                                                <>
                                                    <Pin className="h-4 w-4 mr-2" />
                                                    Ghim cuộc trò chuyện
                                                </>
                                            )}
                                        </DropdownMenuItem>

                                        {/* Tắt/Bật thông báo */}
                                        <DropdownMenuItem onClick={handleToggleNotify}>
                                            {chat.notify === false ? (
                                                <>
                                                    <Bell className="h-4 w-4 mr-2" />
                                                    Bật thông báo
                                                </>
                                            ) : (
                                                <>
                                                    <BellOff className="h-4 w-4 mr-2" />
                                                    Tắt thông báo
                                                </>
                                            )}
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        {/* Category selection */}
                                        <DropdownMenuItem className="font-medium text-gray-500" disabled>
                                            <Tag className="h-4 w-4 mr-2" />
                                            Phân loại
                                        </DropdownMenuItem>
                                        {FRIEND_CATEGORIES.map((cat) => (
                                            <DropdownMenuItem
                                                key={cat.id}
                                                onClick={() => handleCategoryChange(cat.id)}
                                                className={selectedCategory === cat.id ? "bg-gray-100 dark:bg-gray-700" : ""}
                                            >
                                                <cat.icon className={`h-4 w-4 mr-2 ${cat.color}`} />
                                                {cat.label}
                                            </DropdownMenuItem>
                                        ))}

                                        <DropdownMenuSeparator />

                                        {/* Kết bạn hoặc Hủy kết bạn tùy trạng thái */}
                                        {isFriend ? (
                                            <DropdownMenuItem
                                                onClick={() => setShowUnfriendDialog(true)}
                                                className="text-orange-600 focus:text-orange-700"
                                            >
                                                <UserMinus className="h-4 w-4 mr-2" />
                                                Hủy kết bạn
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                onClick={handleSendFriendRequest}
                                                disabled={isSendingRequest}
                                                className="text-blue-600 focus:text-blue-700"
                                            >
                                                {isSendingRequest ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                )}
                                                Kết bạn
                                            </DropdownMenuItem>
                                        )}

                                        {chat.isBlocked ? (
                                            chat.isBlockedByMe && (
                                                <DropdownMenuItem
                                                    onClick={handleUnblock}
                                                    disabled={isUnblocking}
                                                    className="text-emerald-600 focus:text-emerald-700 font-bold"
                                                >
                                                    {isUnblocking ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <ShieldCheck className="h-4 w-4 mr-2" />
                                                    )}
                                                    Mở chặn
                                                </DropdownMenuItem>
                                            )
                                        ) : (
                                            <DropdownMenuItem
                                                onClick={() => setShowBlockDialog(true)}
                                                className="text-red-600 focus:text-red-700"
                                            >
                                                <Ban className="h-4 w-4 mr-2" />
                                                Chặn
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator />

                                        {/* Xóa cuộc hội thoại */}
                                        <DropdownMenuItem
                                            onClick={() => setShowDeleteChatDialog(true)}
                                            className="text-red-600 focus:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Xóa cuộc hội thoại
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                ) : (
                                    // Menu cho Group
                                    <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
                                        {/* Ghim/Bỏ ghim */}
                                        <DropdownMenuItem onClick={handleTogglePin}>
                                            {chat.pin ? (
                                                <>
                                                    <PinOff className="h-4 w-4 mr-2" />
                                                    Bỏ ghim
                                                </>
                                            ) : (
                                                <>
                                                    <Pin className="h-4 w-4 mr-2" />
                                                    Ghim cuộc trò chuyện
                                                </>
                                            )}
                                        </DropdownMenuItem>

                                        {/* Tắt/Bật thông báo */}
                                        <DropdownMenuItem onClick={handleToggleNotify}>
                                            {chat.notify === false ? (
                                                <>
                                                    <Bell className="h-4 w-4 mr-2" />
                                                    Bật thông báo
                                                </>
                                            ) : (
                                                <>
                                                    <BellOff className="h-4 w-4 mr-2" />
                                                    Tắt thông báo
                                                </>
                                            )}
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        {/* Rời nhóm */}
                                        <DropdownMenuItem
                                            onClick={() => setShowLeaveGroupDialog(true)}
                                            className="text-orange-600 focus:text-orange-700"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Rời nhóm
                                        </DropdownMenuItem>

                                        {/* Xóa cuộc hội thoại */}
                                        <DropdownMenuItem
                                            onClick={() => setShowDeleteChatDialog(true)}
                                            className="text-red-600 focus:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Xóa cuộc hội thoại
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                )}
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Dialogs --- */}
            <div onClick={(e) => e.stopPropagation()}>
                {/* Hủy kết bạn */}
                <AlertDialog open={showUnfriendDialog} onOpenChange={setShowUnfriendDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hủy kết bạn với {displayName}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn sẽ không còn là bạn bè. Tuy nhiên lịch sử trò chuyện vẫn được giữ lại.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={handleUnfriend} className="bg-orange-600 hover:bg-orange-700">
                                {isUnfriending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Đồng ý
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Chặn */}
                <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Chặn {displayName}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Người này sẽ không thể nhắn tin hay tìm thấy bạn nữa.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBlock} className="bg-red-600 hover:bg-red-700">
                                {isBlocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Chặn ngay
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Xóa cuộc hội thoại */}
                <AlertDialog open={showDeleteChatDialog} onOpenChange={setShowDeleteChatDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xóa cuộc hội thoại?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cuộc hội thoại này sẽ bị xóa khỏi danh sách của bạn. Bạn vẫn có thể bắt đầu trò chuyện mới sau.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteChat} className="bg-red-600 hover:bg-red-700">
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Xóa
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Rời nhóm */}

                <LeaveGroupDialog open={showLeaveGroupDialog} onOpenChange={setShowLeaveGroupDialog} groupName={displayName}
                    onConfirm={handleLeaveGroup}
                    isLoading={isLeaving}
                />

            </div>
        </>
    );
};