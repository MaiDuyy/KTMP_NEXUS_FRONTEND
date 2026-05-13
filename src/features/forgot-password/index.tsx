"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  ChevronLeft,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OTPInput } from "@/components/ui/otp-input";
import { AuthLayout } from "../auth";
import { PasswordStrengthMeter } from "../auth/components/PasswordStrengthMeter";

import {
 
  useResendOTPMutation,
  useResetPasswordWithOTPMutation,
  useSendForgotPasswordOTPMutation,
  useVerifyEmailOTPMutation,
} from "@/src/redux/feature/otpApi";

export function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const [forgotPassword, { isLoading: isRequesting }] = useSendForgotPasswordOTPMutation();
  const [verifyOTP, { isLoading: isVerifying }] = useVerifyEmailOTPMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordWithOTPMutation();
  const [resendOTP, { isLoading: isResending }] = useResendOTPMutation();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await forgotPassword({ email }).unwrap();
      toast.success(result.message || "Mã xác thực đã được gửi đến email của bạn.");
      setStep(2);
      setCountdown(60);
    } catch (error: any) {
      toast.error(error?.data?.message || "Không thể gửi mã xác thực. Vui lòng thử lại.");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP 6 chữ số.");
      return;
    }
    try {
      await verifyOTP({ email, code: otp }).unwrap();
      toast.success("Xác thực thành công. Vui lòng thiết lập mật khẩu mới.");
      setStep(3);
    } catch (error: any) {
      toast.error(error?.data?.message || "Mã xác thực không chính xác.");
      setOtp("");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    try {
      const result = await resetPassword({ email, code: otp, newPassword }).unwrap();
      toast.success(result.message || "Mật khẩu của bạn đã được thay đổi thành công.");
      setStep(4);
    } catch (error: any) {
      toast.error(error?.data?.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    try {
      const result = await resendOTP({ email, type: "FORGOT_PASSWORD" }).unwrap();
      toast.success(result.message || "Mã xác thực mới đã được gửi.");
      setCountdown(60);
      setOtp("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Không thể gửi lại mã.");
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
                Quên mật khẩu?
              </h1>
              <p className="text-base text-muted-foreground">
                Đừng lo lắng, chúng tôi sẽ gửi cho bạn mã xác thực để đặt lại mật khẩu.
              </p>
            </div>

            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email công việc</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="ten@congty.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11 h-12 border-border focus:border-primary focus:ring-0 rounded-lg transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isRequesting}
                className="w-full bg-primary hover:opacity-90 text-primary-foreground h-12 font-semibold rounded-lg shadow-sm transition-all"
              >
                {isRequesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Gửi mã xác thực <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
                Kiểm tra email
              </h1>
              <p className="text-base text-muted-foreground">
                Chúng tôi đã gửi mã xác thực 6 chữ số đến <span className="text-foreground font-semibold">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="flex justify-center py-2">
                <OTPInput value={otp} onChange={setOtp} disabled={isVerifying} />
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={otp.length !== 6 || isVerifying}
                  className="w-full bg-primary hover:opacity-90 text-primary-foreground h-12 font-semibold rounded-lg shadow-sm transition-all"
                >
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Xác thực mã OTP"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isResending}
                  className="w-full text-sm font-semibold text-primary hover:bg-transparent hover:opacity-70"
                >
                  {isResending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : "Gửi lại mã xác thực"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
                Đặt lại mật khẩu
              </h1>
              <p className="text-base text-muted-foreground">
                Vui lòng chọn mật khẩu mới chắc chắn để bảo vệ tài khoản của bạn.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pl-11 h-12 border-border focus:border-primary focus:ring-0 rounded-lg transition-colors"
                  />
                </div>
                <PasswordStrengthMeter password={newPassword} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-11 h-12 border-border focus:border-primary focus:ring-0 rounded-lg transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isResetting || !newPassword || newPassword !== confirmPassword}
                className="w-full bg-primary hover:opacity-90 text-primary-foreground h-12 font-semibold rounded-lg shadow-sm transition-all mt-4"
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Đổi mật khẩu"
                )}
              </Button>
            </form>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Thành công!</h2>
              <p className="text-muted-foreground">
                Mật khẩu của bạn đã được đặt lại. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
            </div>

            <Button
              asChild
              className="w-full bg-primary hover:opacity-90 text-primary-foreground h-12 font-semibold rounded-lg transition-all"
            >
              <Link href="/login">Quay lại đăng nhập</Link>
            </Button>
          </div>
        )}

        {step < 4 && (
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors pt-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}
