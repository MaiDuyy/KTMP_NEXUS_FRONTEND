"use client";

import { useState } from "react";
import { AuthLayout, RegisterForm, RegisterOrgForm } from '@/src/features/auth';
import { Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [mode, setMode] = useState<"user" | "org">("user");

  return (
    <AuthLayout>
      <div className="flex p-1 bg-slate-100 rounded-lg mb-8">
        <button
          onClick={() => setMode("user")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
            mode === "user" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <User className="w-4 h-4" />
          Individual
        </button>
        <button
          onClick={() => setMode("org")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
            mode === "org" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Building2 className="w-4 h-4" />
          Organization
        </button>
      </div>

      {mode === "user" ? <RegisterForm /> : <RegisterOrgForm />}

      <div className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Sign in
        </a>
      </div>
    </AuthLayout>
  );
}
