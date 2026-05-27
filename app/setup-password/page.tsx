"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  useValidateInviteTokenQuery,
  useAcceptInviteMutation
} from "@/src/redux/feature/workspaceApi";
import { useGetProfileQuery } from "@/src/redux/feature/userApi";
import { setCredentials } from "@/src/redux/feature/authSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  AlertCircle,
  ShieldCheck,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Check,
  Building2
} from "lucide-react";
import { toast } from "sonner";

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-slate-400 text-xs font-semibold">Đang tải...</p>
        </div>
      </div>
    }>
      <SetupPasswordContent />
    </Suspense>
  );
}

function SetupPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const token = searchParams.get("token");

  // State
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("male");
  const [showPassword, setShowPassword] = useState(false);

  // Queries & Mutations
  const {
    data: validateResponse,
    isLoading: isValidating,
    error: validationError
  } = useValidateInviteTokenQuery(token || "", {
    skip: !token,
  });

  const { data: profile, isLoading: isCheckingAuth } = useGetProfileQuery();
  const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation();

  // Password strength checks
  const passwordChecks = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    const checks = Object.values(passwordChecks);
    const passedCount = checks.filter(Boolean).length;
    return passedCount; // Score from 0 to 5
  }, [password, passwordChecks]);

  const strengthColor = useMemo(() => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 4) return "bg-amber-500";
    return "bg-emerald-500";
  }, [passwordStrength]);

  const strengthText = useMemo(() => {
    if (!password) return "";
    if (passwordStrength <= 2) return "Yếu";
    if (passwordStrength <= 4) return "Trung bình";
    return "Mạnh (Đạt yêu cầu)";
  }, [password, passwordStrength]);

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Handlers
  const handleSetupPassword = async () => {
    if (!token) return;

    if (!name.trim()) {
      toast.error("Vui lòng nhập họ và tên của bạn!");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Mật khẩu chưa đạt tiêu chuẩn bảo mật doanh nghiệp!");
      return;
    }

    try {
      const result = await acceptInvite({
        token,
        name: name.trim(),
        password,
        gender,
      }).unwrap();

      toast.success("Thiết lập tài khoản và mật khẩu thành công!");

      // Auto login if credentials are returned
      if (result.accessToken) {
        dispatch(setCredentials({
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          roles: result.roles,
        }));
      }

      router.push("/chat");
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "Thiết lập mật khẩu thất bại. Vui lòng thử lại!");
    }
  };

  // Error States
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-md shadow-2xl border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 bg-red-950/40 rounded-full flex items-center justify-center mb-4 border border-red-900/30">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <CardTitle className="text-lg font-bold text-white">Đường dẫn không hợp lệ</CardTitle>
            <CardDescription className="text-slate-450 text-xs">
              Đường dẫn thiết lập mật khẩu của bạn thiếu mã token xác thực tài khoản.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white" variant="outline" onClick={() => router.push("/")}>
              Quay lại trang chủ
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isValidating || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-slate-400 text-xs font-semibold">Đang xác thực thông tin tài khoản của bạn...</p>
        </div>
      </div>
    );
  }

  if (validationError || !validateResponse?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-md shadow-2xl border-slate-800 bg-slate-900 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 bg-amber-950/40 rounded-full flex items-center justify-center mb-4 border border-amber-900/30">
              <AlertCircle className="w-7 h-7 text-amber-500" />
            </div>
            <CardTitle className="text-lg font-bold text-white">Đường dẫn hết hạn hoặc không hợp lệ</CardTitle>
            <CardDescription className="text-slate-450 text-xs leading-relaxed">
              {(validationError as { data?: { message?: string } })?.data?.message || 
               "Liên kết kích hoạt và thiết lập mật khẩu đã hết hạn (24 giờ), đã được sử dụng hoặc bị thu hồi."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-10" onClick={() => router.push("/")}>
              Quay lại Trang chủ
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const inviteData = validateResponse.invitation;
  const showGenderRadio = !profile;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] bg-blue-600/5 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] bg-indigo-600/5 blur-[150px] rounded-full" />

      <Card className="w-full max-w-[520px] shadow-2xl border-slate-800 bg-slate-900/90 text-slate-150 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full" />

        <CardHeader className="text-center pb-1 pt-6 px-6">
          <div className="mx-auto w-18 h-18 relative mb-4">
            <div className="absolute inset-0 bg-blue-500/10 rounded-2xl rotate-6 animate-pulse" />
            <div className="absolute inset-0 bg-slate-800 rounded-2xl border border-slate-700/60 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-9 h-9 text-blue-400" />
            </div>
          </div>

          <CardTitle className="text-xl font-bold tracking-tight text-white">
            Kích hoạt tài khoản & Thiết lập mật khẩu
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-1 px-4 leading-relaxed">
            Bạn đã được Quản trị viên cấp tài khoản nội bộ. Vui lòng hoàn tất thiết lập mật khẩu để bảo vệ tài khoản của bạn.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-6 pt-2 pb-4">
          {/* Read-Only Context Banner */}
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-3">
            <Mail className="w-4.5 h-4.5 text-blue-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Email kích hoạt (Không thể sửa)</p>
              <p className="text-xs font-semibold text-slate-300 truncate">{inviteData?.email}</p>
            </div>
          </div>

          {inviteData?.department && (
            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-3 animate-in fade-in duration-200">
              <Building2 className="w-4.5 h-4.5 text-amber-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Phòng ban liên kết</p>
                <p className="text-xs font-semibold text-slate-300 truncate">{inviteData.department.name}</p>
              </div>
            </div>
          )}

          <div className="space-y-3.5">
            {/* Name Input */}
            <div className="space-y-1.5">
              <Label htmlFor="setup-name" className="text-slate-300 text-xs font-medium ml-0.5">Họ và tên của bạn</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <Input
                  id="setup-name"
                  placeholder="Nhập họ và tên..."
                  className="pl-10 h-10 rounded-lg border-slate-750 bg-slate-850 text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-550"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <Label htmlFor="setup-password" className="text-slate-300 text-xs font-medium ml-0.5">Mật khẩu mới</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <Input
                  id="setup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu an toàn..."
                  className="pl-10 pr-10 h-10 rounded-lg border-slate-750 bg-slate-850 text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-550"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className="text-slate-400">Độ mạnh mật khẩu:</span>
                  <span className={
                    passwordStrength <= 2 ? "text-red-400" :
                    passwordStrength <= 4 ? "text-amber-400" : "text-emerald-450"
                  }>
                    {strengthText}
                  </span>
                </div>
                
                {/* Visual Bar */}
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 transition-all duration-350 ${
                        i < passwordStrength ? strengthColor : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>

                {/* Password Criteria List */}
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1.5 border-t border-slate-800/60">
                  <li className="flex items-center gap-1.5 text-[10px]">
                    {passwordChecks.minLength ? (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 bg-slate-650 rounded-full shrink-0" />
                    )}
                    <span className={passwordChecks.minLength ? "text-slate-300" : "text-slate-500"}>Ít nhất 8 ký tự</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-[10px]">
                    {passwordChecks.hasUpper ? (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 bg-slate-650 rounded-full shrink-0" />
                    )}
                    <span className={passwordChecks.hasUpper ? "text-slate-300" : "text-slate-500"}>Chữ hoa (A-Z)</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-[10px]">
                    {passwordChecks.hasLower ? (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 bg-slate-650 rounded-full shrink-0" />
                    )}
                    <span className={passwordChecks.hasLower ? "text-slate-300" : "text-slate-500"}>Chữ thường (a-z)</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-[10px]">
                    {passwordChecks.hasNumber ? (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 bg-slate-650 rounded-full shrink-0" />
                    )}
                    <span className={passwordChecks.hasNumber ? "text-slate-300" : "text-slate-500"}>Chữ số (0-9)</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-[10px] col-span-2">
                    {passwordChecks.hasSpecial ? (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 bg-slate-650 rounded-full shrink-0" />
                    )}
                    <span className={passwordChecks.hasSpecial ? "text-slate-300" : "text-slate-500"}>Ký tự đặc biệt (vd: @, #, $, !, %,...)</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Gender Selector */}
            {showGenderRadio && (
              <div className="space-y-2">
                <Label className="text-slate-350 text-xs ml-0.5">Giới tính</Label>
                <RadioGroup defaultValue="male" className="flex gap-3" onValueChange={setGender}>
                  <div className="flex items-center space-x-2 bg-slate-850 border border-slate-800 px-4 py-2.5 rounded-lg flex-1 cursor-pointer hover:bg-slate-800/40">
                    <RadioGroupItem value="male" id="setup-male" />
                    <Label htmlFor="setup-male" className="cursor-pointer text-xs">Nam</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-850 border border-slate-800 px-4 py-2.5 rounded-lg flex-1 cursor-pointer hover:bg-slate-800/40">
                    <RadioGroupItem value="female" id="setup-female" />
                    <Label htmlFor="setup-female" className="cursor-pointer text-xs">Nữ</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3.5 pt-2 pb-6 px-6">
          <Button
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSetupPassword}
            disabled={isAccepting || !name.trim() || !isPasswordValid}
          >
            {isAccepting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Kích hoạt & Đăng nhập ngay"
            )}
          </Button>

          <p className="text-[10px] text-center text-slate-500 px-4 leading-relaxed">
            Thiết lập mật khẩu này tuân thủ Quy chế bảo mật dữ liệu doanh nghiệp và được xác thực đầu cuối thông qua giao thức API nội bộ.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
