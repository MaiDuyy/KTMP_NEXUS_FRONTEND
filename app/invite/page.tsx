"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  useValidateInviteTokenQuery,
  useAcceptInviteMutation,
  useJoinInviteMutation,
  useRejectInviteMutation
} from "@/src/redux/feature/workspaceApi";
import { useGetProfileQuery } from "@/src/redux/feature/userApi";
import { setCredentials } from "@/src/redux/feature/authSlice";
import { setWorkspace } from "@/src/redux/feature/workspaceSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, UserPlus, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Mail, User, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <InvitePageContent />
    </Suspense>
  );
}

function InvitePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const token = searchParams.get("token");

  // Registration form state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("male");

  const {
    data: inviteData,
    isLoading: isValidating,
    error: validationError
  } = useValidateInviteTokenQuery(token || "", {
    skip: !token,
  });

  const { data: profile, isLoading: isCheckingAuth } = useGetProfileQuery();
  const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation();
  const [joinInvite, { isLoading: isJoining }] = useJoinInviteMutation();
  const [rejectInvite, { isLoading: isRejecting }] = useRejectInviteMutation();

  const handleAction = async () => {
    if (!token) return;

    if (profile) {
      // Scenario A: Existing User
      const userEmail = (profile as any).user?.email || (profile as any).email;
      if (userEmail?.toLowerCase() !== (inviteData as any)?.invitation?.email.toLowerCase()) {
        toast.error("Email tài khoản không khớp với email nhận lời mời!");
        return;
      }

      try {
        await joinInvite({ token }).unwrap();
        toast.success("Bạn đã tham gia không gian làm việc!");

        // Redirect to workspace
        const workspaceId = (inviteData as any).invitation.workspaceId;
        if (workspaceId) dispatch(setWorkspace(workspaceId));
        router.push("/chat");
      } catch (err: any) {
        toast.error(err?.data?.message || "Không thể tham gia workspace");
      }
    } else {
      // Scenario B: New User (Registration)
      if (!name || !password) {
        toast.error("Vui lòng nhập đầy đủ tên và mật khẩu!");
        return;
      }

      try {
        const result = await acceptInvite({
          token,
          name,
          password,
          gender
        }).unwrap();

        // Auto-login
        if (result.accessToken) {
          dispatch(setCredentials({
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            roles: result.roles,
            // roleLevel is handled by slice if added, but setCredentials takes specific keys
          }));

          toast.success("Đăng ký và tham gia thành công!");

          // Redirect to workspace
          const workspaceId = (inviteData as any).invitation.workspaceId;
          if (workspaceId) dispatch(setWorkspace(workspaceId));
          router.push("/chat");
        }
      } catch (err: any) {
        toast.error(err?.data?.message || "Đăng ký không thành công");
      }
    }
  };

  const handleReject = async () => {
    if (!token) return;

    try {
      await rejectInvite({ token }).unwrap();
      toast.info("Bạn đã từ chối lời mời.");
      router.push("/");
    } catch (err: any) {
      toast.error(err?.data?.message || "Có lỗi xảy ra");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle>Link không hợp lệ</CardTitle>
            <CardDescription>
              Đường dẫn lời mời của bạn thiếu thông tin xác thực.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" variant="outline" onClick={() => router.push("/")}>
              Về trang chủ
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isValidating || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600 font-medium">Đang kiểm tra lời mời...</p>
        </div>
      </div>
    );
  }

  if (validationError || !inviteData?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle>Lời mời không còn hiệu lực</CardTitle>
            <CardDescription>
              {(validationError as any)?.data?.message || "Lời mời này đã hết hạn hoặc đã được sử dụng."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/")}>
              Quay lại
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const { invitation }: any = inviteData;
  const userProfileEmail = (profile as any)?.user?.email || (profile as any)?.email;
  const emailMismatch = profile && userProfileEmail?.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-400/20 blur-[150px] rounded-full" />

      <Card className="w-full max-w-[550px] shadow-2xl border-white/20 bg-white/95 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in duration-700">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 w-full" />

        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-24 h-24 relative mb-6">
            <div className="absolute inset-0 bg-blue-100 rounded-3xl rotate-6 animate-pulse" />
            <div className="absolute inset-0 bg-white rounded-3xl border border-blue-200 flex items-center justify-center shadow-md">
              {invitation.workspace?.icon ? (
                <Avatar className="h-20 w-20 rounded-2xl">
                  <AvatarImage src={invitation.workspace.icon} />
                  <AvatarFallback className="rounded-2xl text-3xl font-bold bg-blue-600 text-white">
                    {invitation.workspace.name[0]}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <UserPlus className="w-12 h-12 text-blue-600" />
                </div>
              )}
            </div>
          </div>

          <CardTitle className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Gia nhập NEXUS
          </CardTitle>
          <CardDescription className="text-lg mt-2 font-medium">
            Bạn được mời gia nhập <span className="text-blue-600">&quot;{invitation.workspace?.name || 'NEXUS'}&quot;</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</p>
                <p className="text-sm font-semibold text-slate-700 truncate max-w-[150px]">{invitation.email}</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vai trò</p>
                <p className="text-sm font-semibold text-slate-700">{invitation.role}</p>
              </div>
            </div>
            {invitation.department && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 col-span-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phòng ban liên kết</p>
                  <p className="text-sm font-semibold text-slate-700">{invitation.department.name}</p>
                  <p className="text-xs text-amber-700 font-medium">Vai trò: {invitation.departmentRole}</p>
                </div>
              </div>
            )}
          </div>

          {profile ? (
            emailMismatch ? (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm text-red-800 font-medium">
                    Tài khoản không khớp!
                  </p>
                  <p className="text-xs text-red-600">
                    Bạn đang đăng nhập bằng <b>{userProfileEmail}</b>. Lời mời này dành cho <b>{invitation.email}</b>.
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-red-700 font-bold hover:text-red-800"
                    onClick={() => router.push(`/login?callback=/invite?token=${token}`)}
                  >
                    Đổi tài khoản khác
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm text-green-800 font-medium text-center">
                    Bạn đã sẵn sàng để gia nhập!
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Đăng ký để tham gia</span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-slate-600 ml-1">Họ và tên</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="name"
                      placeholder="Nguyễn Văn A"
                      className="pl-10 h-11 rounded-xl border-slate-200"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" title="Mật khẩu" className="text-slate-600 ml-1">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-slate-200"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600 ml-1">Giới tính</Label>
                  <RadioGroup defaultValue="male" className="flex gap-4" onValueChange={setGender}>
                    <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex-1 cursor-pointer hover:bg-slate-100">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="cursor-pointer">Nam</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex-1 cursor-pointer hover:bg-slate-100">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="cursor-pointer">Nữ</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-4 pb-8">
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button
              variant="ghost"
              className="h-12 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
              onClick={handleReject}
              disabled={isRejecting || isAccepting || isJoining}
            >
              {isRejecting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Từ chối"}
            </Button>

            <Button
              className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 text-white font-bold transition-all active:scale-95 disabled:opacity-70"
              onClick={handleAction}
              disabled={isAccepting || isJoining || isRejecting || !!emailMismatch}
            >
              {isAccepting || isJoining ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <>
                  {profile ? "Chấp nhận" : "Gia nhập ngay"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          <p className="text-[10px] text-center text-slate-400 font-medium px-8 leading-relaxed">
            Bằng cách tham gia, bạn đồng ý với các điều khoản dịch vụ và chính sách bảo mật của chúng tôi.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
