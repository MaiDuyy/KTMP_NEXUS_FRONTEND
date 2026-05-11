"use client";

import {
    useGetNotificationsQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation,
} from "@/src/redux/feature/notificationApi";
import { Notification, NotificationType } from "@/src/type/chat.types";
import { Button } from "@/components/ui/button";
import {
    Bell,
    UserPlus,
    UserCheck,
    MessageCircle,
    Users,
    AtSign,
    Heart,
    AlertCircle,
    Check,
    Trash2,
    CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
    FRIEND_REQUEST: <UserPlus className="h-5 w-5 text-blue-500" />,
    FRIEND_ACCEPTED: <UserCheck className="h-5 w-5 text-green-500" />,
    NEW_MESSAGE: <MessageCircle className="h-5 w-5 text-purple-500" />,
    GROUP_INVITE: <Users className="h-5 w-5 text-indigo-500" />,
    GROUP_REMOVED: <Users className="h-5 w-5 text-red-500" />,
    WORKSPACE_INVITE: <Users className="h-5 w-5 text-blue-500" />,
    MENTION: <AtSign className="h-5 w-5 text-orange-500" />,
    REACTION: <Heart className="h-5 w-5 text-pink-500" />,
    SYSTEM: <AlertCircle className="h-5 w-5 text-gray-500" />,
};

export default function NotificationsPanel() {
    const router = useRouter();
    const { data, isLoading, refetch } = useGetNotificationsQuery();
    const [markAsRead] = useMarkNotificationAsReadMutation();
    const [markAllRead] = useMarkAllAsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    console.log("notifications", notifications);
    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsRead(id).unwrap();
        } catch (error) {
            console.error("Mark as read error:", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllRead().unwrap();
        } catch (error) {
            console.error("Mark all read error:", error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteNotification(id).unwrap();
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <span className="font-medium text-gray-900 dark:text-white">
                        Thông báo
                    </span>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllRead}
                        className="text-blue-600 hover:text-blue-700"
                    >
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Đọc tất cả
                    </Button>
                )}
            </div>

            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                        <Bell className="h-12 w-12 mb-3 text-gray-300" />
                        <p className="text-sm">Chưa có thông báo</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                className={`flex gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${!notification.isRead ? "bg-blue-50/50 dark:bg-gray-800" : ""
                                    }`}
                            >
                                {/* Icon */}
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    {NOTIFICATION_ICONS[notification.type]}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!notification.isRead ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                                        {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                        {notification.body}
                                    </p>
                                    {notification.data?.action && (
                                        <div className="mt-2">
                                            <Button
                                                variant="secondary" // Sử dụng variant của shadcn (có thể đổi thành 'default' hoặc 'outline' tuỳ ý)
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Ngăn click lan ra div cha
                                                    if (notification.data?.action.type === 'NAVIGATE') {
                                                        router.push(notification.data.action.url);
                                                    }
                                                }}
                                                className="h-8 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                                            >
                                                {notification.data.action.label}
                                            </Button>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                            addSuffix: true,
                                            locale: vi,
                                        })}
                                        {!notification.isRead && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                                        )}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-1">
                                    {!notification.isRead && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsRead(notification.id);
                                            }}
                                        >
                                            <Check className="h-3.5 w-3.5 text-blue-500" />
                                        </Button>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(notification.id);
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
