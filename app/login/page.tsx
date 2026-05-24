"use client";

import { LoginForm } from "@/src/features/auth";
import { AuthLayout } from "@/src/features/auth/components/AuthLayout";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center p-8 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
      <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-4">
        <p className="text-[15px] text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="text-primary font-bold hover:opacity-70 transition-opacity"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
