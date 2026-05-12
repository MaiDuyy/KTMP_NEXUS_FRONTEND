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

  const onSubmit = async (data: any) => {
    try {
      await updateSettings(data).unwrap();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Đang tải cấu hình...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cài đặt hệ thống</h2>
          <p className="text-sm text-slate-500">Quản lý cấu hình tổ chức và bảo mật</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Settings */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-primary" />
                Thông tin chung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Tên tổ chức</Label>
                <Input id="name" {...register('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain chính</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input id="domain" className="pl-10" {...register('domain')} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Bảo mật & Truy cập
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Cho phép đăng ký tự do</Label>
                <p className="text-sm text-slate-500">Người dùng có thể tự tạo tài khoản mà không cần lời mời</p>
              </div>
              <Switch 
                checked={watch('allowSignup')} 
                onCheckedChange={(val) => setValue('allowSignup', val)} 
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Yêu cầu xác thực Email</Label>
                <p className="text-sm text-slate-500">Người dùng mới phải xác thực email trước khi đăng nhập</p>
              </div>
              <Switch 
                checked={watch('requireEmailVerification')} 
                onCheckedChange={(val) => setValue('requireEmailVerification', val)} 
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Xác thực 2 lớp (MFA)</Label>
                <p className="text-sm text-slate-500">Bắt buộc tất cả quản trị viên sử dụng MFA</p>
              </div>
              <Switch 
                checked={watch('mfaRequired')} 
                onCheckedChange={(val) => setValue('mfaRequired', val)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Policy */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="w-5 h-5 text-amber-600" />
                Chính sách mật khẩu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Độ dài tối thiểu</Label>
                    <Input type="number" {...register('passwordPolicy.minLength')} />
                </div>
                <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={watch('passwordPolicy.requireUppercase')} 
                            onCheckedChange={(val) => setValue('passwordPolicy.requireUppercase', val)} 
                        />
                        <Label>Yêu cầu chữ hoa</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={watch('passwordPolicy.requireNumbers')} 
                            onCheckedChange={(val) => setValue('passwordPolicy.requireNumbers', val)} 
                        />
                        <Label>Yêu cầu chữ số</Label>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => reset()}>Hủy thay đổi</Button>
            <Button type="submit" disabled={isUpdating} className="bg-primary hover:bg-primary/90">
                {isUpdating ? "Đang lưu..." : "Lưu cài đặt"}
                <Save className="w-4 h-4 ml-2" />
            </Button>
        </div>
      </form>
    </div>
  )
}
