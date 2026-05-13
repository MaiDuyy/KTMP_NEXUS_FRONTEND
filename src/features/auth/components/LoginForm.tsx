"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

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
      router.push('/chat');
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col space-y-3">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
          Đăng nhập vào không gian làm việc
        </h1>
        <p className="text-base text-muted-foreground">
          Nhập thông tin tài khoản của bạn để truy cập vào hệ thống an toàn.
        </p>
      </div>

      {/* <div className="grid gap-4">
        <Button 
          variant="outline" 
          type="button" 
          disabled={isLoading} 
          className="w-full flex items-center justify-center gap-3 h-12 border-border hover:bg-accent text-foreground font-medium rounded-lg transition-all"
        >
          <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24">
             <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.909 3.292-2.09 4.213-1.217.956-3.053 1.768-5.75 1.768-4.506 0-8.203-3.664-8.203-8.18 0-4.517 3.697-8.18 8.203-8.18 2.454 0 4.293.96 5.625 2.23l2.316-2.316C18.406 1.812 15.71 0 12.48 0 5.589 0 0 5.589 0 12.48s5.589 12.48 12.48 12.48c3.702 0 6.507-1.216 8.72-3.52 2.29-2.29 3.014-5.496 3.014-8.034 0-.768-.066-1.494-.188-2.17H12.48z"
              fill="currentColor"
            />
          </svg>
          Tiếp tục với Google
        </Button>
      </div> */}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white lg:bg-[#fcfcfc] px-4 text-muted-foreground font-medium tracking-wider">Hoặc sử dụng email</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-semibold text-foreground">Email công việc</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="ten@congty.com" 
                      className="pl-11 h-12 border-border focus:border-primary focus:ring-0 rounded-lg transition-colors" 
                      {...field} 
                    />
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
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-semibold text-foreground">Mật khẩu</FormLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-primary hover:opacity-70 transition-opacity"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
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
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md py-1">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-4 w-4 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </FormControl>
                <div className="leading-none">
                  <FormLabel className="text-sm font-medium text-muted-foreground cursor-pointer">
                    Ghi nhớ đăng nhập trong 30 ngày
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-primary hover:opacity-90 text-primary-foreground h-12 font-semibold rounded-lg shadow-sm transition-all mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
