import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Palette, Sun, Moon, Monitor, Languages, Settings } from 'lucide-react';
import { SettingRow } from './SettingRow';

interface AppearanceSettingsProps {
    orgSettings: {
        theme: string;
        language: string;
        timeFormat: string;
    };
    handleOrgChange: (key: string, value: any) => void;
}

export function AppearanceSettings({ orgSettings, handleOrgChange }: AppearanceSettingsProps) {
    return (
        <Card className="rounded-xl border border-border shadow-sm bg-card text-card-foreground overflow-hidden">
            <CardHeader className="bg-slate-50/40 dark:bg-slate-900/10 border-b border-border py-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Giao diện & Địa phương
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Tùy chỉnh phong cách hiển thị mặc định và định dạng vùng
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-1">
                <SettingRow
                    icon={Palette}
                    label="Chế độ hiển thị mặc định"
                    description="Thiết lập giao diện ban đầu khi người dùng mới truy cập hệ thống."
                >
                    <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg gap-0.5 border border-border/40">
                        {[
                            { value: 'light', icon: Sun, label: 'Sáng' },
                            { value: 'dark', icon: Moon, label: 'Tối' },
                            { value: 'system', icon: Monitor, label: 'Hệ thống' },
                        ].map(({ value, icon: Icon, label }) => (
                            <Button
                                key={value}
                                variant={orgSettings.theme === value ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => handleOrgChange('theme', value)}
                                className={cn(
                                    "gap-1 rounded-md h-7 px-3 text-xs font-semibold transition-all",
                                    orgSettings.theme === value
                                        ? "bg-white dark:bg-slate-900 shadow-sm hover:bg-white dark:hover:bg-slate-900 text-primary border border-border/20"
                                        : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/60"
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
                    label="Ngôn ngữ chính hệ thống"
                    description="Ngôn ngữ mặc định cho giao diện và email tự động khi tạo tài khoản mới."
                >
                    <Select
                        value={orgSettings.language}
                        onValueChange={(value) => handleOrgChange('language', value)}
                    >
                        <SelectTrigger className="w-44 h-8 rounded-lg text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                            <SelectItem value="en">🇺🇸 English</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>

                <SettingRow
                    icon={Settings}
                    label="Định dạng hiển thị thời gian"
                    description="Quy chuẩn hiển thị giờ (24h hoặc 12h) trong các phòng chat và nhật ký hệ thống."
                >
                    <Select
                        value={orgSettings.timeFormat}
                        onValueChange={(value) => handleOrgChange('timeFormat', value)}
                    >
                        <SelectTrigger className="w-44 h-8 rounded-lg text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">24 giờ (14:30)</SelectItem>
                            <SelectItem value="12h">12 giờ (02:30 PM)</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
            </CardContent>
        </Card>
    );
}
