"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
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

import { useLoginMutation } from '@/src/redux/feature/authApi';
import { setCredentials, setPermissions } from '@/src/redux/feature/authSlice';
import { useAppDispatch } from '@/src/redux/hooks';

// Schema khớp backend: password min 6 (Zod backend)
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid work email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
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

      // Lưu credentials vào Redux store + localStorage
      dispatch(setCredentials({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        permissions: result.permissions || [],
        roles: result.roles || [],
      }));

      // Dispatch permissions nếu có
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

      // Case: Tài khoản chưa xác thực → redirect verify-email
      if (message.includes('chưa được xác thực')) {
        toast.error('Tài khoản chưa xác thực. Vui lòng kiểm tra email.');
        router.push(`/register?verify=${encodeURIComponent(values.email)}`);
        return;
      }

      toast.error(message);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to your workspace</h1>
        <p className="text-sm text-slate-500">
          Enter your credentials to access your secure enterprise account.
        </p>
      </div>

      <div className="grid gap-3">
        <Button variant="outline" type="button" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-6">
          <svg className="h-4 w-4" viewBox="0 0 24 24">
             <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.909 3.292-2.09 4.213-1.217.956-3.053 1.768-5.75 1.768-4.506 0-8.203-3.664-8.203-8.18 0-4.517 3.697-8.18 8.203-8.18 2.454 0 4.293.96 5.625 2.23l2.316-2.316C18.406 1.812 15.71 0 12.48 0 5.589 0 0 5.589 0 12.48s5.589 12.48 12.48 12.48c3.702 0 6.507-1.216 8.72-3.52 2.29-2.29 3.014-5.496 3.014-8.034 0-.768-.066-1.494-.188-2.17H12.48z"
              fill="currentColor"
            />
          </svg>
          Continue with Google
        </Button>
        <Button variant="outline" type="button" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-6">
           <svg className="h-4 w-4" viewBox="0 0 23 23">
            <path fill="#f3f3f3" d="M0 0h11v11H0z" />
            <path fill="#f3f3f3" d="M12 0h11v11H12z" />
            <path fill="#f3f3f3" d="M0 12h11v11H0z" />
            <path fill="#f3f3f3" d="M12 12h11v11H12z" />
            <path fill="#f25022" d="M1.5 1.5h8v8h-8z" />
            <path fill="#7db700" d="M13.5 1.5h8v8h-8z" />
            <path fill="#00a4ef" d="M1.5 13.5h8v8h-8z" />
            <path fill="#ffb900" d="M13.5 13.5h8v8h-8z" />
          </svg>
          Continue with Microsoft
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500 font-medium">Or</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input placeholder="name@company.com" className="pl-10 h-11" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <a
                    href="/forgot-password"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md py-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal text-slate-600">
                    Keep me signed in for 30 days
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 h-11">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
