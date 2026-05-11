'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Settings,
    Bell,
    Shield,
    Globe,
    Mail,
    Database,
    Palette,
    Key,
    Save,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Moon,
    Sun,
    Monitor,
    Languages,
    Loader2,
} from 'lucide-react';
import { useGetOrgSettingsQuery, useUpdateOrgSettingsMutation } from '@/src/redux/feature/adminApi';
import { toast } from 'sonner';

export function AdminSettingsPage() {
    const { data, isLoading, refetch } = useGetOrgSettingsQuery();
    const [updateSettings, { isLoading: isUpdating }] = useUpdateOrgSettingsMutation();

    const [settings, setSettings] = useState({
        // General Settings
        siteName: '',
        siteDescription: '',
        maintenanceMode: false,

        // Notification Settings
        emailNotifications: true,
        pushNotifications: true,
        allowUserInvite: true,
        allowGuestInvite: false,

        // Security Settings
        twoFactorAuth: false,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordExpiry: 90,

        // Appearance
        theme: 'system',
        language: 'vi',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
    });

    useEffect(() => {
        if (data?.settings) {
            setSettings(prev => ({ ...prev, ...data.settings }));
        }
    }, [data]);

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            await updateSettings(settings).unwrap();
            toast.success('Đã lưu cài đặt tổ chức thành công!');
        } catch (error) {
            toast.error('Có lỗi xảy ra khi lưu cài đặt');
        }
    };

    const handleReset = () => {
        refetch();
        toast.info('Đã tải lại cài đặt từ máy chủ');
    };

    const SettingRow = ({ icon: Icon, label, description, children }: { icon?: any, label: string, description?: string, children: React.ReactNode }) => (
        <div className="flex items-center justify-between py-4 group">
            <div className="flex items-start gap-3">
                {Icon && <div className="p-2 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icon className="w-5 h-5" />
                </div>}
                <div className="pt-1">
                    <Label className="text-sm font-bold text-slate-900 leading-none">{label}</Label>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
                    )}
                </div>
            </div>
            <div className="flex-shrink-0 ml-4">{children}</div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">Đang tải cấu hình hệ thống...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-5xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Settings className="w-8 h-8 text-primary" />
                        Cài đặt tổ chức
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý cấu hình toàn cầu và chính sách bảo mật cho tổ chức
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset} className="rounded-xl h-11 px-6">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Làm mới
                    </Button>
                    <Button onClick={handleSave} disabled={isUpdating} className="rounded-xl h-11 px-8 shadow-lg shadow-primary/20">
                        {isUpdating ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {isUpdating ? 'Đang lưu...' : 'Lưu cài đặt'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <div className="bg-slate-100/50 p-1 rounded-2xl w-fit">
                    <TabsList className="bg-transparent h-10 gap-1">
                        <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-8">
                            <Globe className="w-3.5 h-3.5 mr-2" />
                            Chung
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-8">
                            <Bell className="w-3.5 h-3.5 mr-2" />
                            Thông báo
                        </TabsTrigger>
                        <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-8">
                            <Shield className="w-3.5 h-3.5 mr-2" />
                            Bảo mật
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-8">
                            <Palette className="w-3.5 h-3.5 mr-2" />
                            Giao diện
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* General Settings */}
                <TabsContent value="general" className="focus-visible:outline-none">
                    <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-xl font-bold">Cài đặt chung</CardTitle>
                            <CardDescription>Thông tin nhận diện và trạng thái hệ thống</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid gap-6 max-w-2xl">
                                <div className="space-y-2">
                                    <Label htmlFor="siteName" className="font-bold">Tên tổ chức / Hệ thống</Label>
                                    <Input
                                        id="siteName"
                                        value={settings.siteName}
                                        onChange={(e) => handleChange('siteName', e.target.value)}
                                        placeholder="OTT Chat Enterprise"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="siteDescription" className="font-bold">Mô tả</Label>
                                    <Input
                                        id="siteDescription"
                                        value={settings.siteDescription}
                                        onChange={(e) => handleChange('siteDescription', e.target.value)}
                                        placeholder="Hệ thống giao tiếp nội bộ mạnh mẽ"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>

                            <Separator className="bg-slate-100" />

                            <SettingRow
                                icon={AlertTriangle}
                                label="Chế độ bảo trì"
                                description="Khi bật, chỉ Admin mới có thể truy cập hệ thống. Người dùng khác sẽ thấy thông báo bảo trì."
                            >
                                <Switch
                                    checked={settings.maintenanceMode}
                                    onCheckedChange={(checked) => handleChange('maintenanceMode', checked)}
                                    className="data-[state=checked]:bg-amber-500"
                                />
                            </SettingRow>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="focus-visible:outline-none">
                    <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-xl font-bold">Quản lý quyền & Thông báo</CardTitle>
                            <CardDescription>Cấu hình luồng mời và thông báo hệ thống</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 divide-y divide-slate-100">
                            <SettingRow
                                icon={Mail}
                                label="Hệ thống Email"
                                description="Sử dụng dịch vụ email để gửi mã OTP và lời mời"
                            >
                                <Switch
                                    checked={settings.emailNotifications}
                                    onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
                                />
                            </SettingRow>

                            <SettingRow
                                icon={Bell}
                                label="Thông báo đẩy (Push)"
                                description="Tự động gửi thông báo đến ứng dụng Web và Mobile"
                            >
                                <Switch
                                    checked={settings.pushNotifications}
                                    onCheckedChange={(checked) => handleChange('pushNotifications', checked)}
                                />
                            </SettingRow>

                            <SettingRow
                                label="Cho phép Người dùng mời"
                                description="Người dùng thông thường có quyền mời thành viên mới vào tổ chức"
                            >
                                <Switch
                                    checked={settings.allowUserInvite}
                                    onCheckedChange={(checked) => handleChange('allowUserInvite', checked)}
                                />
                            </SettingRow>

                            <SettingRow
                                label="Cho phép Khách (Guest)"
                                description="Hỗ trợ mời người dùng bên ngoài vào các workspace cụ thể"
                            >
                                <Switch
                                    checked={settings.allowGuestInvite}
                                    onCheckedChange={(checked) => handleChange('allowGuestInvite', checked)}
                                />
                            </SettingRow>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="focus-visible:outline-none">
                    <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-xl font-bold">Chính sách bảo mật</CardTitle>
                            <CardDescription>Cấu hình các quy tắc an toàn và kiểm soát truy cập</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 divide-y divide-slate-100">
                            <SettingRow
                                icon={Key}
                                label="Bắt buộc Xác thực 2 bước (2FA)"
                                description="Yêu cầu tất cả tài khoản Admin phải bật 2FA để đăng nhập"
                            >
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={settings.twoFactorAuth}
                                        onCheckedChange={(checked) => handleChange('twoFactorAuth', checked)}
                                    />
                                    {settings.twoFactorAuth && (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none rounded-full px-3">
                                            Bảo mật cao
                                        </Badge>
                                    )}
                                </div>
                            </SettingRow>

                            <SettingRow
                                label="Thời gian hết hạn phiên (Session)"
                                description="Tự động đăng xuất sau khi không hoạt động"
                            >
                                <Select
                                    value={settings.sessionTimeout.toString()}
                                    onValueChange={(value) => handleChange('sessionTimeout', parseInt(value))}
                                >
                                    <SelectTrigger className="w-36 h-10 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 phút</SelectItem>
                                        <SelectItem value="30">30 phút</SelectItem>
                                        <SelectItem value="60">1 giờ</SelectItem>
                                        <SelectItem value="120">2 giờ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </SettingRow>

                            <SettingRow
                                label="Giới hạn đăng nhập sai"
                                description="Tạm thời khóa tài khoản sau quá nhiều lần thử thất bại"
                            >
                                <Select
                                    value={settings.maxLoginAttempts.toString()}
                                    onValueChange={(value) => handleChange('maxLoginAttempts', parseInt(value))}
                                >
                                    <SelectTrigger className="w-36 h-10 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">3 lần</SelectItem>
                                        <SelectItem value="5">5 lần</SelectItem>
                                        <SelectItem value="10">10 lần</SelectItem>
                                    </SelectContent>
                                </Select>
                            </SettingRow>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appearance Settings */}
                <TabsContent value="appearance" className="focus-visible:outline-none">
                    <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-xl font-bold">Giao diện & Địa phương</CardTitle>
                            <CardDescription>Tùy chỉnh phong cách hiển thị và định dạng vùng</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 divide-y divide-slate-100">
                            <SettingRow
                                icon={Palette}
                                label="Chế độ hiển thị"
                                description="Giao diện mặc định cho tổ chức"
                            >
                                <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                                    {[
                                        { value: 'light', icon: Sun, label: 'Sáng' },
                                        { value: 'dark', icon: Moon, label: 'Tối' },
                                        { value: 'system', icon: Monitor, label: 'Hệ thống' },
                                    ].map(({ value, icon: Icon, label }) => (
                                        <Button
                                            key={value}
                                            variant={settings.theme === value ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => handleChange('theme', value)}
                                            className={cn(
                                                "gap-1.5 rounded-xl h-8 px-4 text-xs font-bold",
                                                settings.theme === value ? "bg-white shadow-sm hover:bg-white text-primary" : "text-slate-500 hover:bg-slate-200"
                                            )}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {label}
                                        </Button>
                                    ))}
                                </div>
                            </SettingRow>

                            <SettingRow
                                icon={Languages}
                                label="Ngôn ngữ chính"
                                description="Ngôn ngữ mặc định khi tạo tài khoản mới"
                            >
                                <Select
                                    value={settings.language}
                                    onValueChange={(value) => handleChange('language', value)}
                                >
                                    <SelectTrigger className="w-44 h-10 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                                        <SelectItem value="en">🇺🇸 English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </SettingRow>

                            <SettingRow
                                label="Định dạng thời gian"
                                description="Quy chuẩn hiển thị giờ trong hệ thống"
                            >
                                <Select
                                    value={settings.timeFormat}
                                    onValueChange={(value) => handleChange('timeFormat', value)}
                                >
                                    <SelectTrigger className="w-44 h-10 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="24h">24 giờ (14:30)</SelectItem>
                                        <SelectItem value="12h">12 giờ (2:30 PM)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </SettingRow>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
