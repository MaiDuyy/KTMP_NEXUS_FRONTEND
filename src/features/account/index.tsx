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
        // <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
        <div className="max-w-full mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Cài đặt tài khoản</h1>
                    <p className="text-muted-foreground">Quản lý thông tin cá nhân của bạn</p>
                </div>
                {/* <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Đăng xuất
                </Button> */}
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-6">
                            <AvatarUpload
                                currentAvatar={currentAvatar}
                                name={user.name}
                                onAvatarChange={handleAvatarChange}
                                size="xl"
                            />
                            <div>
                                <CardTitle className="text-2xl">{user.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Mail className="h-4 w-4" />
                                    {user.email}
                                </CardDescription>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={user.isVerified ? "default" : "secondary"}>
                                        <Shield className="h-3 w-3 mr-1" />
                                        {user.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                                    </Badge>
                                    <Badge variant="outline">
                                        {user.role}
                                    </Badge>
                                    {/* <Badge
                                        variant="outline"
                                        className={user.isOnline ? "border-green-500 text-green-600" : ""}
                                    >
                                        <Circle className={`h-2 w-2 mr-1 ${user.isOnline ? "fill-green-500 text-green-500" : ""}`} />
                                        {user.isOnline ? "Online" : "Offline"}
                                    </Badge> */}
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                        >
                            <Edit3 className="h-4 w-4 mr-2" />
                            {isEditingProfile ? "Hủy" : "Chỉnh sửa"}
                        </Button>
                    </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6">
                    {isEditingProfile ? (
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={profileForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Họ và tên</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
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
                                                <FormLabel>Giới tính</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
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
                                                <FormLabel>Ngày sinh</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
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
                                                <FormLabel>Địa chỉ</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="TP. Hồ Chí Minh" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" disabled={isUpdating}>
                                    {isUpdating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Lưu thay đổi
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Họ và tên</p>
                                    <p className="font-medium">{user.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                                    <p className="font-medium">{user.number}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Ngày sinh</p>
                                    <p className="font-medium">
                                        {user.birthDate
                                            ? new Date(user.birthDate).toLocaleDateString("vi-VN")
                                            : "Chưa cập nhật"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                                    <p className="font-medium">{user.location || "Chưa cập nhật"}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Trạng thái hoạt động
                            </CardTitle>
                            <CardDescription>
                                Hiển thị trạng thái cho bạn bè thấy
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingStatus(!isEditingStatus)}
                        >
                            <Edit3 className="h-4 w-4 mr-2" />
                            {isEditingStatus ? "Hủy" : "Chỉnh sửa"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
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
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isUpdatingStatus}>
                                    {isUpdatingStatus ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Cập nhật
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <p className={user.status ? "text-foreground" : "text-muted-foreground italic"}>
                                {user.status || "Chưa đặt trạng thái"}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Thông tin tài khoản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="font-medium">Ngày tạo tài khoản</p>
                            <p className="text-sm text-muted-foreground">
                                {user.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    : "Không xác định"}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="font-medium">Lần đăng nhập cuối</p>
                            <p className="text-sm text-muted-foreground">
                                {user.lastSeen
                                    ? new Date(user.lastSeen).toLocaleString("vi-VN")
                                    : "Chưa xác định"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Bảo mật
                            </CardTitle>
                            <CardDescription>
                                Quản lý mật khẩu và bảo mật tài khoản
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Key className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Mật khẩu</p>
                                <p className="text-sm text-muted-foreground">Thay đổi mật khẩu đăng nhập</p>
                            </div>
                        </div>
                        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Đổi mật khẩu
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Lock className="h-5 w-5" />
                                        Đổi mật khẩu
                                    </DialogTitle>
                                    <DialogDescription>
                                        Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...passwordForm}>
                                    <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                                        <FormField
                                            control={passwordForm.control}
                                            name="currentPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Mật khẩu hiện tại</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                type={showCurrentPassword ? "text" : "password"}
                                                                placeholder="Nhập mật khẩu hiện tại"
                                                                {...field}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute right-0 top-0 h-full px-3"
                                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            >
                                                                {showCurrentPassword ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
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
                                                    <FormLabel>Mật khẩu mới</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                type={showNewPassword ? "text" : "password"}
                                                                placeholder="Nhập mật khẩu mới"
                                                                {...field}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute right-0 top-0 h-full px-3"
                                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                            >
                                                                {showNewPassword ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
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
                                                    <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            placeholder="Nhập lại mật khẩu mới"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter className="pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
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
                                                Đổi mật khẩu
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        </div>
        // </div>
    );
}
