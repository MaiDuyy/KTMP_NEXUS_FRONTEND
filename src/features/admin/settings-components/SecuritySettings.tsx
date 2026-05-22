import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Key, Settings, AlertTriangle } from 'lucide-react';
import { SettingRow } from './SettingRow';

interface SecuritySettingsProps {
    orgSettings: {
        twoFactorAuth: boolean;
        sessionTimeout: number;
        maxLoginAttempts: number;
    };
    handleOrgChange: (key: string, value: any) => void;
}

export function SecuritySettings({ orgSettings, handleOrgChange }: SecuritySettingsProps) {
    return (
        <Card className="rounded-xl border border-border shadow-sm bg-card text-card-foreground overflow-hidden">
            <CardHeader className="bg-slate-50/40 dark:bg-slate-900/10 border-b border-border py-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Chính sách bảo mật
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Cấu hình các quy tắc an toàn hệ thống và kiểm soát truy cập
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-1">
                <SettingRow
                    icon={Key}
                    label="Bắt buộc xác thực 2 bước (2FA)"
                    description="Yêu cầu tất cả tài khoản thuộc nhóm Quản trị viên phải bật 2FA để có quyền đăng nhập và thực hiện thao tác."
                >
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={orgSettings.twoFactorAuth}
                            onCheckedChange={(checked) => handleOrgChange('twoFactorAuth', checked)}
                        />
                        {orgSettings.twoFactorAuth && (
                            <Badge className="bg-green-100/80 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-900/30 rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                                Bảo mật cao
                            </Badge>
                        )}
                    </div>
                </SettingRow>

                <SettingRow
                    icon={Settings}
                    label="Thời gian hết hạn phiên làm việc"
                    description="Tự động đăng xuất tài khoản sau một khoảng thời gian người dùng không có hoạt động."
                >
                    <Select
                        value={orgSettings.sessionTimeout.toString()}
                        onValueChange={(value) => handleOrgChange('sessionTimeout', parseInt(value))}
                    >
                        <SelectTrigger className="w-36 h-8 rounded-lg text-xs">
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
                    icon={AlertTriangle}
                    label="Giới hạn số lần đăng nhập sai"
                    description="Tự động tạm khóa tài khoản trong 15 phút sau khi nhập sai mật khẩu quá số lần giới hạn."
                >
                    <Select
                        value={orgSettings.maxLoginAttempts.toString()}
                        onValueChange={(value) => handleOrgChange('maxLoginAttempts', parseInt(value))}
                    >
                        <SelectTrigger className="w-36 h-8 rounded-lg text-xs">
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
    );
}
