import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Shield, UserMinus, Check, X } from "lucide-react";
import { format } from "date-fns";
import { StatCard } from "../shared/StatCard";
import { RoleBadge } from "../shared/RoleBadge";
import { MemberAvatar } from "../shared/MemberAvatar";
import { getInitials } from "../shared/utils";
import { Participant } from "../types";
import { getAvatarUrl } from "@/src/utils/image-utils";
interface MembersTabProps {
    chatId: string;
    participants: Participant[];
    memberSearch: string;
    setMemberSearch: (val: string) => void;
    currentUserId?: string;
    isAdmin: boolean;
    isLeader: boolean;
    getMemberId: (p: Participant) => string | undefined;
    getMemberName: (p: Participant) => string;
    handleUpdateRole: (memberId: string, role: string) => void;
    handleApproveJoin: (targetId: string, approve: boolean) => void;
    setMemberToRemove: (p: Participant) => void;
    setShowRemoveMemberDialog: (show: boolean) => void;
    chat: any; // để lấy joinPolicy và joinRequests
}

export function MembersTab({
    participants,
    memberSearch,
    setMemberSearch,
    currentUserId,
    isAdmin,
    isLeader,
    getMemberId,
    getMemberName,
    handleUpdateRole,
    handleApproveJoin,
    setMemberToRemove,
    setShowRemoveMemberDialog,
    chat,
}: MembersTabProps) {
    const filteredParticipants = participants.filter((p) =>
        getMemberName(p).toLowerCase().includes(memberSearch.toLowerCase())
    );

    const adminCount = participants.filter((p) => p.role !== "CHANNEL_MEMBER" && p.role !== "CHANNEL_GUEST").length;
    const memberCount = participants.filter((p) => p.role === "CHANNEL_MEMBER").length;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 mb-2">
                <StatCard label="Tổng thành viên" value={participants.length} />
                <StatCard label="Quản trị viên" value={adminCount} />
                <StatCard label="Thành viên" value={memberCount} />
            </div>

            <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                    placeholder="Tìm thành viên..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-9 h-8 text-xs rounded-lg border-slate-200"
                />
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                            <th className="text-left text-[10px] font-semibold text-slate-400 tracking-wider uppercase px-4 py-2.5">Thành viên</th>
                            <th className="text-left text-[10px] font-semibold text-slate-400 tracking-wider uppercase px-4 py-2.5">Vai trò</th>
                            {/* <th className="text-left text-[10px] font-semibold text-slate-400 tracking-wider uppercase px-4 py-2.5 hidden md:table-cell">Ngày tham gia</th> */}
                            <th className="px-4 py-2.5 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParticipants.map((p, i) => {
                            const memberId = getMemberId(p);
                            const isMe = memberId === currentUserId;
                            return (
                                <tr key={p.id || i} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <MemberAvatar participant={p} />
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-medium text-slate-800 truncate">
                                                    {getMemberName(p)} {isMe && <span className="text-slate-400 font-normal">(bạn)</span>}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">
                                                    {p.account?.id ? `#${p.account.id.slice(0, 8)}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <RoleBadge role={p.role} />
                                    </td>
                                    {/* <td className="px-4 py-2.5 hidden md:table-cell">
                                        <span className="text-[11px] text-slate-400">—</span>
                                    </td> */}
                                    <td className="px-4 py-2.5">
                                        {isAdmin && !isMe && p.role !== "CHANNEL_OWNER" && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="text-sm w-48">
                                                    {isLeader && (
                                                        <>
                                                            {p.role !== "CHANNEL_MODERATOR" && (
                                                                <DropdownMenuItem onClick={() => memberId && handleUpdateRole(memberId, "CHANNEL_MODERATOR")}>
                                                                    <Shield className="w-3.5 h-3.5 mr-2" /> Đặt làm Phó nhóm
                                                                </DropdownMenuItem>
                                                            )}
                                                            {p.role === "CHANNEL_MODERATOR" && (
                                                                <DropdownMenuItem onClick={() => memberId && handleUpdateRole(memberId, "CHANNEL_MEMBER")}>
                                                                    <UserMinus className="w-3.5 h-3.5 mr-2" /> Hạ xuống thành viên
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                        </>
                                                    )}
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        onClick={() => {
                                                            setMemberToRemove(p);
                                                            setShowRemoveMemberDialog(true);
                                                        }}
                                                    >
                                                        <UserMinus className="w-3.5 h-3.5 mr-2" /> Xóa khỏi nhóm
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredParticipants.length === 0 && (
                    <div className="text-center py-10 text-sm text-slate-400">Không tìm thấy thành viên</div>
                )}
            </div>

            {/* Join requests */}
            {isAdmin && chat?.joinPolicy === "APPROVAL" && (
                <div className="space-y-3 mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Yêu cầu tham gia đang chờ</h3>
                    {chat?.joinRequests?.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">Không có yêu cầu nào</p>
                    ) : (
                        <div className="space-y-2">
                            {chat?.joinRequests?.map((req: any) => (
                                <div key={req.id} className="flex items-center justify-between p-2.5 border rounded-xl bg-gray-50/50">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8 hover:scale-105 transition-transform">
                                            <AvatarImage src={getAvatarUrl(req.account?.avatar || "", req.account?.name)} />
                                            <AvatarFallback>{getInitials(req.account?.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate">{req.account?.name}</p>
                                            <p className="text-[9px] text-gray-400">
                                                Gửi ngày {format(new Date(req.createdAt), "dd/MM")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="xs"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-green-600 hover:bg-green-50"
                                            onClick={() => handleApproveJoin(req.accountId, true)}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                                            onClick={() => handleApproveJoin(req.accountId, false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}