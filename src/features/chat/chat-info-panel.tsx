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
    Bell,
    BellOff,
    MoreHorizontal,
    Phone,
    MessageSquare,
    Mail,
    Clock,
    MapPin,
    Calendar,
    Badge,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { getAvatarUrl } from "@/src/utils/image-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    useGetChatByIdQuery,
    useTogglePinChatMutation,
    useToggleNotifyChatMutation,
} from "@/src/redux/feature/chatApi";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, File, Layers, Filter } from "lucide-react";

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
    const [activeTab, setActiveTab] = useState<string>("about");
    const [searchQuery, setSearchQuery] = useState("");
    const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video" | "file">("all");

    // API calls
    const { data: chatData, isLoading: chatLoading } = useGetChatByIdQuery(chatId, { skip: !isOpen });
    const { data: pinnedData, isLoading: pinnedLoading, refetch: refetchPinned } = useGetPinnedMessagesQuery(chatId, {
        skip: !isOpen,
    });
    const [searchMessages, { data: searchData, isLoading: searchLoading }] = useLazySearchMessagesQuery();
    const { data: mediaData, isLoading: mediaLoading } = useGetMediaMessagesQuery(
        { chatId, type: mediaFilter },
        { skip: !isOpen || activeTab !== "media" }
    );

    const [togglePin] = useTogglePinChatMutation();
    const [toggleNotify] = useToggleNotifyChatMutation();

    const chat = chatData?.chat;
    const partner = chat?.participants?.find(p => p.name === chatName);

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

    const handleTogglePin = async () => {
        try {
            await togglePin({ chatId, pin: !chat?.pin }).unwrap();
            toast.success(chat?.pin ? "Đã bỏ ghim cuộc trò chuyện" : "Đã ghim cuộc trò chuyện");
        } catch (error) {
            toast.error("Không thể thực hiện hành động này");
        }
    };

    const handleToggleNotify = async () => {
        try {
            await toggleNotify({ chatId, notify: !chat?.notify }).unwrap();
            toast.success(chat?.notify ? "Đã tắt thông báo" : "Đã bật thông báo");
        } catch (error) {
            toast.error("Không thể thực hiện hành động này");
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
            <ScrollArea className="flex-1 h-full">
                <div className="flex flex-col min-h-full">
                    {/* Banner Section */}
                    <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 w-full shrink-0 relative">
                        <div className="absolute -bottom-10 left-6">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 rounded-2xl ring-4 ring-white dark:ring-gray-900 shadow-xl transition-transform group-hover:scale-105 bg-white">
                                    <AvatarImage src={getAvatarUrl(chat?.avatar, chatName)} alt={chatName} className="object-cover" />
                                    <AvatarFallback className="text-2xl bg-blue-500 text-white font-bold">
                                        {chatName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {partner?.isOnline && (
                                    <div className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 border-4 border-white dark:border-gray-900 rounded-full shadow-md z-10" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Header Info */}
                    <div className="pt-12 px-6 pb-4 space-y-4 shrink-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {chatName}
                                {chat?.pin && <Pin className="h-4 w-4 text-blue-500 fill-current" />}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                {chat?.isGroup ? `${chat.participantCount} thành viên` : partner?.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                            </p>
                        </div>

                        {/* Quick Actions Row */}
                        <div className="flex items-center gap-4 w-full pt-1">
                            <div className="flex flex-col items-center gap-1.5">
                                <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className={`h-11 w-11 rounded-full transition-all ${chat?.notify ? 'text-gray-600' : 'text-blue-600 bg-blue-50 border-blue-200'}`}
                                    onClick={handleToggleNotify}
                                >
                                    {chat?.notify ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                                </Button>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {chat?.notify ? "Thông báo" : "Đã tắt"}
                                </span>
                            </div>

                            <div className="flex flex-col items-center gap-1.5">
                                <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className={`h-11 w-11 rounded-full transition-all ${chat?.pin ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-gray-600'}`}
                                    onClick={handleTogglePin}
                                >
                                    <Pin className={`h-5 w-5 ${chat?.pin ? 'fill-current' : ''}`} />
                                </Button>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {chat?.pin ? "Đã ghim" : "Ghim"}
                                </span>
                            </div>

                            <div className="flex flex-col items-center gap-1.5">
                                <Button size="icon" variant="outline" className="h-11 w-11 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                    <Search className="h-5 w-5" />
                                </Button>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tìm kiếm</span>
                            </div>

                            <div className="flex flex-col items-center gap-1.5">
                                <Button size="icon" variant="outline" className="h-11 w-11 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thêm</span>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-gray-100 dark:bg-gray-800" />

                    {/* Main Content Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
                        <TabsList className="sticky top-0 z-20 flex w-full justify-start gap-6 px-6 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shrink-0">

                            <TabsTrigger 
                                value="about" 
                                className="relative h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-blue-600 font-bold text-sm px-0"
                            >
                                Giới thiệu
                            </TabsTrigger>
                            <TabsTrigger 
                                value="pinned" 
                                className="relative h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-blue-600 font-bold text-sm px-0"
                            >
                                Đã ghim
                            </TabsTrigger>
                            <TabsTrigger 
                                value="media" 
                                className="relative h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-blue-600 font-bold text-sm px-0"
                            >
                                Media
                            </TabsTrigger>
                            <TabsTrigger 
                                value="search" 
                                className="relative h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-blue-600 font-bold text-sm px-0"
                            >
                                Tìm kiếm
                            </TabsTrigger>
                        </TabsList>

                    <TabsContent value="about" className="p-6 space-y-6">
                        {/* Detail Info Section */}
                        {!chat?.isGroup && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Thông tin chi tiết</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 group">
                                        <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Email</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                                                {(partner as any)?.email || (partner as any)?.account?.email || "nguoidung@nexus.vn"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Giờ địa phương</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {format(new Date(), "HH:mm", { locale: vi })} (GMT+7)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Separator className="bg-gray-100 dark:bg-gray-800" />

                        {/* Media Preview Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Media mới nhất</h3>
                                <button onClick={() => setActiveTab('media')} className="text-xs text-blue-600 font-semibold hover:underline">Xem tất cả</button>
                            </div>
                            {mediaLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-slate-200 mx-auto" />
                            ) : mediaMessages.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2">
                                    {mediaMessages.filter(m => m.type === 'image').slice(0, 4).map((msg) => (
                                        <div key={msg.id} className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onMessageClick?.(msg.id)}>
                                            <img src={normalizeUrl(msg.content || "")} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    {mediaMessages.filter(m => m.type === 'image').length === 0 && (
                                        <div className="col-span-4 text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <p className="text-[10px] text-slate-400">Không có hình ảnh nào</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center py-4 text-xs text-slate-400 italic">Chưa có tệp tin nào được chia sẻ</p>
                            )}
                        </div>

                        <Separator className="bg-gray-100 dark:bg-gray-800" />

                        {/* Mutual Groups Preview */}
                        {/* <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Nhóm chung</h3>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                    <Users size={10} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500">2</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs">
                                        N
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate">Nexus Core Team</p>
                                        <p className="text-[10px] text-slate-400">12 thành viên</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                    <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold text-xs">
                                        D
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate">Design System</p>
                                        <p className="text-[10px] text-slate-400">5 thành viên</p>
                                    </div>
                                </div>
                            </div>
                        </div> */}

                        <Separator className="bg-gray-100 dark:bg-gray-800" />

                        {/* Pinned Preview Section */}
                       <div>
                                               <div className="flex items-center justify-between mb-2">
                                                 <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tin nhắn đã ghim</p>
                                                 <Badge  className="h-4 px-1.5 text-[10px]">{pinnedData?.pinnedMessages?.length || 0}</Badge>
                                               </div>
                                               {pinnedLoading ? (
                                                 <Loader2 className="w-4 h-4 animate-spin text-slate-200 mx-auto" />
                                               ) : pinnedData?.pinnedMessages?.length ? (
                                                 <div className="space-y-2">
                                                   {pinnedData.pinnedMessages.slice(0, 3).map((msg) => (
                                                     <div key={msg.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 relative group">
                                                       <div className="flex items-center gap-2 mb-1">
                                                          <Avatar className="h-4 w-4">
                                                             <AvatarImage src={getAvatarUrl(msg.sender?.avatar, msg.sender?.name || '')} />
                                                             <AvatarFallback className="text-[8px]">{msg.sender?.name?.[0]}</AvatarFallback>
                                                          </Avatar>
                                                          <span className="text-[10px] font-bold truncate">{msg.sender?.name}</span>
                                                          <span className="text-[9px] text-slate-400 ml-auto">{msg.time ? format(new Date(msg.time), 'HH:mm') : '--:--'}</span>
                                                       </div>
                                                       <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                                         {msg.content || (msg.file ? '📎 Tệp đính kèm' : '...')}
                                                       </p>
                                                       <button 
                                                        //  onClick={() => togglePin({ messageId: msg.id, chatId: channelId })}
                                                         className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                                                       >
                                                         <X size={10} className="text-slate-400" />
                                                       </button>
                                                     </div>
                                                   ))}
                                                   {pinnedData.pinnedMessages.length > 3 && (
                                                     <p className="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline text-center">
                                                       Xem thêm {pinnedData.pinnedMessages.length - 3} tin nhắn...
                                                     </p>
                                                   )}
                                                 </div>
                                               ) : (
                                                 <div className="text-center py-4 rounded-lg border border-dashed border-slate-200">
                                                   <Pin size={16} className="mx-auto mb-1 text-slate-300" />
                                                   <p className="text-[10px] text-slate-400">Chưa có tin nhắn nào được ghim</p>
                                                 </div>
                                               )}
                                             </div>
                    </TabsContent>

                    <TabsContent value="pinned" className="p-4 space-y-3">
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
                        <div className="space-y-3">
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

                        <div className="flex-1">
                            {mediaLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                            ) : mediaMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                    <div className="h-20 w-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                                        <Layers className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Không có tệp tin nào</h4>
                                    <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                                        Tất cả ảnh, video và tài liệu bạn chia sẻ sẽ xuất hiện ở đây.
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
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}