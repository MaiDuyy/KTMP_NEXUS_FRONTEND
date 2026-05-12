"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound, ArrowLeft, RefreshCw, Mail, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OTPInput } from "@/components/ui/otp-input";
import Link from "next/link";

import {
    useSendForgotPasswordOTPMutation,
    useResetPasswordWithOTPMutation,
    useResendOTPMutation,
} from "@/src/redux/feature/otpApi";

const emailSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
});

const resetSchema = z.object({
    newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
});

type Step = "email" | "otp" | "password" | "success";

export function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otpValue, setOtpValue] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [sendForgotOTP, { isLoading: isSending }] = useSendForgotPasswordOTPMutation();
    const [resetPassword, { isLoading: isResetting }] = useResetPasswordWithOTPMutation();
    const [resendOTP, { isLoading: isResending }] = useResendOTPMutation();

    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
    });

    const resetForm = useForm<z.infer<typeof resetSchema>>({
        resolver: zodResolver(resetSchema),
        defaultValues: { newPassword: "", confirmPassword: "" },
    });

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendEmail = async (data: z.infer<typeof emailSchema>) => {
        try {
            const result = await sendForgotOTP({ email: data.email }).unwrap();
            setEmail(data.email);
            setStep("otp");
            setCountdown(60);
            toast.success(result.message);
        } catch (error: any) {
            const msg = error?.data?.message || "Không thể gửi OTP!";
            if (error?.data?.retryAfter) {
                setCountdown(error.data.retryAfter);
            }
            toast.error(msg);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0) return;

        try {
            const result = await resendOTP({ email, type: "RESET_PASSWORD" }).unwrap();
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

    const handleVerifyOTP = () => {
        if (otpValue.length !== 6) {
            toast.error("Vui lòng nhập đầy đủ mã OTP!");
            return;
        }
        setStep("password");
    };

    const handleResetPassword = async (data: z.infer<typeof resetSchema>) => {
        try {
            await resetPassword({
                email,
                code: otpValue,
                newPassword: data.newPassword,
            }).unwrap();

            setStep("success");
            toast.success("Đặt lại mật khẩu thành công!");

            setTimeout(() => {
                router.push("/auth/sign-in");
            }, 3000);
        } catch (error: any) {
            const msg = error?.data?.message || "Đặt lại mật khẩu thất bại!";
            toast.error(msg);

            // If OTP error, go back to OTP step
            if (msg.toLowerCase().includes("otp")) {
                setStep("otp");
                setOtpValue("");
            }
        }
    };

    // Success Screen
    if (step === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                            Đặt lại mật khẩu thành công!
                        </CardTitle>
                        <CardDescription>
                            Bạn có thể đăng nhập với mật khẩu mới. Đang chuyển hướng...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        {step === "email" && <Mail className="h-8 w-8 text-primary" />}
                        {step === "otp" && <KeyRound className="h-8 w-8 text-primary" />}
                        {step === "password" && <KeyRound className="h-8 w-8 text-primary" />}
                    </div>
                    <CardTitle className="text-2xl">
                        {step === "email" && "Quên mật khẩu"}
                        {step === "otp" && "Nhập mã OTP"}
                        {step === "password" && "Đặt mật khẩu mới"}
                    </CardTitle>
                    <CardDescription>
                        {step === "email" && "Nhập email của bạn để nhận mã xác thực"}
                        {step === "otp" && (
                            <>
                                Mã OTP đã được gửi đến
                                <br />
                                <span className="font-semibold text-foreground">{email}</span>
                            </>
                        )}
                        {step === "password" && "Nhập mật khẩu mới cho tài khoản của bạn"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Step 1: Email */}
                    {step === "email" && (
                        <Form {...emailForm}>
                            <form onSubmit={emailForm.handleSubmit(handleSendEmail)} className="space-y-4">
                                <FormField
                                    control={emailForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="name@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isSending}>
                                    {isSending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang gửi...
                                        </>
                                    ) : (
                                        "Gửi mã xác thực"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    )}

                    {/* Step 2: OTP */}
                    {step === "otp" && (
                        <>
                            <OTPInput
                                value={otpValue}
                                onChange={setOtpValue}
                                disabled={false}
                            />

                            <Button
                                onClick={handleVerifyOTP}
                                disabled={otpValue.length !== 6}
                                className="w-full"
                                size="lg"
                            >
                                Tiếp tục
                            </Button>

                            <div className="text-center">
                                <Button
                                    variant="ghost"
                                    onClick={handleResendOTP}
                                    disabled={countdown > 0 || isResending}
                                    className="text-primary"
                                >
                                    {isResending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã OTP"}
                                </Button>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => setStep("email")}
                                className="w-full"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Thay đổi email
                            </Button>
                        </>
                    )}

                    {/* Step 3: New Password */}
                    {step === "password" && (
                        <Form {...resetForm}>
                            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
                                <FormField
                                    control={resetForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mật khẩu mới</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="••••••"
                                                        {...field}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={resetForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nhập lại mật khẩu</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="••••••"
                                                        {...field}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={isResetting}>
                                    {isResetting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        "Đặt lại mật khẩu"
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep("otp")}
                                    className="w-full"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Quay lại
                                </Button>
                            </form>
                        </Form>
                    )}

                    {/* Back to Sign In */}
                    <div className="text-center pt-4 border-t">
                        <Link
                            href="/auth/sign-in"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
