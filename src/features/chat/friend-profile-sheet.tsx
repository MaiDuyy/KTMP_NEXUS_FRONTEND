"use client";

import { useState } from "react";
import {
    useUnfriendMutation,
    useBlockUserMutation,
    useUnblockUserMutation,
    useSendFriendRequestMutation,
} from "@/src/redux/feature/friendApi";
import { useGetOrCreatePrivateChatMutation } from "@/src/redux/feature/chatApi";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    MessageCircle,
    Phone,
    Video,
    MoreVertical,
    UserMinus,
    UserPlus,
    UserCheck,
    Ban,
    ShieldCheck,
    Star,
    Heart,
    Briefcase,
    Users,
    Tag,
    Loader2,
    Mail,
    Calendar,
    MapPin,
    Info,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { getAvatarUrl } from "@/src/utils/image-utils";

// Friend category tags like Zalo
// const FRIEND_CATEGORIES = [
//     { id: "favorite", label: "Yêu thích", icon: Star, color: "text-yellow-500 bg-yellow-500/10" },
//     { id: "family", label: "Gia đình", icon: Heart, color: "text-red-500 bg-red-500/10" },
//     { id: "work", label: "Công việc", icon: Briefcase, color: "text-blue-500 bg-blue-500/10" },
//     { id: "friend", label: "Bạn bè", icon: Users, color: "text-green-500 bg-green-500/10" },
// ];

interface Friend {
    id: string;
    name: string;
    avatar: string | null;
    email?: string;
    number?: string;
    status?: string;
    birthDate?: string;
    location?: string;
    category?: string;
    lastSeen?: string;
    isOnline?: boolean;
    relation?: "none" | "friend" | "request_sent" | "request_received" | "blocked";
}

interface FriendProfileSheetProps {
    friend: Friend | null;
    isOpen: boolean;
    onClose: () => void;
    onStartChat?: (chatId: string) => void;
    isOnline?: boolean;
}

