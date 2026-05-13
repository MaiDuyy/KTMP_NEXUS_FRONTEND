"use client";

import { useState } from "react";
import { RegisterForm, RegisterOrgForm } from "@/src/features/auth";
import { AuthLayout } from "@/src/features/auth/components/AuthLayout";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function RegisterPage() {
  const [mode, setMode] = useState<"personal" | "org">("personal");

  return (
    <AuthLayout>
      {/* Switcher */}
      <div className="flex p-1 bg-muted rounded-xl mb-10">
        <button
          onClick={() => setMode("personal")}
          className={cn(
            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300",
            mode === "personal"
              ? "bg-white text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Cá nhân
        </button>
        <button
          onClick={() => setMode("org")}
          className={cn(
            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300",
            mode === "org"
              ? "bg-white text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Doanh nghiệp
        </button>
      </div>

      {mode === "personal" ? <RegisterForm /> : <RegisterOrgForm />}

      <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-4">
        <p className="text-[15px] text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="text-primary font-bold hover:opacity-70 transition-opacity"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
