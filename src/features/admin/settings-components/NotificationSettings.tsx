import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, Globe, Shield } from 'lucide-react';
import { SettingRow } from './SettingRow';

interface NotificationSettingsProps {
    orgSettings: {
        emailNotifications: boolean;
        pushNotifications: boolean;
        allowUserInvite: boolean;
        allowGuestInvite: boolean;
    };
    handleOrgChange: (key: string, value: any) => void;
}

export function NotificationSettings({ orgSettings, handleOrgChange }: NotificationSettingsProps) {
    return (
        <Card className="rounded-xl border border-border shadow-sm bg-card text-card-foreground overflow-hidden">
            <CardHeader className="bg-slate-50/40 dark:bg-slate-900/10 border-b border-border py-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    Quản lý quyền & Thông báo
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Cấu hình luồng mời thành viên và kênh thông báo của tổ chức
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-1">
                <SettingRow
                    icon={Mail}
                    label="Hệ thống Email"
                    description="Sử dụng dịch vụ email tích hợp để gửi mã xác thực OTP và gửi lời mời thành viên."
                >
                    <Switch
                        checked={orgSettings.emailNotifications}
                        onCheckedChange={(checked) => handleOrgChange('emailNotifications', checked)}
                    />
                </SettingRow>

                <SettingRow
                    icon={Bell}
                    label="Thông báo đẩy (Push)"
                    description="Tự động gửi thông báo thời gian thực đến ứng dụng Web và Mobile khi có tin nhắn hoặc sự kiện mới."
                >
                    <Switch
                        checked={orgSettings.pushNotifications}
                        onCheckedChange={(checked) => handleOrgChange('pushNotifications', checked)}
                    />
                </SettingRow>

                <SettingRow
                    icon={Globe}
                    label="Cho phép người dùng mời thành viên"
                    description="Thành viên thông thường có quyền mời tài khoản mới tham gia vào tổ chức."
                >
                    <Switch
                        checked={orgSettings.allowUserInvite}
                        onCheckedChange={(checked) => handleOrgChange('allowUserInvite', checked)}
                    />
                </SettingRow>

                <SettingRow
                    icon={Shield}
                    label="Cho phép khách bên ngoài (Guest)"
                    description="Hỗ trợ mời người dùng bên ngoài tổ chức vào các phòng ban hoặc workspace cụ thể với quyền hạn hạn chế."
                >
                    <Switch
                        checked={orgSettings.allowGuestInvite}
                        onCheckedChange={(checked) => handleOrgChange('allowGuestInvite', checked)}
                    />
                </SettingRow>
            </CardContent>
        </Card>
    );
}
