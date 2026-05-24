"use client";

import { useState } from "react";
import {
    useGetNotificationsQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation,
    useClearAllNotificationsMutation,
    useClearReadNotificationsMutation,
} from "@/src/redux/feature/notificationApi";
import {
    Notification,
    NotificationType,
    NotificationCategory,
    NOTIFICATION_CATEGORY_MAP,
} from "@/src/type/chat.types";
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
    Megaphone,
    ChevronDown,
    X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setWorkspace } from "@/src/redux/feature/workspaceSlice";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Icon map per notification type ────────────────────────────────────────
const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
    FRIEND_REQUEST:   <UserPlus className="h-4 w-4 text-blue-500" />,
    FRIEND_ACCEPTED:  <UserCheck className="h-4 w-4 text-emerald-500" />,
    NEW_MESSAGE:      <MessageCircle className="h-4 w-4 text-blue-500" />,
    GROUP_INVITE:     <Users className="h-4 w-4 text-indigo-500" />,
    GROUP_REMOVED:    <Users className="h-4 w-4 text-red-500" />,
    WORKSPACE_INVITE: <Users className="h-4 w-4 text-violet-500" />,
    MENTION:          <AtSign className="h-4 w-4 text-amber-500" />,
    REACTION:         <Heart className="h-4 w-4 text-rose-400" />,
    SYSTEM:           <AlertCircle className="h-4 w-4 text-slate-400" />,
    ANNOUNCEMENT:     <Megaphone className="h-4 w-4 text-orange-500" />,
};

// ─── Category tab config ────────────────────────────────────────────────────
const CATEGORY_TABS: { id: NotificationCategory; label: string }[] = [
    { id: "all",       label: "Tất cả" },
    { id: "social",    label: "Xã hội" },
    { id: "messaging", label: "Tin nhắn" },
    { id: "workspace", label: "Workspace" },
    { id: "system",    label: "Hệ thống" },
];

