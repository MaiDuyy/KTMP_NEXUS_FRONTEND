"use client";

import { useState, useEffect, Suspense } from "react"; // 1. Thêm import Suspense
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { OTPInput } from "@/components/ui/otp-input";
import Link from "next/link";

import {
    useVerifyEmailOTPMutation,
    useSendVerificationOTPMutation,
    useResendOTPMutation,
} from "@/src/redux/feature/otpApi";

const otpSchema = z.object({
    code: z.string().length(6, "Mã OTP phải có 6 chữ số"),
});

// 2. Tách toàn bộ logic cũ vào component con (Content)
function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [otpValue, setOtpValue] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [isVerified, setIsVerified] = useState(false);

    const [verifyOTP, { isLoading: isVerifying }] = useVerifyEmailOTPMutation();
    const [sendOTP, { isLoading: isSending }] = useSendVerificationOTPMutation();
    const [resendOTP, { isLoading: isResending }] = useResendOTPMutation();

    const form = useForm<z.infer<typeof otpSchema>>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            code: "",
        },
    });

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Auto send OTP when page loads
    useEffect(() => {
        if (email && countdown === 0) {
            handleSendOTP();
        }
    }, []);

    const handleSendOTP = async () => {
        if (!email) {
            toast.error("Không tìm thấy email!");
            router.push("/register");
            return;
        }

        try {
            const result = await sendOTP({ email }).unwrap();
            toast.success(result.message);
            setCountdown(result.expiresIn ? Math.min(60, result.expiresIn) : 60);
        } catch (error: any) {
            const msg = error?.data?.message || "Không thể gửi OTP!";
            if (error?.data?.retryAfter) {
                setCountdown(error.data.retryAfter);
            }
            toast.error(msg);
        }
    };

    const handleResendOTP = async () => {
        if (!email || countdown > 0) return;

        try {
            const result = await resendOTP({ email, type: "VERIFY_EMAIL" }).unwrap();
            toast.success(result.message);
            setCountdown(60);
            setOtpValue("");
        } catch (error: any) {
            const msg = error?.data?.message || "Không thể gửi lại OTP!";
            if (error?.data?.retryAfter) {
                setCountdown(error.data.retryAfter);
            }
            toast.error(msg);
        }
    };

    const onSubmit = async () => {
        if (otpValue.length !== 6) {
            toast.error("Vui lòng nhập đầy đủ mã OTP!");
            return;
        }

        try {
            await verifyOTP({ email, code: otpValue }).unwrap();
            setIsVerified(true);
            toast.success("Xác thực email thành công!");

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (error: any) {
            const msg = error?.data?.message || "Mã OTP không hợp lệ!";
            toast.error(msg);
            setOtpValue("");
        }
    };

    // Auto submit when 6 digits entered
    useEffect(() => {
        if (otpValue.length === 6) {
            onSubmit();
        }
    }, [otpValue]);

    if (isVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                            Xác thực thành công!
                        </CardTitle>
                        <CardDescription>
                            Email của bạn đã được xác thực. Đang chuyển hướng đến trang đăng nhập...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Xác thực Email</CardTitle>
                    <CardDescription>
                        Chúng tôi đã gửi mã OTP 6 chữ số đến
                        <br />
                        <span className="font-semibold text-foreground">{email}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <OTPInput
                        value={otpValue}
                        onChange={setOtpValue}
                        disabled={isVerifying}
                    />

                    <Button
                        onClick={onSubmit}
                        disabled={otpValue.length !== 6 || isVerifying}
                        className="w-full"
                        size="lg"
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang xác thực...
                            </>
                        ) : (
                            "Xác thực"
                        )}
                    </Button>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                            Không nhận được mã?
                        </p>
                        <Button
                            variant="ghost"
                            onClick={handleResendOTP}
                            disabled={countdown > 0 || isResending || isSending}
                            className="text-primary"
                        >
                            {isResending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {countdown > 0
                                ? `Gửi lại sau ${countdown}s`
                                : "Gửi lại mã OTP"
                            }
                        </Button>
                    </div>

                    <div className="text-center pt-4 border-t">
                        <Link
                            href="/register"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Quay lại đăng ký
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// 3. Component chính Export ra ngoài (Chứa Suspense Boundary)
export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}