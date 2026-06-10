"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone } from 'lucide-react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

import { useRegisterMutation } from '@/src/redux/feature/authApi';
import { sleep } from '@/lib/utils';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' }).max(255),
  email: z.string().email({ message: 'Email không hợp lệ' }),
  number: z.string().regex(/^[0-9]{10,11}$/, { message: 'Số điện thoại phải có 10-11 chữ số' }),
  password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }).max(100),
  confirmPassword: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'Bạn phải đồng ý với Điều khoản Dịch vụ',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu và xác nhận mật khẩu không khớp',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      number: '',
      password: '',
      confirmPassword: '',
      gender: 'male',
      agreeToTerms: false,
    },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    setIsSpinning(true);

    const registerPromise = async () => {
      try {
        await sleep(1000); // UI delay simulation

        const { confirmPassword, ...requestData } = data;
        await register(requestData).unwrap();

        return { message: "Đăng ký tài khoản thành công!", email: data.email };
      } catch (error: any) {
        const msg = error?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
        if (msg.toLowerCase().includes("email")) {
          form.setError("email", { message: "Email này đã được sử dụng." });
        } else if (msg.toLowerCase().includes("phone") || msg.toLowerCase().includes("số điện thoại")) {
          form.setError("number", { message: "Số điện thoại này đã được sử dụng." });
        } else {
          setError(msg);
        }
        throw error;
      }
    };

    toast.promise(registerPromise(), {
      loading: "Đang khởi tạo tài khoản...",
      success: (result) => {
        setIsSpinning(false);
        router.push(`/auth/verify-email?email=${encodeURIComponent(result.email)}`);
        return result.message;
      },
      error: () => {
        setIsSpinning(false);
        return "Thông tin đăng ký không hợp lệ";
      },
    });
  };

  const passwordValue = form.watch('password');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col space-y-1.5 text-left">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Đăng ký tài khoản
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-500">
          Bắt đầu kết nối với cộng đồng NEXUS ngay hôm nay.
        </p>
      </div>

      {error && (
        <div className="p-2.5 rounded-[2px] bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-650 dark:text-red-400 text-xs font-semibold font-mono text-left animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-350">Họ và tên</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450 dark:text-zinc-600" />
                    <Input placeholder="Ví dụ: Nguyễn Văn A" className="pl-9 h-9 border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#111113]/40 focus:border-blue-500 dark:focus:border-blue-600 focus:ring-0 rounded-[2px] text-sm text-slate-850 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-colors" {...field} />
                  </div>
                </FormControl>
                <FormMessage className="text-[11px] font-mono text-red-500" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-350">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450 dark:text-zinc-600" />
                      <Input placeholder="admin@vi-du.com" className="pl-9 h-9 border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#111113]/40 focus:border-blue-500 dark:focus:border-blue-600 focus:ring-0 rounded-[2px] text-sm text-slate-850 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-colors" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px] font-mono text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-350">Số điện thoại</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450 dark:text-zinc-600" />
                      <Input placeholder="0912345678" className="pl-9 h-9 border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#111113]/40 focus:border-blue-500 dark:focus:border-blue-600 focus:ring-0 rounded-[2px] text-sm text-slate-850 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-colors" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px] font-mono text-red-500" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-350">Giới tính</FormLabel>
                <FormControl>
                  <select
                    className="flex h-9 w-full rounded-[2px] border border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#111113]/40 text-slate-850 dark:text-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-0 focus:border-blue-500 dark:focus:border-blue-600 transition-colors appearance-none cursor-pointer"
                    {...field}
                  >
                    <option value="male" className="bg-white dark:bg-[#19191B]">Nam</option>
                    <option value="female" className="bg-white dark:bg-[#19191B]">Nữ</option>
                    <option value="other" className="bg-white dark:bg-[#19191B]">Khác</option>
                  </select>
                </FormControl>
                <FormMessage className="text-[11px] font-mono text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-350">Mật khẩu</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450 dark:text-zinc-600" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-9 pr-9 h-9 border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#111113]/40 focus:border-blue-500 dark:focus:border-blue-600 focus:ring-0 rounded-[2px] text-sm text-slate-850 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-colors"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 dark:text-zinc-550 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </FormControl>
                <PasswordStrengthMeter password={passwordValue} />
                <FormMessage className="text-[11px] font-mono text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-350">Xác nhận mật khẩu</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450 dark:text-zinc-600" />
                    <Input type="password" placeholder="••••••••" className="pl-9 h-9 border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#111113]/40 focus:border-blue-500 dark:focus:border-blue-600 focus:ring-0 rounded-[2px] text-sm text-slate-850 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-colors" {...field} />
                  </div>
                </FormControl>
                <FormMessage className="text-[11px] font-mono text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2.5 space-y-0 py-0.5">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-3.5 w-3.5 rounded-[2px] border-slate-300 dark:border-white/[0.12] data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-600 dark:data-[state=checked]:border-blue-700"
                  />
                </FormControl>
                <div className="leading-none text-left">
                  <FormLabel className="text-xs font-medium text-slate-500 dark:text-zinc-500 cursor-pointer">
                    Tôi đồng ý với các <a href="/terms" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Điều khoản Dịch vụ</a> và <a href="/privacy" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Chính sách Bảo mật</a>
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSpinning} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white h-9 text-xs font-mono font-bold uppercase tracking-wider rounded-[2px] transition-colors duration-155 mt-2 shadow-none">
            {isSpinning ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Đang khởi tạo tài khoản...
              </>
            ) : (
              'Đăng ký tài khoản'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