export default function FriendProfileSheet({
    friend,
    isOpen,
    onClose,
    onStartChat,
    isOnline = false,
}: FriendProfileSheetProps) {
    const [showUnfriendDialog, setShowUnfriendDialog] = useState(false);
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>(() => {
        if (typeof window !== 'undefined' && friend?.id) {
            try {
                const categories = JSON.parse(localStorage.getItem('friend_categories') || '{}');
                return categories[friend.id] || friend.category || "";
            } catch (e) {
                return friend?.category || "";
            }
        }
        return friend?.category || "";
    });

    const [unfriend, { isLoading: isUnfriending }] = useUnfriendMutation();
    const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
    const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();
    const [sendRequest, { isLoading: isSendingRequest }] = useSendFriendRequestMutation();
    const [getOrCreateChat, { isLoading: isCreatingChat }] = useGetOrCreatePrivateChatMutation();

    if (!friend) return null;

    const relation = friend.relation || "friend";

    console.log("friend " , friend);
    
    const initials = friend.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Handle start chat
    const handleStartChat = async () => {
        try {
            const result = await getOrCreateChat({ partnerId: friend.id }).unwrap();
            onClose();
            onStartChat?.(result.chat.id);
            toast.success("Đã mở cuộc trò chuyện");
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi mở chat");
        }
    };

    // Handle unfriend
    const handleUnfriend = async () => {
        try {
            await unfriend(friend.id).unwrap();
            toast.success(`Đã hủy kết bạn với ${friend.name}`);
            setShowUnfriendDialog(false);
            onClose();
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi hủy kết bạn");
        }
    };

    // Handle block
    const handleBlock = async () => {
        try {
            await blockUser(friend.id).unwrap();
            toast.success(`Đã chặn ${friend.name}`);
            setShowBlockDialog(false);
            onClose();
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi chặn người dùng");
        }
    };

    // Handle unblock
    const handleUnblock = async () => {
        try {
            await unblockUser(friend.id).unwrap();
            toast.success(`Đã bỏ chặn ${friend.name}`);
            onClose();
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi bỏ chặn người dùng");
        }
    };

    // Handle send friend request
    const handleSendRequest = async () => {
        try {
            await sendRequest({ receiverId: friend.id }).unwrap();
            toast.success("Đã gửi lời mời kết bạn!");
            onClose();
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi gửi lời mời!");
        }
    };

    // Handle category change
    // const handleCategoryChange = (categoryId: string) => {
    //     setSelectedCategory(categoryId);
    //     toast.success(`Đã phân loại ${friend.name} vào ${FRIEND_CATEGORIES.find(c => c.id === categoryId)?.label}`);
        
    //     // Save to localStorage as a temporary solution
    //     if (typeof window !== 'undefined' && friend?.id) {
    //         try {
    //             const categories = JSON.parse(localStorage.getItem('friend_categories') || '{}');
    //             categories[friend.id] = categoryId;
    //             localStorage.setItem('friend_categories', JSON.stringify(categories));
    //         } catch (e) {
    //             console.error("Failed to save category to localStorage", e);
    //         }
    //     }
    // };

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="w-full sm:w-[400px] p-0 overflow-y-auto">
                    {/* Header with gradient background */}
                    <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    {/* Profile avatar */}
                    <div className="relative px-6 -mt-16">
                        <div className="relative inline-block">
                            <Avatar className="h-28 w-28 ring-4 ring-white dark:ring-gray-800 shadow-xl">
                                <AvatarImage src={getAvatarUrl(friend.avatar, friend.name)} alt={friend.name} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-2xl">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {/* Online status */}
                            <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-3 border-white dark:border-gray-800 ${isOnline ? "bg-green-500" : "bg-gray-400"
                                }`} />
                        </div>

                        {/* More options */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-4 right-0"
                                >
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {/* Category selection */}
                                {/* <DropdownMenuItem className="font-medium text-gray-500" disabled>
                                    <Tag className="h-4 w-4 mr-2" />
                                    Phân loại
                                </DropdownMenuItem>
                                {FRIEND_CATEGORIES.map((cat) => (
                                    <DropdownMenuItem
                                        key={cat.id}
                                        onClick={() => handleCategoryChange(cat.id)}
                                        className={selectedCategory === cat.id ? "bg-gray-100 dark:bg-gray-700" : ""}
                                    >
                                        <cat.icon className={`h-4 w-4 mr-2 ${cat.color.split(" ")[0]}`} />
                                        {cat.label}
                                        {selectedCategory === cat.id && (
                                            <span className="ml-auto text-blue-500">✓</span>
                                        )}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator /> */}
                                {/* Actions based on relation */}
                                {relation === "friend" && (
                                    <DropdownMenuItem
                                        onClick={() => setShowUnfriendDialog(true)}
                                        className="text-orange-600"
                                    >
                                        <UserMinus className="h-4 w-4 mr-2" />
                                        Hủy kết bạn
                                    </DropdownMenuItem>
                                )}
                                {(relation === "none" || relation === "request_received") && (
                                    <DropdownMenuItem
                                        onClick={handleSendRequest}
                                        disabled={isSendingRequest}
                                        className="text-blue-600"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Kết bạn
                                    </DropdownMenuItem>
                                )}
                                {relation === "blocked" ? (
                                    <DropdownMenuItem
                                        onClick={handleUnblock}
                                        disabled={isUnblocking}
                                        className="text-emerald-600 font-bold"
                                    >
                                        <ShieldCheck className="h-4 w-4 mr-2" />
                                        Mở chặn
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        onClick={() => setShowBlockDialog(true)}
                                        className="text-red-600"
                                    >
                                        <Ban className="h-4 w-4 mr-2" />
                                        Chặn người này
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Profile info */}
                    <div className="px-6 pt-4 pb-6 space-y-6">
                        {/* Name and status */}
                        <div>
                            <h2 className="text-2xl font-bold">{friend.name}</h2>
                            <p className={`text-sm ${isOnline ? "text-green-500" : "text-gray-500"}`}>
                                {isOnline ? "Đang hoạt động" : friend.lastSeen ?
                                    `Hoạt động ${format(new Date(friend.lastSeen), "dd/MM 'lúc' HH:mm", { locale: vi })}` :
                                    "Offline"
                                }
                            </p>
                        </div>

                        {/* Category badge
                        {selectedCategory && (
                            <div className="flex items-center gap-2">
                                {FRIEND_CATEGORIES.filter(c => c.id === selectedCategory).map((cat) => (
                                    <Badge key={cat.id} variant="secondary" className={cat.color}>
                                        <cat.icon className="h-3 w-3 mr-1" />
                                        {cat.label}
                                    </Badge>
                                ))}
                            </div>
                        )} */}

                        {/* Quick actions */}
                        <div className="flex gap-3">
                            <Button
                                className="flex-1 gap-2"
                                onClick={handleStartChat}
                                disabled={isCreatingChat}
                            >
                                {isCreatingChat ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <MessageCircle className="h-4 w-4" />
                                )}
                                Nhắn tin
                            </Button>
                            <Button variant="outline" size="icon">
                                <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                                <Video className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Bio */}
                        {friend.status && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                                    "{friend.status}"
                                </p>
                            </div>
                        )}

                        {/* Personal info */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Thông tin cá nhân
                            </h3>

                            <div className="space-y-3">
                                {friend.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-300">{friend.email}</span>
                                    </div>
                                )}
                                {friend.number && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-300">{friend.number}</span>
                                    </div>
                                )}
                                {friend.birthDate && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {format(new Date(friend.birthDate), "dd 'tháng' MM, yyyy", { locale: vi })}
                                        </span>
                                    </div>
                                )}
                                {friend.location   && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-300">{friend.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Friend categories section */}
                        {/* <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Phân loại bạn bè
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {FRIEND_CATEGORIES.map((cat) => (
                                    <Button
                                        key={cat.id}
                                        variant={selectedCategory === cat.id ? "default" : "outline"}
                                        size="sm"
                                        className={`justify-start gap-2 ${selectedCategory === cat.id ? "" : cat.color
                                            }`}
                                        onClick={() => handleCategoryChange(cat.id)}
                                    >
                                        <cat.icon className="h-4 w-4" />
                                        {cat.label}
                                    </Button>
                                ))}
                            </div>
                        </div> */}

                        {/* Danger zone */}
                        <div className="pt-4 border-t space-y-3">
                            {relation === "friend" && (
                                <Button
                                    variant="outline"
                                    className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    onClick={() => setShowUnfriendDialog(true)}
                                >
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Hủy kết bạn
                                </Button>
                            )}
                            {(relation === "none" || relation === "request_received") && (
                                <Button
                                    variant="outline"
                                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={handleSendRequest}
                                    disabled={isSendingRequest}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Kết bạn
                                </Button>
                            )}
                            {relation === "request_sent" && (
                                <Button
                                    variant="outline"
                                    className="w-full text-orange-600"
                                    disabled
                                >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Đã gửi lời mời
                                </Button>
                            )}
                            {relation === "blocked" ? (
                                <Button
                                    variant="outline"
                                    className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={handleUnblock}
                                    disabled={isUnblocking}
                                >
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Mở chặn
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setShowBlockDialog(true)}
                                >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Chặn người này
                                </Button>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Unfriend confirmation dialog */}
            <AlertDialog open={showUnfriendDialog} onOpenChange={setShowUnfriendDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hủy kết bạn với {friend.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn sẽ không còn là bạn bè với {friend.name}. Bạn vẫn có thể nhắn tin nhưng cần gửi lời mời kết bạn lại nếu muốn kết bạn.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleUnfriend}
                            className="bg-orange-600 hover:bg-orange-700"
                            disabled={isUnfriending}
                        >
                            {isUnfriending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Hủy kết bạn
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Block confirmation dialog */}
            <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Chặn {friend.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Khi chặn, {friend.name} sẽ không thể:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Nhắn tin cho bạn</li>
                                <li>Xem trang cá nhân của bạn</li>
                                <li>Gửi lời mời kết bạn cho bạn</li>
                            </ul>
                            Bạn có thể bỏ chặn bất cứ lúc nào trong phần Cài đặt.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBlock}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isBlocking}
                        >
                            {isBlocking ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Chặn
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
