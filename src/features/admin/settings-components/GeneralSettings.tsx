import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Globe, AlertTriangle } from 'lucide-react';
import { SettingRow } from './SettingRow';

interface GeneralSettingsProps {
    orgSettings: {
        siteName: string;
        siteDescription: string;
        maintenanceMode: boolean;
    };
    handleOrgChange: (key: string, value: any) => void;
}

export function GeneralSettings({ orgSettings, handleOrgChange }: GeneralSettingsProps) {
    return (
        <Card className="rounded-xl border border-border shadow-sm bg-card text-card-foreground overflow-hidden">
            <CardHeader className="bg-slate-50/40 dark:bg-slate-900/10 border-b border-border py-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Cài đặt chung
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Thông tin nhận diện và trạng thái hệ thống
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="grid gap-4 max-w-2xl">
                    <div className="space-y-1.5">
                        <Label htmlFor="siteName" className="text-xs font-semibold">Tên tổ chức / Hệ thống</Label>
                        <Input
                            id="siteName"
                            value={orgSettings.siteName}
                            onChange={(e) => handleOrgChange('siteName', e.target.value)}
                            placeholder="NEXUS Enterprise"
                            className="h-8 rounded-lg text-xs"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="siteDescription" className="text-xs font-semibold">Mô tả hệ thống</Label>
                        <Input
                            id="siteDescription"
                            value={orgSettings.siteDescription}
                            onChange={(e) => handleOrgChange('siteDescription', e.target.value)}
                            placeholder="Hệ thống giao tiếp nội bộ và quản trị tri thức doanh nghiệp"
                            className="h-8 rounded-lg text-xs"
                        />
                    </div>
                </div>

                <Separator className="my-2 bg-border/60" />

                <SettingRow
                    icon={AlertTriangle}
                    label="Chế độ bảo trì"
                    description="Khi bật, chỉ Quản trị viên mới có thể truy cập hệ thống. Người dùng khác sẽ nhận được thông báo hệ thống đang bảo trì."
                >
                    <Switch
                        checked={orgSettings.maintenanceMode}
                        onCheckedChange={(checked) => handleOrgChange('maintenanceMode', checked)}
                        className="data-[state=checked]:bg-amber-500"
                    />
                </SettingRow>
            </CardContent>
        </Card>
    );
}
