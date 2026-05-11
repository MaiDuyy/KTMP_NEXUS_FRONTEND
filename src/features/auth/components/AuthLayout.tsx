import React from 'react';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white">
      {/* Left Pane - Branding & Security */}
      <div className="relative hidden w-1/2 flex-col bg-slate-900 p-12 text-white lg:flex justify-between">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-start gap-8">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-indigo-600 p-2">
              <Image
                src="/images/auth/logo.png"
                alt="OTT Chat Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight">OTT Chat</span>
          </div>
          
          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              Secure collaboration for the modern enterprise.
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Bring your teams together with real-time messaging, AI-powered knowledge, and enterprise-grade security.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 backdrop-blur-sm self-start">
            <ShieldCheck className="h-8 w-8 text-indigo-400" />
            <div>
              <p className="text-sm font-semibold">Enterprise Security</p>
              <p className="text-xs text-slate-400">SOC2 Certified & End-to-End Encrypted</p>
            </div>
            <div className="ml-4 h-12 w-12 relative overflow-hidden rounded opacity-80">
                 <Image
                    src="/images/auth/security-badge.png"
                    alt="Security Compliance"
                    fill
                    className="object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
            </div>
          </div>
          
          <blockquote className="space-y-2">
            <p className="text-sm italic text-slate-500">
              "Trusted by 500+ global enterprises for secure, scalable communication."
            </p>
          </blockquote>
        </div>
      </div>

      {/* Right Pane - Forms */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 lg:w-1/2">
        {/* Mobile Logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-indigo-600 p-2">
              <Image
                src="/images/auth/logo.png"
                alt="OTT Chat Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">OTT Chat</span>
        </div>
        
        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
        
        <div className="mt-auto pt-8 text-center text-sm text-slate-500">
          Need help? <a href="mailto:support@ottchat.com" className="text-indigo-600 hover:underline font-medium">Contact IT Support</a>
        </div>
      </div>
    </div>
  );
};
