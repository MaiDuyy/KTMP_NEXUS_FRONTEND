"use client";

import { useState, useEffect } from "react";
import { Message } from "@/src/type/chat.types";
import {
    useGetPinnedMessagesQuery,
    useLazySearchMessagesQuery,
    useGetMediaMessagesQuery,
} from "@/src/redux/feature/messageApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Pin,
    Search,
    Image as ImageIcon,
    FileText,
    Video,
    X,
    Loader2,
    Download,
    ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ChatInfoPanelProps {
    chatId: string;
    chatName: string;
    isOpen: boolean;
    onClose: () => void;
    onMessageClick?: (messageId: string) => void;
}

export default function ChatInfoPanel({
    chatId,
    chatName,
    isOpen,
    onClose,
    onMessageClick,
}: ChatInfoPanelProps) {
    const [activeTab, setActiveTab] = useState<string>("pinned");
    const [searchQuery, setSearchQuery] = useState("");
    const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video" | "file">("all");

    // API calls
    const { data: pinnedData, isLoading: pinnedLoading, refetch: refetchPinned } = useGetPinnedMessagesQuery(chatId, {
        skip: !isOpen,
    });
    const [searchMessages, { data: searchData, isLoading: searchLoading }] = useLazySearchMessagesQuery();
    const { data: mediaData, isLoading: mediaLoading } = useGetMediaMessagesQuery(
        { chatId, type: mediaFilter },
        { skip: !isOpen || activeTab !== "media" }
    );

    const pinnedMessages = pinnedData?.pinnedMessages || [];
    const searchResults = searchData?.messages || [];
    const mediaMessages = mediaData?.media || [];

    const handleSearch = () => {
        if (searchQuery.trim()) {
            searchMessages({ chatId, q: searchQuery.trim() });
        }
    };

    useEffect(() => {
        const handleMessagePinned = (event: CustomEvent) => {
            const { chatId: eventChatId } = event.detail;
            if (eventChatId === chatId && isOpen) {
                refetchPinned();
            }
        };

        window.addEventListener("socket:message:pinned", handleMessagePinned as EventListener);
        return () => {
            window.removeEventListener("socket:message:pinned", handleMessagePinned as EventListener);
        };
    }, [chatId, isOpen, refetchPinned]);
    const normalizeUrl = (url: string) => {
        if (!url) return "";
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        return `https://${url}`;
    };

    const renderMessageItem = (message: Message) => {
        const msgType = message.type || "text";


        let contentDisplay = null;

        if (msgType === "text" || !msgType) {
            contentDisplay = (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {message.content || "[Tin nhắn trống]"}
                </p>
            );
        } else if (msgType === "image") {
            const imageUrl = normalizeUrl(message.content || "");
            contentDisplay = (
                <div className="rounded-lg overflow-hidden max-w-xs mt-1">
                    <img
                        src={imageUrl}
                        alt="Image"
                        className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(imageUrl, "_blank");
                        }}
                    />
                </div>
            );
        } else if (msgType === "video") {
            const videoUrl = normalizeUrl(message.content || "");
            contentDisplay = (
                <div className="rounded-lg overflow-hidden max-w-xs mt-1">
                    <video
                        src={videoUrl}
                        controls
                        className="w-full h-auto"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            );
        } else if (msgType === "file") {
            contentDisplay = (
                <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" /> {message.file?.name || "File"}
                </span>
            );
        } else {
            contentDisplay = <span>{message.content || `[${msgType}]`}</span>;
        }

        return (
            <div
                key={message.id}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => onMessageClick?.(message.id)}
            >
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{message.sender?.name || "Unknown"}</span>
                            <span className="text-xs text-gray-500">
                                {format(new Date(message.time), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </span>
                            {message.pin && <Pin className="h-3 w-3 text-blue-500" />}
                        </div>
                        {contentDisplay}
                    </div>
                </div>
            </div>
        );
    };

    const renderMediaItem = (message: Message) => {
        if (message.type === "image") {
            return (
                <div
                    key={message.id}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                    onClick={() => onMessageClick?.(message.id)}
                >
                    <img
                        src={normalizeUrl(message.content || "")}
                        alt="Media"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(normalizeUrl(message.content || ""), "_blank");
                            }}
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                        <a
                            href={normalizeUrl(message.content || "")}
                            download
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button size="icon" variant="secondary" className="h-8 w-8">
                                <Download className="h-4 w-4" />
                            </Button>
                        </a>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-xs text-white truncate">{normalizeUrl(message.content || "")}</p>
                    </div>
                </div>
            );
        }

        if (message.type === "video") {
            return (
                <div
                    key={message.id}
                    className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer"
                    onClick={() => onMessageClick?.(message.id)}
                >
                    <video
                        src={normalizeUrl(message.content || "")}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                            <Video className="h-6 w-6 text-gray-800" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-xs text-white truncate">{normalizeUrl(message.content || "")}</p>
                    </div>
                </div>
            );
        }

        return (
            <a
                key={message.id}
                href={message.content || ""}
                target="_blank"
                rel="noopener noreferrer"
                download={message.file?.name}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{message.file?.name || "File"}</p>
                    <p className="text-xs text-gray-500">
                        {message.file?.size} • {message.sender.name}
                    </p>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
            </a>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:w-[400px] p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>Thông tin cuộc trò chuyện</SheetTitle>
                    <p className="text-sm text-gray-500">{chatName}</p>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[calc(100vh-100px)]">
                    <TabsList className="grid w-full grid-cols-3 mx-4 mt-4" style={{ width: 'calc(100% - 32px)' }}>
                        <TabsTrigger value="pinned" className="flex items-center gap-1">
                            <Pin className="h-4 w-4" />
                            <span className="hidden sm:inline">Đã ghim</span>
                        </TabsTrigger>
                        <TabsTrigger value="search" className="flex items-center gap-1">
                            <Search className="h-4 w-4" />
                            <span className="hidden sm:inline">Tìm kiếm</span>
                        </TabsTrigger>
                        <TabsTrigger value="media" className="flex items-center gap-1">
                            <ImageIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Media</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pinned" className="flex-1 overflow-y-auto p-4 space-y-3">
                        {pinnedLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            </div>
                        ) : pinnedMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Pin className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                                <p className="text-gray-500 dark:text-gray-400">Chưa có tin nhắn nào được ghim</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                    Nhấn giữ tin nhắn và chọn "Ghim" để ghim
                                </p>
                            </div>
                        ) : (
                            pinnedMessages.map((msg) => renderMessageItem(msg))
                        )}
                    </TabsContent>

                    <TabsContent value="search" className="flex-1 flex flex-col p-4">
                        <div className="flex gap-2 mb-4">
                            <Input
                                placeholder="Tìm kiếm tin nhắn..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <Button onClick={handleSearch} disabled={!searchQuery.trim() || searchLoading}>
                                {searchLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {searchLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                </div>
                            ) : searchResults.length === 0 && searchQuery ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Không tìm thấy kết quả cho "{searchQuery}"
                                    </p>
                                </div>
                            ) : !searchQuery ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">Nhập từ khóa để tìm kiếm</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-500 mb-2">
                                        Tìm thấy {searchResults.length} kết quả
                                    </p>
                                    {searchResults.map((msg) => renderMessageItem(msg))}
                                </>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="media" className="flex-1 flex flex-col p-4">
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {[
                                { value: "all", label: "Tất cả", icon: null },
                                { value: "image", label: "Ảnh", icon: ImageIcon },
                                { value: "video", label: "Video", icon: Video },
                                { value: "file", label: "File", icon: FileText },
                            ].map(({ value, label, icon: Icon }) => (
                                <Button
                                    key={value}
                                    size="sm"
                                    variant={mediaFilter === value ? "default" : "outline"}
                                    onClick={() => setMediaFilter(value as typeof mediaFilter)}
                                    className="flex items-center gap-1"
                                >
                                    {Icon && <Icon className="h-4 w-4" />}
                                    {label}
                                </Button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {mediaLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                </div>
                            ) : mediaMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <ImageIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Chưa có {mediaFilter === "all" ? "media/file" : mediaFilter === "image" ? "ảnh" : mediaFilter === "video" ? "video" : "file"} nào
                                    </p>
                                </div>
                            ) : (
                                <div className={`
                                    ${mediaFilter === "file" || (mediaFilter === "all" && mediaMessages.every(m => m.type === "file"))
                                        ? "space-y-3"
                                        : "grid grid-cols-3 gap-2"
                                    }
                                `}>
                                    {mediaMessages.map((msg) => renderMediaItem(msg))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}