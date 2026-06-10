"use client"

import React, { useEffect } from 'react'
import {
  useGetOrgSettingsQuery,
  useUpdateOrgSettingsMutation,
} from '@/src/redux/feature/adminApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useForm } from 'react-hook-form'
import { 
    Settings, 
    Globe, 
    ShieldCheck, 
    Lock, 
    Save,
    Building2,
    Mail
} from 'lucide-react'

export function LegacyOrgSettings() {
  const { data: settingsData, isLoading } = useGetOrgSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateOrgSettingsMutation();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  useEffect(() => {
    if (settingsData?.settings) {
      reset(settingsData.settings);
    }
  }, [settingsData, reset]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    try {
      await updateSettings(data).unwrap();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Đang tải cấu hình...</div>;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Cài đặt hệ thống</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Quản lý cấu hình tổ chức và bảo mật</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* General Settings */}
        <Card className="border border-border/60 bg-card rounded-md shadow-sm">
          <CardHeader className="p-3 pb-2 border-b border-border/40">
            <CardTitle className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                Thông tin chung
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">Tên tổ chức</Label>
                <Input id="name" className="h-8 text-xs rounded-md" {...register('name')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="domain" className="text-xs font-semibold text-muted-foreground">Domain chính</Label>
                <div className="relative">
                  <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" />
                  <Input id="domain" className="pl-8 h-8 text-xs rounded-md" {...register('domain')} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border border-border/60 bg-card rounded-md shadow-sm">
          <CardHeader className="p-3 pb-2 border-b border-border/40">
            <CardTitle className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                Bảo mật & Truy cập
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Cho phép đăng ký tự do</Label>
                <p className="text-[10px] text-muted-foreground">Người dùng có thể tự tạo tài khoản mà không cần lời mời</p>
              </div>
              <Switch 
                checked={watch('allowSignup')} 
                onCheckedChange={(val) => setValue('allowSignup', val)} 
              />
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Yêu cầu xác thực Email</Label>
                <p className="text-[10px] text-muted-foreground">Người dùng mới phải xác thực email trước khi đăng nhập</p>
              </div>
              <Switch 
                checked={watch('requireEmailVerification')} 
                onCheckedChange={(val) => setValue('requireEmailVerification', val)} 
              />
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Xác thực 2 lớp (MFA)</Label>
                <p className="text-[10px] text-muted-foreground">Bắt buộc tất cả quản trị viên sử dụng MFA</p>
              </div>
              <Switch 
                checked={watch('mfaRequired')} 
                onCheckedChange={(val) => setValue('mfaRequired', val)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Policy */}
        <Card className="border border-border/60 bg-card rounded-md shadow-sm">
          <CardHeader className="p-3 pb-2 border-b border-border/40">
            <CardTitle className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                Chính sách mật khẩu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">Độ dài tối thiểu</Label>
                    <Input type="number" className="h-8 text-xs rounded-md" {...register('passwordPolicy.minLength')} />
                </div>
                <div className="flex flex-col gap-2 justify-center mt-2.5">
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={watch('passwordPolicy.requireUppercase')} 
                            onCheckedChange={(val) => setValue('passwordPolicy.requireUppercase', val)} 
                        />
                        <Label className="text-xs font-medium text-foreground">Yêu cầu chữ hoa</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={watch('passwordPolicy.requireNumbers')} 
                            onCheckedChange={(val) => setValue('passwordPolicy.requireNumbers', val)} 
                        />
                        <Label className="text-xs font-medium text-foreground">Yêu cầu chữ số</Label>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2.5">
            <Button variant="outline" type="button" size="sm" onClick={() => reset()} className="h-8 text-xs rounded-md">Hủy thay đổi</Button>
            <Button type="submit" size="sm" disabled={isUpdating} className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow rounded-md">
                {isUpdating ? "Đang lưu..." : "Lưu cài đặt"}
                <Save className="w-3.5 h-3.5 ml-1.5" />
            </Button>
        </div>
      </form>
    </div>
  )
}
