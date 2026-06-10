"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

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

import { useLoginMutation } from '@/src/redux/feature/authApi';
import { setCredentials, setPermissions } from '@/src/redux/feature/authSlice';
import { useAppDispatch } from '@/src/redux/hooks';

const loginSchema = z.object({
  email: z.string().email({ message: 'Vui lòng nhập email công việc hợp lệ' }),
  password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const callbackUrl = searchParams ? searchParams.get('callbackUrl') || '/chat' : '/chat';

  React.useEffect(() => {
    if (searchParams && searchParams.get('reason') === 'session_expired') {
      const timer = setTimeout(() => {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const result = await login({
        email: values.email,
        password: values.password,
      }).unwrap();

      dispatch(setCredentials({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        permissions: result.permissions || [],
        roles: result.roles || [],
      }));

      if (result.permissions?.length) {
        dispatch(setPermissions({
          permissions: result.permissions,
          roles: result.roles || [],
        }));
      }

      toast.success(result.message || 'Đăng nhập thành công!');
      router.push(callbackUrl);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; status?: number };
      const message = error?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';

      if (message.includes('chưa được xác thực') || message.includes('not verified')) {
        toast.error('Tài khoản chưa được xác thực. Vui lòng kiểm tra email.');
        router.push(`/auth/verify-email?email=${encodeURIComponent(values.email)}`);
        return;
      }

      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col space-y-1.5 text-left">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Đăng nhập
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-500">
          Nhập thông tin tài khoản để truy cập hệ thống.
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-white/[0.06]" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-white dark:bg-[#19191B] px-3 text-slate-400 dark:text-zinc-500 font-semibold tracking-widest font-mono">Email & mật khẩu</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-350">Email công việc</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450 dark:text-zinc-600" />
                    <Input
                      placeholder="ten@congty.com"
                      className="pl-9 h-9 border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#111113]/40 focus:border-blue-500 dark:focus:border-blue-600 focus:ring-0 rounded-[2px] text-sm text-slate-850 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-colors"
                      {...field}
                    />
                  </div>
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
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-350">Mật khẩu</FormLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-405 dark:text-zinc-550 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-[11px] font-mono text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2.5 space-y-0 py-0.5">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-3.5 w-3.5 rounded-[2px] border-slate-300 dark:border-white/[0.12] data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-600 dark:data-[state=checked]:border-blue-700"
                  />
                </FormControl>
                <div className="leading-none">
                  <FormLabel className="text-xs font-medium text-slate-500 dark:text-zinc-500 cursor-pointer">
                    Ghi nhớ đăng nhập trong 30 ngày
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white h-9 text-xs font-mono font-bold uppercase tracking-wider rounded-[2px] transition-colors duration-150 mt-2 shadow-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng Nhập'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
