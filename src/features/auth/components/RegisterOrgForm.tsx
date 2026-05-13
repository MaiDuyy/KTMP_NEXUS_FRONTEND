"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, Building2, LayoutGrid, ChevronRight, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { useRegisterOrganizationMutation } from '@/src/redux/feature/authApi';
import { cn } from "@/lib/utils";

const registerOrgSchema = z.object({
  name: z.string().min(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' }).max(255),
  email: z.string().email({ message: 'Vui lòng nhập email hợp lệ' }),
  number: z.string().regex(/^[0-9]{10,11}$/, { message: 'Số điện thoại phải có 10-11 chữ số' }),
  password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }).max(100),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Vui lòng chọn giới tính' }),
  }),
  organizationName: z.string().min(2, { message: 'Tên tổ chức phải có ít nhất 2 ký tự' }).max(200),
  workspaceName: z.string().min(2, { message: 'Tên không gian làm việc phải có ít nhất 2 ký tự' }).max(100).optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'Bạn phải đồng ý với Điều khoản Dịch vụ',
  }),
});

type RegisterOrgFormValues = z.infer<typeof registerOrgSchema>;

export const RegisterOrgForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [registerOrg, { isLoading }] = useRegisterOrganizationMutation();

  const form = useForm<RegisterOrgFormValues>({
    resolver: zodResolver(registerOrgSchema),
    defaultValues: {
      name: '',
      email: '',
      number: '',
      password: '',
      gender: 'male',
      organizationName: '',
      workspaceName: '',
      agreeToTerms: false,
    },
  });

  const onSubmit = async (values: RegisterOrgFormValues) => {
    try {
      const result = await registerOrg({
        name: values.name,
        email: values.email,
        number: values.number,
        password: values.password,
        gender: values.gender,
        organizationName: values.organizationName,
        workspaceName: values.workspaceName,
      }).unwrap();

      toast.success(result.message || 'Đăng ký tổ chức thành công!');
      router.push('/login');
    } catch (err: any) {
      const message = err?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      toast.error(message);
    }
  };

  const passwordValue = form.watch('password');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col space-y-3">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
          Tạo tổ chức của bạn
        </h1>
        <p className="text-base text-muted-foreground">
          Bước {step} trên 2: {step === 1 ? 'Thông tin quản trị viên' : 'Thông tin tổ chức'}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", step >= 1 ? "bg-primary" : "bg-border")} />
        <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", step >= 2 ? "bg-primary" : "bg-border")} />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-semibold text-foreground">Họ và tên quản trị viên</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Ví dụ: Nguyễn Văn A" className="pl-11 h-12 border-border focus:border-primary focus:ring-0 rounded-lg transition-colors" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-semibold text-foreground">Email công việc</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="admin@congty.com" className="pl-11 h-12 border-border focus:border-primary focus:ring-0 rounded-lg transition-colors" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-semibold text-foreground">Số điện thoại</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="0912345678" className="pl-11 h-12 border-border focus:border-primary focus:ring-0 rounded-lg transition-colors" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-semibold text-foreground">Mật khẩu quản trị</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-11 pr-11 h-12 border-border focus:border-primary focus:ring-0 rounded-lg transition-colors"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary focus:outline-none transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <PasswordStrengthMeter password={passwordValue} />
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <Button 
                type="button" 
                className="w-full bg-primary hover:opacity-90 text-primary-foreground h-12 font-semibold rounded-lg shadow-sm transition-all mt-4 flex items-center justify-center gap-2"
                onClick={async () => {
                  const isValid = await form.trigger(['name', 'email', 'number', 'password']);
                  if (isValid) setStep(2);
                }}
              >
                Tiếp theo: Thông tin tổ chức
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-semibold text-foreground">Tên tổ chức / Doanh nghiệp</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Ví dụ: Tập đoàn ABC" className="pl-11 h-12 border-border focus:border-primary focus:ring-0 rounded-lg transition-colors" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">Tên này sẽ hiển thị làm định danh chính cho tổ chức của bạn.</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workspaceName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-semibold text-foreground">Tên không gian làm việc (Workspace)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <LayoutGrid className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Ví dụ: Kỹ thuật, Kinh doanh, v.v." className="pl-11 h-12 border-border focus:border-primary focus:ring-0 rounded-lg transition-colors" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">Tùy chọn: Tạo không gian làm việc đầu tiên ngay bây giờ.</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-baseline space-x-3 space-y-0 rounded-md py-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal text-muted-foreground">
                        Tôi đồng ý với các <a href="/terms" className="text-primary font-semibold hover:underline">Điều khoản Dịch vụ</a>.
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 h-12 font-semibold border-border hover:bg-accent transition-all flex items-center justify-center gap-2"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Quay lại
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-[2] bg-primary hover:opacity-90 text-primary-foreground h-12 font-semibold rounded-lg shadow-sm transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang thiết lập...
                    </>
                  ) : (
                    'Bắt đầu ngay'
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};