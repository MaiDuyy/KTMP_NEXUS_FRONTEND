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
    Circle,
    Settings,
    Edit3,
    Lock,
    Eye,
    EyeOff,
    Key,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

import { AvatarUpload } from "./avatar-upload";
import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";
import { logOut, setCredentials } from "@/src/redux/feature/authSlice";
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
    const { user: authUser } = useAppSelector((state) => state.auth);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

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
    }, [user]);

    const handleUpdateProfile = async (data: z.infer<typeof profileSchema>) => {
        try {
            const result = await updateAccount(data).unwrap();
            toast.success(result.message);
            setIsEditingProfile(false);
            refetch();

            // Update auth state
            if (authUser && result.user) {
                dispatch(setCredentials({
                    user: { ...authUser, ...result.user },
                    accessToken: "",
                    refreshToken: "",
                }));
            }
        } catch (error: any) {
            toast.error(error?.data?.message || "Cập nhật thất bại!");
        }
    };

    const handleUpdateStatus = async (data: z.infer<typeof statusSchema>) => {
        try {
            const result = await updateStatus(data).unwrap();
            toast.success(result.message);
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
            dispatch(logOut());
            toast.success("Đăng xuất thành công!");
            router.push("/auth/sign-in");
        } catch (error) {
            dispatch(logOut());
            router.push("/auth/sign-in");
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
            setShowPasswordModal(false);
            passwordForm.reset();
            setShowCurrentPassword(false);
            setShowNewPassword(false);
        } catch (error: any) {
            toast.error(error?.data?.message || "Đổi mật khẩu thất bại!");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md text-center p-6">
                    <p className="text-muted-foreground">Vui lòng đăng nhập để xem thông tin tài khoản</p>
                    <Button className="mt-4" onClick={() => router.push("/auth/sign-in")}>
                        Đăng nhập
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 md:px-8 space-y-10">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Cài đặt tài khoản</h1>
                <p className="text-sm text-muted-foreground">Quản lý thông tin cá nhân và cài đặt bảo mật của bạn.</p>
            </div>

            <Separator className="my-6" />

            {/* Profile Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-1">
                    <h2 className="text-base font-medium">Hồ sơ cá nhân</h2>
                    <p className="text-sm text-muted-foreground">
                        Thông tin cơ bản của bạn, được hiển thị công khai với các thành viên khác trong tổ chức.
                    </p>
                </div>
                <div className="md:col-span-2">
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader className="pb-5 border-b border-muted/40">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <AvatarUpload
                                        currentAvatar={currentAvatar}
                                        name={user.name}
                                        onAvatarChange={handleAvatarChange}
                                        size="md"
                                    />
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-semibold">{user.name}</CardTitle>
                                        <CardDescription className="text-sm">
                                            {user.email}
                                        </CardDescription>
                                        <div className="flex items-center gap-2 pt-1">
                                            <Badge variant={user.isVerified ? "secondary" : "outline"} className="font-medium text-[10px] uppercase tracking-wider px-2 py-0.5">
                                                {user.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                                            </Badge>
                                            <Badge variant="outline" className="font-medium text-[10px] uppercase tracking-wider px-2 py-0.5 bg-muted/20">
                                                {user.role}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    className="h-8 shadow-none"
                                >
                                    <Edit3 className="h-3.5 w-3.5 mr-2" />
                                    {isEditingProfile ? "Hủy" : "Chỉnh sửa"}
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            {isEditingProfile ? (
                                <Form {...profileForm}>
                                    <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <FormField
                                                control={profileForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Họ và tên</FormLabel>
                                                        <FormControl>
                                                            <Input className="bg-muted/30" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={profileForm.control}
                                                name="gender"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Giới tính</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-muted/30">
                                                                    <SelectValue placeholder="Chọn giới tính" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="male">Nam</SelectItem>
                                                                <SelectItem value="female">Nữ</SelectItem>
                                                                <SelectItem value="other">Khác</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={profileForm.control}
                                                name="birthDate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Ngày sinh</FormLabel>
                                                        <FormControl>
                                                            <Input className="bg-muted/30" type="date" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={profileForm.control}
                                                name="location"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Địa chỉ</FormLabel>
                                                        <FormControl>
                                                            <Input className="bg-muted/30" placeholder="TP. Hồ Chí Minh" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <Button type="submit" disabled={isUpdating} size="sm">
                                                {isUpdating ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="mr-2 h-4 w-4" />
                                                )}
                                                Lưu thay đổi
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                                    <div className="space-y-1.5">
                                        <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Họ và tên</p>
                                        <p className="text-sm font-medium">{user.name}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Số điện thoại</p>
                                        <p className="text-sm font-medium">{user.number || "Chưa cập nhật"}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Ngày sinh</p>
                                        <p className="text-sm font-medium">
                                            {user.birthDate
                                                ? new Date(user.birthDate).toLocaleDateString("vi-VN")
                                                : "Chưa cập nhật"}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Địa chỉ</p>
                                        <p className="text-sm font-medium">{user.location || "Chưa cập nhật"}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Separator className="my-6 border-muted/60" />

            {/* Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-1">
                    <h2 className="text-base font-medium">Trạng thái hoạt động</h2>
                    <p className="text-sm text-muted-foreground">
                        Hiển thị trạng thái hiện tại của bạn cho đồng nghiệp trong không gian làm việc.
                    </p>
                </div>
                <div className="md:col-span-2">
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-muted/40">
                            <CardTitle className="text-base font-medium flex items-center">
                                Trạng thái
                            </CardTitle>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsEditingStatus(!isEditingStatus)}
                                className="h-8 shadow-none"
                            >
                                <Edit3 className="h-3.5 w-3.5 mr-2" />
                                {isEditingStatus ? "Hủy" : "Cập nhật"}
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
                                                            placeholder="Nhập trạng thái của bạn (VD: Đang bận, Đang họp...)"
                                                            className="resize-none bg-muted/30 min-h-[100px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex justify-end pt-2">
                                            <Button type="submit" disabled={isUpdatingStatus} size="sm">
                                                {isUpdatingStatus ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="mr-2 h-4 w-4" />
                                                )}
                                                Lưu trạng thái
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            ) : (
                                <div className="p-4 bg-muted/30 rounded-lg border border-muted/40 flex items-center min-h-[80px]">
                                    <p className={`text-sm ${user.status ? "text-foreground font-medium" : "text-muted-foreground italic"}`}>
                                        {user.status || "Chưa đặt trạng thái hoạt động"}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Separator className="my-6 border-muted/60" />

            {/* Security Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-1">
                    <h2 className="text-base font-medium">Bảo mật</h2>
                    <p className="text-sm text-muted-foreground">
                        Quản lý mật khẩu đăng nhập và thông tin đăng nhập cuối cùng.
                    </p>
                </div>
                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Mật khẩu</CardTitle>
                            <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center py-1">
                                <p className="text-sm text-muted-foreground">Mật khẩu đăng nhập</p>
                                <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" size="sm" className="h-8 shadow-none">
                                            Thay đổi
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl">Đổi mật khẩu</DialogTitle>
                                            <DialogDescription>
                                                Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <Form {...passwordForm}>
                                            <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4 pt-2">
                                                <FormField
                                                    control={passwordForm.control}
                                                    name="currentPassword"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs uppercase text-muted-foreground font-semibold">Mật khẩu hiện tại</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        type={showCurrentPassword ? "text" : "password"}
                                                                        className="bg-muted/30"
                                                                        {...field}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                                    >
                                                                        {showCurrentPassword ? (
                                                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                                        ) : (
                                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={passwordForm.control}
                                                    name="newPassword"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs uppercase text-muted-foreground font-semibold">Mật khẩu mới</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        type={showNewPassword ? "text" : "password"}
                                                                        className="bg-muted/30"
                                                                        {...field}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                                    >
                                                                        {showNewPassword ? (
                                                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                                        ) : (
                                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={passwordForm.control}
                                                    name="confirmPassword"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs uppercase text-muted-foreground font-semibold">Xác nhận mật khẩu</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="password"
                                                                    className="bg-muted/30"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <DialogFooter className="pt-6">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setShowPasswordModal(false);
                                                            passwordForm.reset();
                                                        }}
                                                    >
                                                        Hủy
                                                    </Button>
                                                    <Button type="submit" disabled={isChangingPassword}>
                                                        {isChangingPassword ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="mr-2 h-4 w-4" />
                                                        )}
                                                        Lưu mật khẩu
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-muted/60">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Hoạt động đăng nhập</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">Ngày tham gia</p>
                                <p className="text-sm font-medium">
                                    {user.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })
                                        : "Không xác định"}
                                </p>
                            </div>
                            <Separator className="border-muted/40" />
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">Lần đăng nhập cuối</p>
                                <p className="text-sm font-medium">
                                    {user.lastSeen
                                        ? new Date(user.lastSeen).toLocaleString("vi-VN")
                                        : "Chưa xác định"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
        // </div>
    );
}
