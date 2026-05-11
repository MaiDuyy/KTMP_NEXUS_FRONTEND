"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Users, CheckCircle2, ShieldAlert, ArrowLeft } from "lucide-react";
import { useJoinGroupMutation, useGetChatByIdQuery } from "@/src/redux/feature/chatApi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function JoinGroupPage() {
    const params = useParams();
    const router = useRouter();
    const chatId = params.id as string;
    
    const [status, setStatus] = useState<"loading" | "error" | "success" | "pending">("loading");
    const [message, setMessage] = useState("");

    const [joinGroup] = useJoinGroupMutation();
    
    // We try to get chat info slightly to show group name
    // Note: This might fail if the group is private and the user is not a member
    // But since the join link is public-ish, we might need a specific "getPublicGroupInfo" API
    // For now we'll just try to join directly.

    useEffect(() => {
        if (!chatId) return;

        const performJoin = async () => {
            console.log("[JoinGroupPage] Joining group:", chatId);
            try {
                const res = await joinGroup(chatId).unwrap();
                console.log("[JoinGroupPage] Join result:", res);
                if (res.status === "JOINED") {
                    setStatus("success");
                    setMessage("Đã tham gia nhóm thành công!");
                    toast.success("Chào mừng bạn đến với nhóm!");
                    // Auto redirect after 2 seconds
                    setTimeout(() => {
                        router.push(`/chat?id=${chatId}`);
                    }, 2000);
                } else if (res.status === "REQUEST_SENT") {
                    setStatus("pending");
                    setMessage("Yêu cầu tham gia đã được gửi!");
                }
            } catch (err: any) {
                setStatus("error");
                setMessage(err?.data?.message || "Không thể tham gia nhóm này. Vui lòng kiểm tra lại liên kết.");
            }
        };

        performJoin();
    }, [chatId, joinGroup, router]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col items-center text-center">
                {status === "loading" && (
                    <>
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 mb-2">Đang xử lý...</h1>
                        <p className="text-slate-500 text-sm">Vui lòng chờ trong giây lát khi chúng tôi xử lý yêu cầu tham gia của bạn.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 mb-2">Tuyệt vời!</h1>
                        <p className="text-slate-500 text-sm mb-8">{message}</p>
                        <Button 
                            onClick={() => router.push(`/chat?id=${chatId}`)}
                            className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold"
                        >
                            Vào nhóm ngay
                        </Button>
                    </>
                )}

                {status === "pending" && (
                    <>
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-amber-500" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 mb-2">Yêu cầu đã gửi</h1>
                        <p className="text-slate-500 text-sm mb-8">
                            Nhóm này yêu cầu phê duyệt từ quản trị viên. Chúng tôi sẽ thông báo cho bạn khi yêu cầu được chấp nhận.
                        </p>
                        <Button 
                            variant="outline"
                            onClick={() => router.push("/chat")}
                            className="w-full h-12 rounded-xl font-bold border-slate-200"
                        >
                            Quay lại trang chủ
                        </Button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                            <ShieldAlert className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 mb-2">Rất tiếc!</h1>
                        <p className="text-slate-500 text-sm mb-8">{message}</p>
                        <div className="flex flex-col gap-3 w-full">
                            <Button 
                                onClick={() => router.push("/chat")}
                                className="w-full bg-slate-800 hover:bg-slate-900 h-12 rounded-xl font-bold"
                            >
                                Quay lại trang chủ
                            </Button>
                            <Button 
                                variant="ghost"
                                onClick={() => window.location.reload()}
                                className="w-full h-12 rounded-xl font-semibold text-slate-500"
                            >
                                Thử lại
                            </Button>
                        </div>
                    </>
                )}

                <div className="mt-10 pt-6 border-t border-slate-50 w-full flex items-center justify-center">
                    <button 
                        onClick={() => router.push("/chat")}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Quay lại ứng dụng Chat
                    </button>
                </div>
            </div>
        </div>
    );
}
