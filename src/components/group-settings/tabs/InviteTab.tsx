import React, { useState } from "react";
import { Copy, Check, Share2, Download, ExternalLink, ShieldAlert, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials, avatarColor } from "../shared/utils";
import { getAvatarUrl } from "@/src/utils/image-utils";

interface InviteTabProps {
    chat: any;
    handleApproveJoin: (targetId: string, approve: boolean) => void;
}

export function InviteTab({ chat, handleApproveJoin }: InviteTabProps) {
    const [copied, setCopied] = useState(false);
    
    // Join Link logic
    const inviteUrl = typeof window !== "undefined" 
        ? `${window.location.origin}/join/${chat?.id}` 
        : "";
        
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(inviteUrl)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        toast.success("Đã sao chép liên kết mời!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQR = async () => {
        try {
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `QR_Invite_${chat?.name || "Group"}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Đã tải xuống mã QR!");
        } catch (err) {
            toast.error("Không thể tải xuống mã QR");
        }
    };

    const isPrivate = chat?.joinPolicy === "PRIVATE";
    const needsApproval = chat?.joinPolicy === "APPROVAL";
    const joinRequests = chat?.joinRequests || [];

    if (isPrivate) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <ShieldAlert className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Nhóm riêng tư</h3>
                <p className="text-[12px] text-slate-500 mt-2 max-w-[280px]">
                    Kế hoạch mời qua liên kết và mã QR đã bị tắt. Chỉ quản trị viên mới có thể thêm thành viên trực tiếp vào nhóm.
                </p>
                <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-left">
                    <p className="text-[11px] leading-relaxed">
                        <span className="font-bold">Mẹo:</span> Thay đổi chế độ tham gia trong phần <span className="font-semibold italic">Cài đặt nhóm</span> để cho phép người khác tham gia qua liên kết.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Share Section */}
            <div className="space-y-6">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex flex-col items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                        <img 
                            src={qrCodeUrl} 
                            alt="Join Group QR Code" 
                            className="w-44 h-44"
                        />
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="text-sm font-bold text-slate-800">Quét mã để vào nhóm</h3>
                        <p className="text-[11px] text-slate-500 max-w-[240px]">
                            {needsApproval 
                                ? "Người tham gia qua mã QR này sẽ cần sự phê duyệt của bạn." 
                                : "Bất kỳ ai quét mã này đều có thể tham gia nhóm ngay lập tức."}
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-[11px] font-semibold gap-1.5 rounded-lg border-blue-200 text-blue-700 bg-white hover:bg-blue-50"
                        onClick={handleDownloadQR}
                    >
                        <Download className="w-3.5 h-3.5" />
                        Tải mã QR xuống
                    </Button>
                </div>

                <div className="space-y-3">
                    <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                        Liên kết mời trực tiếp
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <Input 
                                readOnly 
                                value={inviteUrl} 
                                className="pr-10 h-10 text-[13px] bg-slate-50/50 border-slate-200 rounded-xl focus-visible:ring-blue-500"
                            />
                            <button 
                                onClick={handleCopy}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button 
                            asChild
                            variant="ghost" 
                            className="h-10 text-[13px] rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                        >
                            <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                Mở liên kết
                            </a>
                        </Button>
                        <Button 
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: `Tham gia nhóm ${chat?.name}`,
                                        text: `Hãy tham gia nhóm chat "${chat?.name}" của chúng tôi!`,
                                        url: inviteUrl,
                                    }).catch(() => {});
                                } else {
                                    handleCopy();
                                }
                            }}
                            className="h-10 text-[13px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                        >
                            <Share2 className="w-3.5 h-3.5 mr-2" />
                            Chia sẻ nhóm
                        </Button>
                    </div>
                </div>
            </div>

            {/* Approval List Section */}
            {needsApproval && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            Yêu cầu tham gia
                            <span className="bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center">
                                {joinRequests.length}
                            </span>
                        </label>
                    </div>

                    {joinRequests.length === 0 ? (
                        <div className="flex flex-col items-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <UserPlus className="w-8 h-8 text-slate-300 mb-2" />
                            <p className="text-[12px] text-slate-400 italic">Chưa có yêu cầu nào đang chờ</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {joinRequests.map((req: any) => (
                                <div key={req.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                                    <Avatar className="h-9 w-9 rounded-lg border border-slate-100">
                                        <AvatarImage src={getAvatarUrl(req.account?.avatar || "", req.account?.name)} />
                                        <AvatarFallback className={cn("rounded-lg text-[10px] font-bold", avatarColor(req.account?.name || ""))}>
                                            {getInitials(req.account?.name || "")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-slate-800 truncate">
                                            {req.account?.name || "Người dùng"}
                                        </p>
                                        <p className="text-[10px] text-slate-400 italic">
                                            Yêu cầu từ nhóm {new Date(req.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button 
                                            onClick={() => handleApproveJoin(req.accountId, false)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                                            title="Từ chối"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleApproveJoin(req.accountId, true)}
                                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                                            title="Đồng ý"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!needsApproval && !isPrivate && (
                <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-xl text-amber-800">
                    <p className="text-[11px] leading-relaxed">
                        <span className="font-bold">Lưu ý:</span> Bất kỳ ai có liên kết này đều có thể vào nhóm ngay lập tức. Hãy cẩn thận khi chia sẻ liên kết này ở nơi công cộng.
                    </p>
                </div>
            )}
        </div>
    );
}
