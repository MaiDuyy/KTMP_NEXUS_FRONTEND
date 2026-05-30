import React, { RefObject } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Users,
    CheckSquare,
    Pin,
    Image,
    Settings,
    LogOut,
    Trash2,
    Camera,
    Pencil,
    X,
    Check,
    Loader2,
    Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionLabel } from "./shared/SectionLabel";
import { NavItem } from "./shared/NavItem";
import { getInitials, avatarColor } from "./shared/utils";
import { getAvatarUrl } from "@/src/utils/image-utils";
import { TabKey } from "./types";

interface GroupSettingsSidebarProps {
    chat: any;
    participantsCount: number;
    tasksCount: number;
    pinnedCount: number;
    activeTab: TabKey;
    setActiveTab: (tab: TabKey) => void;
    isAdmin: boolean;
    isLeader: boolean;
    isEditingName: boolean;
    setIsEditingName: (val: boolean) => void;
    newGroupName: string;
    setNewGroupName: (val: string) => void;
    handleUpdateName: () => void;
    fileInputRef: RefObject<HTMLInputElement | null>;
    handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploadingAvatar: boolean;
    onLeaveGroup: () => void;
    onDeleteGroup: () => void;
}

export function GroupSettingsSidebar({
    chat,
    participantsCount,
    tasksCount,
    pinnedCount,
    activeTab,
    setActiveTab,
    isAdmin,
    isLeader,
    isEditingName,
    setIsEditingName,
    newGroupName,
    setNewGroupName,
    handleUpdateName,
    fileInputRef,
    handleAvatarUpload,
    isUploadingAvatar,
    onLeaveGroup,
    onDeleteGroup,
}: GroupSettingsSidebarProps) {
    const [shouldAnimate, setShouldAnimate] = React.useState(false);
    const prevCountRef = React.useRef(participantsCount);

    React.useEffect(() => {
        if (participantsCount !== prevCountRef.current) {
            setShouldAnimate(true);
            const t = setTimeout(() => setShouldAnimate(false), 600);
            prevCountRef.current = participantsCount;
            return () => clearTimeout(t);
        }
    }, [participantsCount]);

    return (
        <div className="w-52 flex-shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/60">
            <style>{`
                @keyframes pulseScale {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.25); }
                    100% { transform: scale(1); }
                }
            `}</style>
            {/* Group identity */}
            <div className="p-4 border-b border-slate-100">
                <div className="relative group w-fit mb-3">
                    <Avatar className="h-12 w-12 rounded-xl">
                        <AvatarImage src={getAvatarUrl(chat?.avatar || "", chat?.name || "G")} />
                        <AvatarFallback
                            className={cn(
                                "rounded-xl text-sm font-semibold",
                                avatarColor(chat?.name || "G")
                            )}
                        >
                            {getInitials(chat?.name || "G")}
                        </AvatarFallback>
                    </Avatar>
                    {isAdmin && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                            {isUploadingAvatar ? (
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                            ) : (
                                <Camera className="w-4 h-4 text-white" />
                            )}
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                    />
                </div>

                {isEditingName ? (
                    <div className="flex items-center gap-1">
                        <Input
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="h-7 text-xs rounded-md"
                            onKeyDown={(e) => e.key === "Enter" && handleUpdateName()}
                        />
                        <button
                            onClick={handleUpdateName}
                            className="p-1 rounded text-green-600 hover:bg-green-50"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setIsEditingName(false)}
                            className="p-1 rounded text-slate-400 hover:bg-slate-100"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-start gap-1 group/name">
                        <p className="text-[13px] font-semibold text-slate-800 leading-tight flex-1 truncate">
                            {chat?.name || "Nhóm chat"}
                        </p>
                        {isAdmin && (
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="opacity-0 group-hover/name:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-opacity flex-shrink-0 mt-0.5"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                )}
                <p 
                    className={cn(
                        "text-[11px] text-slate-400 mt-0.5 transition-all duration-300 origin-left",
                        shouldAnimate && "text-blue-600 font-semibold"
                    )}
                    style={{ 
                        animation: shouldAnimate ? 'pulseScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                        display: 'inline-block'
                    }}
                >
                    {participantsCount} thành viên
                </p>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-2 py-2">
                <SectionLabel>Tổng quan</SectionLabel>
                <NavItem
                    icon={Users}
                    label="Thành viên"
                    active={activeTab === "members"}
                    badge={participantsCount}
                    onClick={() => setActiveTab("members")}
                />
                <NavItem
                    icon={CheckSquare}
                    label="Kế hoạch"
                    active={activeTab === "tasks"}
                    badge={tasksCount}
                    onClick={() => setActiveTab("tasks")}
                />
                <NavItem
                    icon={Pin}
                    label="Tin nhắn ghim"
                    active={activeTab === "pinned"}
                    badge={pinnedCount || undefined}
                    onClick={() => setActiveTab("pinned")}
                />
                <NavItem
                    icon={Image}
                    label="File & Media"
                    active={activeTab === "media"}
                    onClick={() => setActiveTab("media")}
                />
                <NavItem
                    icon={Share2}
                    label="Chia sẻ nhóm"
                    active={activeTab === "invite"}
                    onClick={() => setActiveTab("invite")}
                />

                <div className="mt-3">
                    <SectionLabel>Quản lý</SectionLabel>
                    <NavItem
                        icon={Settings}
                        label="Cài đặt nhóm"
                        active={activeTab === "settings"}
                        onClick={() => setActiveTab("settings")}
                    />
                </div>
            </ScrollArea>

            {/* Footer actions */}
            <div className="p-2 border-t border-slate-100 space-y-0.5">
                <NavItem icon={LogOut} label="Rời nhóm" danger onClick={onLeaveGroup} />
                {isLeader && (
                    <NavItem icon={Trash2} label="Giải tán nhóm" danger onClick={onDeleteGroup} />
                )}
            </div>
        </div>
    );
}