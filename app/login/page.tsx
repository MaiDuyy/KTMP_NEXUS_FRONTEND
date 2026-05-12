"use client";

import { AuthLayout, LoginForm } from '@/src/features/auth';

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
      <div className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <a href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Create a workspace
        </a>
      </div>
    </AuthLayout>
  );
}
