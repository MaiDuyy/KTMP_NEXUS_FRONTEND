"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, Building2, LayoutGrid } from 'lucide-react';
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

const registerOrgSchema = z.object({
  name: z.string().min(2, { message: 'Tên phải có ít nhất 2 ký tự' }).max(255),
  email: z.string().email({ message: 'Email không hợp lệ' }),
  number: z.string().regex(/^[0-9]{10,11}$/, { message: 'Số điện thoại phải có 10-11 chữ số' }),
  password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }).max(100),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Vui lòng chọn giới tính' }),
  }),
  organizationName: z.string().min(2, { message: 'Tên tổ chức phải có ít nhất 2 ký tự' }).max(200),
  workspaceName: z.string().min(2, { message: 'Tên workspace phải có ít nhất 2 ký tự' }).max(100).optional(),
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
    <div className="grid gap-6">
      <div className="flex flex-col space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Create your Organization</h1>
        <p className="text-sm text-slate-500">
          Step {step} of 2: {step === 1 ? 'Personal details' : 'Organization details'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input placeholder="John Doe" className="pl-10 h-11" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Work Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input placeholder="admin@company.com" className="pl-10 h-11" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input placeholder="0901234567" className="pl-10 h-11" {...field} />
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
                    <FormLabel>Admin Password</FormLabel>
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
                    <PasswordStrengthMeter password={passwordValue} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="button" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-11"
                onClick={async () => {
                  const isValid = await form.trigger(['name', 'email', 'number', 'password']);
                  if (isValid) setStep(2);
                }}
              >
                Next: Organization Info
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input placeholder="Acme Corp" className="pl-10 h-11" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>This will be your company workspace hub.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workspaceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Workspace Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <LayoutGrid className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input placeholder="General, Engineering, etc." className="pl-10 h-11" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>Optional: Create your first workspace immediately.</FormDescription>
                    <FormMessage />
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
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal text-slate-600">
                        I agree to the <a href="/terms" className="text-indigo-600 hover:underline">Terms of Service</a>.
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 h-11"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 h-11"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Launch Organization'
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>
    </div>
  );
};
