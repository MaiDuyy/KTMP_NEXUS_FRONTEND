"use client";

import { useRef, useState } from "react";
import { Camera, Upload, Trash2, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUploadAvatarMutation } from "@/src/redux/feature/uploadApi";
import { getAvatarUrl } from "@/src/utils/image-utils";
import { useDeleteAvatarMutation, useGetAvatarHistoryQuery, useSelectAvatarMutation } from "@/src/redux/feature/accountApi";

// import {
//     useUploadAvatarMutation,
//     useDeleteAvatarMutation,
//     useGetAvatarHistoryQuery,
//     useSelectAvatarMutation,
// } from "@/src/redux/feature/accountApi";

interface AvatarUploadProps {
    currentAvatar?: string | null;
    name: string;
    onAvatarChange?: (newAvatar: string | null) => void;
    size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-28 w-28",
    xl: "h-36 w-36",
};

export function AvatarUpload({
    currentAvatar,
    name,
    onAvatarChange,
    size = "lg",
}: AvatarUploadProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
    const [deleteAvatar, { isLoading: isDeleting }] = useDeleteAvatarMutation();
    const [selectAvatar, { isLoading: isSelecting }] = useSelectAvatarMutation();
    const { data: avatarHistory, refetch: refetchHistory } = useGetAvatarHistoryQuery();

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn file ảnh!");
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File ảnh không được vượt quá 5MB!");
            return;
        }

        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const result = await uploadAvatar(formData).unwrap();
            toast.success(result.message);
            console.log(result);
            // onAvatarChange?.(result.avatar);
            refetchHistory();
            handleClose();
        } catch (error: any) {
            toast.error(error?.data?.message || "Upload avatar thất bại!");
        }
    };

    const handleDelete = async () => {
        try {
            await deleteAvatar().unwrap();
            toast.success("Đã xóa avatar!");
            onAvatarChange?.(null);
            handleClose();
        } catch (error: any) {
            toast.error(error?.data?.message || "Xóa avatar thất bại!");
        }
    };

    const handleSelectFromHistory = async (avatarUrl: string) => {
        try {
            const result = await selectAvatar({ avatarUrl }).unwrap();
            toast.success(result.message);
            onAvatarChange?.(result.avatar);
            handleClose();
        } catch (error: any) {
            toast.error(error?.data?.message || "Chọn avatar thất bại!");
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setPreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const imageUrl = getAvatarUrl(currentAvatar, name);

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => open ? setIsOpen(true) : handleClose()}>
            <DialogTrigger asChild>
                <button className="relative group cursor-pointer rounded-[2px]">
                    <Avatar className={cn(sizeClasses[size], "rounded-[2px] ring-1 ring-slate-200 dark:ring-white/[0.08] shadow-sm")}>
                        <AvatarImage
                            src={imageUrl}
                            alt="Image"
                            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity rounded-[2px]"
                            onClick={() => window.open(imageUrl, "_blank")} // Mở ảnh gốc khi click
                        />
                        <AvatarFallback className="text-lg font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-[2px]">
                            {getInitials(name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                    </div>
                </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md rounded-[2px] border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B]">
                <DialogHeader>
                    <DialogTitle className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Cập nhật Avatar</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Chọn ảnh từ thiết bị hoặc từ lịch sử avatar của bạn
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Preview */}
                    <div className="flex justify-center">
                        <Avatar className="h-32 w-32 rounded-[2px] ring-1 ring-slate-200 dark:ring-white/[0.08]">
                            <AvatarImage
                                src={previewUrl || imageUrl || undefined}
                                alt={name}
                                className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity rounded-[2px]"
                            />
                            <AvatarFallback className="text-2xl font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-[2px]">
                                {getInitials(name)}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* Upload buttons */}
                    {previewUrl ? (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-[2px] text-xs font-mono"
                                onClick={() => {
                                    setPreviewUrl(null);
                                    setSelectedFile(null);
                                }}
                            >
                                <X className="mr-2 h-3.5 w-3.5" />
                                Hủy
                            </Button>
                            <Button
                                className="flex-1 rounded-[2px] text-xs font-mono bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                                onClick={handleUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-3.5 w-3.5" />
                                )}
                                Lưu
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-[2px] text-xs font-mono border-slate-200 dark:border-white/[0.08]"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                Chọn ảnh
                            </Button>
                            {currentAvatar && (
                                <Button
                                    variant="destructive"
                                    className="rounded-[2px] bg-red-600 hover:bg-red-700"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            )}
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Avatar History */}
                    {/* {avatarHistory && avatarHistory.avatarHistory.length > 0 && !previewUrl && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">Lịch sử avatar</p>
                            <div className="flex gap-2 flex-wrap">
                                {avatarHistory.avatarHistory.map((url, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectFromHistory(url)}
                                        disabled={isSelecting || url === currentAvatar}
                                        className={cn(
                                            "relative rounded-full transition-all",
                                            url === currentAvatar
                                                ? "ring-2 ring-primary ring-offset-2"
                                                : "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2"
                                        )}
                                    >
                                        <Avatar className="h-14 w-14">
                                            <AvatarImage src={url} alt={`History ${index + 1}`} />
                                            <AvatarFallback>{index + 1}</AvatarFallback>
                                        </Avatar>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )} */}
                </div>
            </DialogContent>
        </Dialog>
    );
}
