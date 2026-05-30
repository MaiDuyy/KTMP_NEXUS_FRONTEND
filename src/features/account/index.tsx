"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Loader2,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Save,
    LogOut,
    Shield,
    Edit3,
    Lock,
    Eye,
    EyeOff,
    Key,
    Clock,
    UserCheck,
    Info,
    Ban,
    Sparkles,
    CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";

import { AvatarUpload } from "./avatar-upload";
import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";
import { logOut, setCredentials } from "@/src/redux/feature/authSlice";
import { performFullLogout } from "@/src/utils/auth-utils";
import { useLogoutMutation } from "@/src/redux/feature/authApi";
import {
    useGetAccountDetailsQuery,
    useUpdateAccountMutation,
    useUpdateStatusMutation,
    useUpdateOnlineStatusMutation,
} from "@/src/redux/feature/accountApi";
import { useChangePasswordMutation } from "@/src/redux/feature/userApi";

const profileSchema = z.object({
    name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
    birthDate: z.string().optional(),
    location: z.string().optional(),
    gender: z.string().optional(),
});

const statusSchema = z.object({
    status: z.string().max(150, "Trạng thái không được quá 150 ký tự"),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

export function AccountSettingsPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user: authUser, token, refreshToken } = useAppSelector((state) => state.auth);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
    const [showPasswordDrawer, setShowPasswordDrawer] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data: accountData, isLoading, refetch } = useGetAccountDetailsQuery();
    const [updateAccount, { isLoading: isUpdating }] = useUpdateAccountMutation();
    const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateStatusMutation();
    const [updateOnlineStatus] = useUpdateOnlineStatusMutation();
    const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

    const user = accountData?.user;

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            birthDate: "",
            location: "",
            gender: "",
        },
    });

    const statusForm = useForm<z.infer<typeof statusSchema>>({
        resolver: zodResolver(statusSchema),
        defaultValues: {
            status: "",
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    // Populate forms when data loads
    useEffect(() => {
        if (user) {
            profileForm.reset({
                name: user.name || "",
                birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split("T")[0] : "",
                location: user.location || "",
                gender: user.gender || "",
            });
            statusForm.reset({
                status: user.status || "",
            });
            setCurrentAvatar(user.avatar || null);
        }
    }, [user, profileForm, statusForm]);

    const handleUpdateProfile = async (data: z.infer<typeof profileSchema>) => {
        try {
            const result = await updateAccount(data).unwrap();
            toast.success(result.message || "Cập nhật thông tin thành công!");
            setIsEditingProfile(false);
            refetch();

            // Update auth state
            if (authUser && result.user) {
                dispatch(setCredentials({
                    user: { ...authUser, ...result.user },
                    accessToken: token || "",
                    refreshToken: refreshToken || "",
                }));
            }
        } catch (error: any) {
            toast.error(error?.data?.message || "Cập nhật thất bại!");
        }
    };

    const handleUpdateStatus = async (data: z.infer<typeof statusSchema>) => {
        try {
            const result = await updateStatus(data).unwrap();
            toast.success(result.message || "Cập nhật trạng thái thành công!");
            setIsEditingStatus(false);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Cập nhật trạng thái thất bại!");
        }
    };

    const handleLogout = async () => {
        try {
            // Update offline status
            await updateOnlineStatus({ isOnline: false });
            await logout({});
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            toast.success("Đăng xuất thành công!");
            performFullLogout(dispatch);
        }
    };

    const handleAvatarChange = (newAvatar: string | null) => {
        setCurrentAvatar(newAvatar);
        refetch();
    };

    const handleChangePassword = async (data: z.infer<typeof passwordSchema>) => {
        try {
            await changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            }).unwrap();
            toast.success("Đổi mật khẩu thành công!");
            setShowPasswordDrawer(false);
            passwordForm.reset();
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (error: any) {
            toast.error(error?.data?.message || "Đổi mật khẩu thất bại!");
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto py-8 px-4 md:px-8 space-y-10 animate-pulse">
                {/* Header Skeleton */}
                <div className="space-y-2">
                    <div className="h-7 w-48 bg-slate-200 dark:bg-zinc-800 rounded-[2px]" />
                    <div className="h-4 w-96 bg-slate-200 dark:bg-zinc-800 rounded-[2px]" />
                </div>
                <div className="h-[1px] w-full bg-slate-200 dark:bg-zinc-800" />
                
                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column Skeleton */}
                    <div className="lg:col-span-4 border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-[#19191B] rounded-[2px] p-6 space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="h-28 w-28 bg-slate-200 dark:bg-zinc-800 rounded-[2px]" />
                            <div className="h-5 w-36 bg-slate-200 dark:bg-zinc-800 rounded-[2px]" />
                            <div className="h-3 w-48 bg-slate-200 dark:bg-zinc-800 rounded-[2px]" />
                            <div className="h-6 w-24 bg-slate-100 dark:bg-zinc-800 rounded-[2px]" />
                        </div>
                        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800/50">
                            <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-[2px]" />
                            <div className="h-3 w-5/6 bg-slate-100 dark:bg-zinc-800 rounded-[2px]" />
                        </div>
                    </div>
                    {/* Right Column Skeleton */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-[#19191B] rounded-[2px] p-6 space-y-6">
                            <div className="h-5 w-40 bg-slate-200 dark:bg-zinc-800 rounded-[2px]" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="h-3.5 w-20 bg-slate-100 dark:bg-zinc-800/80 rounded-[2px]" />
                                        <div className="h-10 w-full bg-slate-50 dark:bg-zinc-800/50 rounded-[2px]" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center p-6 border-slate-200 dark:border-white/[0.06] rounded-[2px] bg-white dark:bg-[#19191B] shadow-sm">
                    <p className="text-sm font-mono text-slate-500">Vui lòng đăng nhập để xem thông tin tài khoản</p>
                    <Button className="mt-4 rounded-[2px] font-mono text-xs" onClick={() => router.push("/auth/sign-in")}>
                        ĐĂNG NHẬP
                    </Button>
                </Card>
            </div>
        );
    }

    // Gender Helper
    const getGenderLabel = (g?: string) => {
        if (!g) return "Chưa cập nhật";
        if (g.toLowerCase() === "male") return "Nam";
        if (g.toLowerCase() === "female") return "Nữ";
        return "Khác";
    };

    return (
        <div className="max-w-6xl mx-auto py-6 px-4 md:px-8 space-y-8">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono uppercase">
                        Quản trị hồ sơ
                    </h1>
                    <p className="text-xs text-slate-500 font-mono">
                        Cấu hình thông tin danh tính hệ thống của bạn.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button
                        variant={isEditingProfile ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className="rounded-[2px] text-xs font-mono border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-none"
                    >
                        <Edit3 className="h-3.5 w-3.5 mr-2" />
                        {isEditingProfile ? "HỦY BỎ" : "CHỈNH SỬA"}
                    </Button>
                </div>
            </div>

            <Separator className="border-slate-200/80 dark:border-white/[0.06]" />

            {/* Asymmetric Technical Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT SIDEBAR: Static Overview Info (col-span-4) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="relative border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#19191B] rounded-[2px] p-6 shadow-sm overflow-hidden group">
                        
                        {/* Decorative subtle visual top bar */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-slate-900 dark:bg-slate-100" />

                        <div className="flex flex-col items-center text-center space-y-4 pt-2">
                            {/* Avatar Section */}
                            <AvatarUpload
                                currentAvatar={currentAvatar}
                                name={user.name}
                                onAvatarChange={handleAvatarChange}
                                size="xl"
                            />

                            <div className="space-y-1 w-full">
                                <h2 className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 truncate">
                                    {user.name}
                                </h2>
                                <p className="text-xs font-mono text-slate-500 truncate select-all">
                                    {user.email}
                                </p>
                            </div>

                            {/* Verification & Role Badges */}
                            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                                <Badge 
                                    variant="outline" 
                                    className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400"
                                >
                                    {user.role}
                                </Badge>
                                {user.isVerified ? (
                                    <Badge 
                                        variant="outline" 
                                        className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                                    >
                                        <CheckCircle className="h-2.5 w-2.5" /> Verified
                                    </Badge>
                                ) : (
                                    <Badge 
                                        variant="outline" 
                                        className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-amber-50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30 text-amber-600 dark:text-amber-400"
                                    >
                                        Pending
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Monospace Technical Details Table */}
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/[0.04] space-y-3">
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> THAM GIA
                                </span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-300">
                                    {user.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                                        : "Chưa rõ"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> TRẠNG THÁI
                                </span>
                                <span className="font-mono font-semibold flex items-center gap-1 text-slate-800 dark:text-slate-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Active
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Key className="h-3 w-3" /> ID HỆ THỐNG
                                </span>
                                <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 text-[10px] select-all">
                                    {user.id.slice(0, 8)}...
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Dynamic Details Form & Configurations (col-span-8) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* CARD 1: Detailed Profile Info */}
                    <Card className="border-slate-200/80 dark:border-white/[0.06] rounded-[2px] bg-white dark:bg-[#19191B] shadow-sm">
                        <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/[0.04]">
                            <CardTitle className="text-sm font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-slate-100">
                                Thông tin tài khoản chi tiết
                            </CardTitle>
                            <CardDescription className="text-xs font-mono text-slate-500">
                                Thiết lập các thuộc tính định danh cá nhân hiển thị trong tổ chức.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isEditingProfile ? (
                                <Form {...profileForm}>
                                    <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            
                                            <FormField
                                                control={profileForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1.5">
                                                        <FormLabel className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Họ và tên</FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                className="rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-zinc-900/50 text-sm focus-visible:ring-0 focus-visible:border-slate-800 dark:focus-visible:border-slate-200 transition-colors font-mono" 
                                                                {...field} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-xs text-red-500 font-mono" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={profileForm.control}
                                                name="gender"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1.5">
                                                        <FormLabel className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Giới tính</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-zinc-900/50 text-sm focus:ring-0 focus:border-slate-800 dark:focus:border-slate-200 transition-colors font-mono">
                                                                    <SelectValue placeholder="Chọn giới tính" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#19191B] font-mono text-xs">
                                                                <SelectItem value="male">Nam</SelectItem>
                                                                <SelectItem value="female">Nữ</SelectItem>
                                                                <SelectItem value="other">Khác</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage className="text-xs text-red-500 font-mono" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={profileForm.control}
                                                name="birthDate"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1.5">
                                                        <FormLabel className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Ngày sinh</FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                type="date" 
                                                                className="rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-zinc-900/50 text-sm focus-visible:ring-0 focus-visible:border-slate-800 dark:focus-visible:border-slate-200 transition-colors font-mono" 
                                                                {...field} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-xs text-red-500 font-mono" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={profileForm.control}
                                                name="location"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1.5">
                                                        <FormLabel className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Địa chỉ</FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                placeholder="TP. Hồ Chí Minh, Việt Nam"
                                                                className="rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-zinc-900/50 text-sm focus-visible:ring-0 focus-visible:border-slate-800 dark:focus-visible:border-slate-200 transition-colors font-mono" 
                                                                {...field} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-xs text-red-500 font-mono" />
                                                    </FormItem>
                                                )}
                                            />

                                        </div>

                                        {/* Phone number notice in Edit Mode */}
                                        <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-white/[0.04] rounded-[2px] flex items-start gap-2.5">
                                            <Info className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-mono text-slate-500 leading-normal">
                                                Số điện thoại (<span className="font-semibold">{user.number || "Chưa đặt"}</span>) và Email là các thông tin xác thực bắt buộc và không thể tự chỉnh sửa trực tiếp để đảm bảo tính an toàn tài khoản.
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm" 
                                                className="rounded-[2px] text-xs font-mono shadow-none"
                                                onClick={() => {
                                                    setIsEditingProfile(false);
                                                    profileForm.reset();
                                                }}
                                            >
                                                HỦY
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                disabled={isUpdating} 
                                                size="sm"
                                                className="rounded-[2px] text-xs font-mono bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-none"
                                            >
                                                {isUpdating ? (
                                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Save className="mr-2 h-3.5 w-3.5" />
                                                )}
                                                LƯU THAY ĐỔI
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            ) : (
                                /* Structured Monospace Layout for Viewing details */
                                <div className="divide-y divide-slate-100 dark:divide-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] rounded-[2px] bg-slate-50/20 dark:bg-zinc-900/10">
                                    <div className="py-3 px-4 flex justify-between items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Họ và tên</span>
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
                                    </div>
                                    <div className="py-3 px-4 flex justify-between items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</span>
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            {user.number || "Chưa cập nhật"}
                                            {user.number && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" title="Verified" />
                                            )}
                                        </span>
                                    </div>
                                    <div className="py-3 px-4 flex justify-between items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Giới tính</span>
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{getGenderLabel(user.gender)}</span>
                                    </div>
                                    <div className="py-3 px-4 flex justify-between items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Ngày sinh</span>
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                            {user.birthDate
                                                ? new Date(user.birthDate).toLocaleDateString("vi-VN")
                                                : "Chưa cập nhật"}
                                        </span>
                                    </div>
                                    <div className="py-3 px-4 flex justify-between items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Địa chỉ</span>
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px] sm:max-w-none">{user.location || "Chưa cập nhật"}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* CARD 2: Active Status text */}
                    <Card className="border-slate-200/80 dark:border-white/[0.06] rounded-[2px] bg-white dark:bg-[#19191B] shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.04]">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-slate-100">
                                    Trạng thái hoạt động
                                </CardTitle>
                                <CardDescription className="text-xs font-mono text-slate-500">
                                    Mô tả nhanh về trạng thái hiện tại hiển thị cho cộng sự.
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditingStatus(!isEditingStatus)}
                                className="h-8 rounded-[2px] text-xs font-mono shadow-none border-slate-200 dark:border-white/[0.08]"
                            >
                                {isEditingStatus ? "HỦY" : "THAY ĐỔI"}
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isEditingStatus ? (
                                <Form {...statusForm}>
                                    <form onSubmit={statusForm.handleSubmit(handleUpdateStatus)} className="space-y-4">
                                        <FormField
                                            control={statusForm.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="VD: Đang họp, Đang code tính năng mới, Đi ăn trưa..."
                                                            className="resize-none bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-white/[0.08] rounded-[2px] min-h-[80px] font-mono text-sm focus-visible:ring-0 focus-visible:border-slate-800 dark:focus-visible:border-slate-200 transition-colors"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs text-red-500 font-mono" />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex justify-end pt-1">
                                            <Button 
                                                type="submit" 
                                                disabled={isUpdatingStatus} 
                                                size="sm"
                                                className="rounded-[2px] text-xs font-mono bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-none"
                                            >
                                                {isUpdatingStatus ? (
                                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Save className="mr-2 h-3.5 w-3.5" />
                                                )}
                                                LƯU TRẠNG THÁI
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            ) : (
                                <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/20 border border-slate-200/60 dark:border-white/[0.04] rounded-[2px] flex items-center min-h-[64px]">
                                    <p className={`text-xs font-mono ${user.status ? "text-slate-800 dark:text-slate-200 font-semibold" : "text-slate-400 italic"}`}>
                                        "{user.status || "Chưa thiết lập trạng thái hoạt động"}"
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* CARD 3: Security Options & Sensitive Actions */}
                    <Card className="border-slate-200/80 dark:border-white/[0.06] rounded-[2px] bg-white dark:bg-[#19191B] shadow-sm">
                        <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/[0.04]">
                            <CardTitle className="text-sm font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-slate-100">
                                Thiết lập bảo mật nâng cao
                            </CardTitle>
                            <CardDescription className="text-xs font-mono text-slate-500">
                                Quản lý thông tin đăng nhập và cơ chế xác thực.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-center py-1">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">MẬT KHẨU TÀI KHOẢN</p>
                                    <p className="text-[10px] font-mono text-slate-500">Cập nhật mật khẩu định kỳ để duy trì an toàn.</p>
                                </div>
                                
                                {/* Right Drawer Slide-over Panel Trigger */}
                                <Sheet open={showPasswordDrawer} onOpenChange={setShowPasswordDrawer}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8 rounded-[2px] text-xs font-mono border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-none">
                                            THAY ĐỔI
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent 
                                        side="right" 
                                        className="w-full sm:max-w-md border-l border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] p-6 flex flex-col gap-6"
                                    >
                                        <SheetHeader className="p-0 border-b border-slate-100 dark:border-white/[0.04] pb-4">
                                            <SheetTitle className="text-sm font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <Lock className="h-4 w-4" /> Thay đổi mật khẩu
                                            </SheetTitle>
                                            <SheetDescription className="text-xs font-mono text-slate-500 pt-1 leading-normal">
                                                Nhập mật khẩu hiện tại và thiết lập mật khẩu mới. Mật khẩu mới cần tối thiểu 6 ký tự.
                                            </SheetDescription>
                                        </SheetHeader>

                                        <Form {...passwordForm}>
                                            <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4 flex-1">
                                                
                                                <FormField
                                                    control={passwordForm.control}
                                                    name="currentPassword"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1.5">
                                                            <FormLabel className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Mật khẩu hiện tại</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        type={showCurrentPassword ? "text" : "password"}
                                                                        className="rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-zinc-900/50 text-sm focus-visible:ring-0 focus-visible:border-slate-800 dark:focus-visible:border-slate-200 font-mono pr-10"
                                                                        {...field}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-600"
                                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                                    >
                                                                        {showCurrentPassword ? (
                                                                            <EyeOff className="h-3.5 w-3.5" />
                                                                        ) : (
                                                                            <Eye className="h-3.5 w-3.5" />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage className="text-xs text-red-500 font-mono" />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={passwordForm.control}
                                                    name="newPassword"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1.5">
                                                            <FormLabel className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Mật khẩu mới</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        type={showNewPassword ? "text" : "password"}
                                                                        className="rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-zinc-900/50 text-sm focus-visible:ring-0 focus-visible:border-slate-800 dark:focus-visible:border-slate-200 font-mono pr-10"
                                                                        {...field}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-600"
                                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                                    >
                                                                        {showNewPassword ? (
                                                                            <EyeOff className="h-3.5 w-3.5" />
                                                                        ) : (
                                                                            <Eye className="h-3.5 w-3.5" />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage className="text-xs text-red-500 font-mono" />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={passwordForm.control}
                                                    name="confirmPassword"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1.5">
                                                            <FormLabel className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Xác nhận mật khẩu mới</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        type={showConfirmPassword ? "text" : "password"}
                                                                        className="rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-zinc-900/50 text-sm focus-visible:ring-0 focus-visible:border-slate-800 dark:focus-visible:border-slate-200 font-mono pr-10"
                                                                        {...field}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-600"
                                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                    >
                                                                        {showConfirmPassword ? (
                                                                            <EyeOff className="h-3.5 w-3.5" />
                                                                        ) : (
                                                                            <Eye className="h-3.5 w-3.5" />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage className="text-xs text-red-500 font-mono" />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="pt-6 flex justify-end gap-2 border-t border-slate-100 dark:border-white/[0.04] mt-8">
                                                    <SheetClose asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="rounded-[2px] text-xs font-mono shadow-none"
                                                            onClick={() => {
                                                                passwordForm.reset();
                                                                setShowCurrentPassword(false);
                                                                setShowNewPassword(false);
                                                                setShowConfirmPassword(false);
                                                            }}
                                                        >
                                                            HỦY
                                                        </Button>
                                                    </SheetClose>
                                                    <Button 
                                                        type="submit" 
                                                        disabled={isChangingPassword}
                                                        className="rounded-[2px] text-xs font-mono bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-none"
                                                    >
                                                        {isChangingPassword ? (
                                                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Save className="mr-2 h-3.5 w-3.5" />
                                                        )}
                                                        CẬP NHẬT MẬT KHẨU
                                                    </Button>
                                                </div>
                                            </form>
                                        </Form>
                                    </SheetContent>
                                </Sheet>
                            </div>

                            <Separator className="border-slate-100 dark:border-white/[0.04]" />

                            {/* Technical Log Sessions */}
                            <div className="space-y-3 pt-2">
                                <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Hoạt động đăng nhập gần nhất</h3>
                                <div className="divide-y divide-slate-100 dark:divide-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] rounded-[2px] bg-slate-50/20 dark:bg-zinc-900/10">
                                    <div className="py-2.5 px-3 flex justify-between items-center text-[11px] font-mono">
                                        <span className="text-slate-500">Lần đăng nhập cuối cùng</span>
                                        <span className="text-slate-800 dark:text-slate-300 font-semibold">
                                            {user.lastSeen
                                                ? new Date(user.lastSeen).toLocaleString("vi-VN")
                                                : "Không rõ"}
                                        </span>
                                    </div>
                                    <div className="py-2.5 px-3 flex justify-between items-center text-[11px] font-mono">
                                        <span className="text-slate-500">Thiết bị hiện tại</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Desktop Browser (Active)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

            </div>

        </div>
    );
}
