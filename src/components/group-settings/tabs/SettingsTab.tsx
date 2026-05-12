import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, Users, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface SettingsTabProps {
    chat: any;
    participants: any[];
    isAdmin: boolean;
    isLeader: boolean;
    handleUpdateJoinPolicy: (policy: string) => void;
    onLeaveGroup: () => void;
    onDeleteGroup: () => void;
}

export function SettingsTab({
    chat,
    participants,
    isAdmin,
    isLeader,
    handleUpdateJoinPolicy,
    onLeaveGroup,
    onDeleteGroup,
}: SettingsTabProps) {
    return (
        <div className="space-y-5">
            {/* Info card */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100 mb-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Thông tin nhóm</p>
                <div className="flex items-center gap-2.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                        <p className="text-[11px] text-slate-400">Ngày tạo nhóm</p>
                        <p className="text-[13px] text-slate-700 font-medium">
                            {chat?.createdAt
                                ? format(new Date(chat.createdAt), "dd MMMM, yyyy", { locale: vi })
                                : "—"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                        <p className="text-[11px] text-slate-400">Số thành viên</p>
                        <p className="text-[13px] text-slate-700 font-medium">{participants.length} người</p>
                    </div>
                </div>
            </div>

            {/* Policies */}
            {isAdmin && (
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quyền tham gia nhóm</h3>
                    <div className="flex flex-col gap-2">
                        {[
                            { id: "PUBLIC", label: "Công khai", desc: "Ai cũng có thể tìm thấy và vào nhóm" },
                            { id: "APPROVAL", label: "Phê duyệt", desc: "Thành viên mới cần Admin đồng ý" },
                            { id: "PRIVATE", label: "Riêng tư", desc: "Chỉ Admin mới có thể mời người khác" },
                        ].map((p) => (
                            <button
                                key={p.id}
                                disabled={!isLeader}
                                onClick={() => handleUpdateJoinPolicy(p.id)}
                                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${chat?.joinPolicy === p.id
                                        ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100"
                                        : "hover:bg-gray-50 border-gray-100"
                                    }`}
                            >
                                <div
                                    className={`mt-1 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${chat?.joinPolicy === p.id ? "border-blue-500" : "border-gray-300"
                                        }`}
                                >
                                    {chat?.joinPolicy === p.id && <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />}
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${chat?.joinPolicy === p.id ? "text-blue-700" : "text-gray-700"}`}>
                                        {p.label}
                                    </p>
                                    <p className="text-[10px] text-gray-500">{p.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Danger zone */}
            <div className="border border-red-100 rounded-xl overflow-hidden mb-2">
                <div className="px-4 py-3 bg-red-50/60 border-b border-red-100">
                    <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" /> Khu vực nguy hiểm
                    </p>
                </div>
                <div className="divide-y divide-red-50">
                    <div className="px-4 py-3.5 flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-medium text-slate-800">Rời nhóm</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Bạn sẽ mất quyền truy cập</p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            onClick={onLeaveGroup}
                        >
                            Rời nhóm
                        </Button>
                    </div>
                    {isLeader && (
                        <div className="px-4 py-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-[13px] font-medium text-slate-800">Giải tán nhóm</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Xóa vĩnh viễn nhóm và toàn bộ dữ liệu</p>
                            </div>
                            <Button
                                size="sm"
                                className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                                onClick={onDeleteGroup}
                            >
                                Giải tán
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}