// ─── Component ─────────────────────────────────────────────────────────────
export default function NotificationsPanel() {
    const router   = useRouter();
    const dispatch = useDispatch();

    const [activeCategory, setActiveCategory] = useState<NotificationCategory>("all");

    const { data, isLoading } = useGetNotificationsQuery();
    const [markAsRead]      = useMarkNotificationAsReadMutation();
    const [markAllRead]     = useMarkAllAsReadMutation();
    const [deleteOne]       = useDeleteNotificationMutation();
    const [clearAll]        = useClearAllNotificationsMutation();
    const [clearRead]       = useClearReadNotificationsMutation();

    const allNotifications = data?.notifications || [];
    const unreadCount      = data?.unreadCount || 0;

    // ── Filtering by category ──────────────────────────────────────────────
    const filtered = activeCategory === "all"
        ? allNotifications
        : allNotifications.filter(
            (n) => NOTIFICATION_CATEGORY_MAP[n.type] === activeCategory
          );

    const filteredUnread = filtered.filter((n) => !n.isRead).length;

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleMarkAsRead = async (id: string) => {
        try { await markAsRead(id).unwrap(); } catch {}
    };

    const handleMarkAllRead = async () => {
        try { await markAllRead().unwrap(); } catch {}
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try { await deleteOne(id).unwrap(); } catch {}
    };

    const handleClearAll = async () => {
        try { await clearAll().unwrap(); } catch {}
    };

    const handleClearRead = async () => {
        try { await clearRead().unwrap(); } catch {}
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) handleMarkAsRead(notification.id);
        const wsId = notification.data?.workspaceId;
        if (wsId) dispatch(setWorkspace(wsId));
        else if (notification.type === "NEW_MESSAGE") dispatch(setWorkspace(null));
        if (notification.data?.action?.url) {
            router.push(notification.data.action.url);
        } else if (notification.data?.chatId) {
            router.push(`/chat/${notification.data.chatId}`);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#19191B]">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 h-12 border-b border-slate-200/80 dark:border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Thông báo
                    </span>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                            {unreadCount}
                        </span>
                    )}
                </div>

                {/* Action menu */}
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                            title="Đánh dấu tất cả đã đọc"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Đọc tất cả
                        </button>
                    )}

                    {allNotifications.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="ml-2 h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 text-xs">
                                <DropdownMenuItem onClick={handleClearRead} className="cursor-pointer gap-2">
                                    <Check className="h-3.5 w-3.5 text-slate-400" />
                                    Xóa thông báo đã đọc
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleClearAll}
                                    className="cursor-pointer gap-2 text-red-500 focus:text-red-500"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Xóa tất cả thông báo
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* ── Category Tabs ───────────────────────────────────────────── */}
            <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-100 dark:border-white/[0.04] shrink-0 overflow-x-auto no-scrollbar">
                {CATEGORY_TABS.map((tab) => {
                    const tabCount = tab.id === "all"
                        ? allNotifications.filter((n) => !n.isRead).length
                        : allNotifications.filter(
                              (n) => NOTIFICATION_CATEGORY_MAP[n.type] === tab.id && !n.isRead
                          ).length;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveCategory(tab.id)}
                            className={`
                                flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium
                                transition-all whitespace-nowrap cursor-pointer
                                ${activeCategory === tab.id
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                                }
                            `}
                        >
                            {tab.label}
                            {tabCount > 0 && (
                                <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full leading-none ${
                                    activeCategory === tab.id
                                        ? "bg-white/30 text-white"
                                        : "bg-red-100 dark:bg-red-950/50 text-red-600"
                                }`}>
                                    {tabCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── List ───────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                        <Bell className="h-10 w-10 text-slate-200 dark:text-slate-700" />
                        <p className="text-xs">
                            {activeCategory === "all"
                                ? "Chưa có thông báo"
                                : "Không có thông báo trong danh mục này"}
                        </p>
                    </div>
                ) : (
                    <div>
                        {filtered.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`
                                    flex gap-3 px-4 py-3 cursor-pointer transition-colors
                                    border-b border-slate-100 dark:border-white/[0.04]
                                    hover:bg-slate-50 dark:hover:bg-white/[0.03]
                                    ${!notification.isRead ? "bg-blue-50/40 dark:bg-blue-950/10" : ""}
                                `}
                            >
                                {/* Icon */}
                                <div className="flex-shrink-0 w-8 h-8 rounded-[6px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    {NOTIFICATION_ICONS[notification.type]}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-0.5">
                                        <p className={`text-xs truncate ${
                                            !notification.isRead
                                                ? "font-semibold text-slate-900 dark:text-slate-100"
                                                : "text-slate-700 dark:text-slate-300"
                                        }`}>
                                            {notification.title}
                                        </p>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {notification.data?.workspaceName && (
                                                <span className="text-[9px] font-bold uppercase tracking-tight text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-[2px]">
                                                    {notification.data.workspaceName}
                                                </span>
                                            )}
                                            {/* Category badge */}
                                            <CategoryBadge type={notification.type} />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                        {notification.body}
                                    </p>
                                    {notification.data?.action && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (notification.data?.action?.type === "NAVIGATE") {
                                                    router.push(notification.data.action.url);
                                                }
                                            }}
                                            className="mt-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-[4px] transition-colors cursor-pointer"
                                        >
                                            {notification.data.action.label}
                                        </button>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                            addSuffix: true,
                                            locale: vi,
                                        })}
                                        {!notification.isRead && (
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                        )}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-1 shrink-0">
                                    {!notification.isRead && (
                                        <button
                                            className="h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsRead(notification.id);
                                            }}
                                            title="Đánh dấu đã đọc"
                                        >
                                            <Check className="h-3.5 w-3.5 text-blue-500" />
                                        </button>
                                    )}
                                    <button
                                        className="h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer group"
                                        onClick={(e) => handleDelete(notification.id, e)}
                                        title="Xóa"
                                    >
                                        <X className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-500 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Footer summary ─────────────────────────────────────────── */}
            {filtered.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 dark:border-white/[0.04] shrink-0 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                        {filtered.length} thông báo{filteredUnread > 0 ? ` · ${filteredUnread} chưa đọc` : ""}
                    </span>
                    {filteredUnread > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-blue-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                        >
                            Đọc tất cả
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ── CategoryBadge helper ────────────────────────────────────────────────────
function CategoryBadge({ type }: { type: NotificationType }) {
    const category = NOTIFICATION_CATEGORY_MAP[type];
    const config: Record<typeof category, { label: string; className: string }> = {
        all:       { label: "",           className: "" },
        social:    { label: "Xã hội",    className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
        messaging: { label: "Tin nhắn",  className: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
        workspace: { label: "Workspace", className: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" },
        system:    { label: "Hệ thống",  className: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
    };
    const { label, className } = config[category];
    if (!label) return null;
    return (
        <span className={`text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-[2px] ${className}`}>
            {label}
        </span>
    );
}
