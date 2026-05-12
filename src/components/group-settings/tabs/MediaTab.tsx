import React from "react";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/src/utils/image-utils";

interface MediaTabProps {
    mediaMessages: any[];
    mediaFilter: "all" | "image" | "video" | "file";
    setMediaFilter: (filter: "all" | "image" | "video" | "file") => void;
}

export function MediaTab({ mediaMessages, mediaFilter, setMediaFilter }: MediaTabProps) {
    const filters = ["all", "image", "video", "file"] as const;

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setMediaFilter(f)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            mediaFilter === f
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        {f === "all" ? "Tất cả" : f === "image" ? "Hình ảnh" : f === "video" ? "Video" : "File"}
                    </button>
                ))}
            </div>
            {mediaMessages.length === 0 ? (
                <div className="text-center py-16 text-sm text-slate-400">Không có media nào</div>
            ) : (
                <div className="grid grid-cols-4 gap-2">
                    {mediaMessages.map((m: any, i: number) => (
                        <div
                            key={i}
                            className="aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                        >
                            {m.type === "image" ? (
                                <img src={getAvatarUrl(m.content || "")} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl">
                                    {m.type === "video" ? "▶" : "📄"}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}