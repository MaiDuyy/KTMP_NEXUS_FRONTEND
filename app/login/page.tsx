"use client";

import { LoginForm } from "@/src/features/auth";
import { AuthLayout } from "@/src/features/auth/components/AuthLayout";
import Link from "next/link";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
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
