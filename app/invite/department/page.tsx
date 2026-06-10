"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  useValidateDepartmentInviteTokenQuery,
  useAcceptDepartmentInviteMutation,
  useRejectDepartmentInviteMutation,
} from "@/src/redux/feature/departmentApi";
import { useGetProfileQuery } from "@/src/redux/feature/userApi";
import { setCredentials } from "@/src/redux/feature/authSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Mail,
  Building2,
  LogIn,
  UserX,
  Crown,
  Users,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function DepartmentInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <DepartmentInviteContent />
    </Suspense>
  );
}

const ROLE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  HEAD:    { label: "Trưởng phòng",  color: "text-amber-400",  icon: <Crown className="w-4 h-4" /> },
  MANAGER: { label: "Phó phòng",    color: "text-blue-400",   icon: <ShieldCheck className="w-4 h-4" /> },
  MEMBER:  { label: "Thành viên",   color: "text-slate-300",  icon: <Users className="w-4 h-4" /> },
  GUEST:   { label: "Khách",        color: "text-zinc-400",   icon: <UserCheck className="w-4 h-4" /> },
};

function DepartmentInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const token = searchParams.get("token");

  const {
    data: inviteResponse,
    isLoading: isValidating,
    error: validationError,
  } = useValidateDepartmentInviteTokenQuery(token || "", { skip: !token });

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
  const { data: profile, isLoading: isCheckingAuth } = useGetProfileQuery(undefined, {
    skip: !hasToken,
  });
  const [acceptInvite, { isLoading: isAccepting }] = useAcceptDepartmentInviteMutation();
  const [rejectInvite, { isLoading: isRejecting }] = useRejectDepartmentInviteMutation();

  // ── Handlers ──────────────────────────────────────────────
  const handleAccept = async () => {
    if (!token) return;
    try {
      const result = await acceptInvite({ token }).unwrap() as any;
      if (result.loginData?.accessToken) {
        dispatch(
          setCredentials({
            user: result.loginData.user,
            accessToken: result.loginData.accessToken,
            refreshToken: result.loginData.refreshToken,
            roles: result.loginData.roles,
          })
        );
      }
      toast.success("Bạn đã gia nhập phòng ban thành công!");
      router.push("/chat");
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message || "Không thể gia nhập phòng ban");
    }
  };

  const handleReject = async () => {
    if (!token) return;
    try {
      await rejectInvite(token).unwrap();
      toast.info("Bạn đã từ chối lời mời.");
      router.push("/");
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message || "Có lỗi xảy ra khi từ chối lời mời");
    }
  };

  const handleLoginRedirect = () => {
    router.push(`/login?callback=/invite/department?token=${token}`);
  };

  // ── Guards ────────────────────────────────────────────────
  if (!token) return <ErrorCard icon="link" message="Đường dẫn lời mời thiếu mã xác thực phòng ban." />;

  if (isValidating || isCheckingAuth) return <LoadingScreen text="Đang xác thực lời mời..." />;

  if (validationError || !inviteResponse?.success) {
    const msg =
      (validationError as any)?.data?.message ||
      "Lời mời tham gia phòng ban đã hết hạn, bị thu hồi hoặc đã được sử dụng.";
    return <ErrorCard icon="expired" message={msg} />;
  }

  const inviteData = inviteResponse.data as any;
  const userExists: boolean = inviteResponse.data?.userExists ?? inviteResponse.userExists ?? false;

  // ── Case 1: Email không tồn tại trong hệ thống ────────────
  // Department invites chỉ dành cho thành viên đã có tài khoản
  if (!userExists) {
    return (
      <FullscreenLayout>
        <Card className="w-full max-w-[480px] shadow-2xl border-red-900/40 bg-slate-900/90 text-slate-100 backdrop-blur-md overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-red-600 to-rose-500 w-full" />
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center mb-4">
              <UserX className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-xl font-bold text-white">Email chưa có tài khoản</CardTitle>
            <CardDescription className="text-slate-400 mt-2 text-sm leading-relaxed">
              Địa chỉ <span className="text-red-400 font-semibold">{inviteData?.invitedEmail}</span> chưa được đăng ký trong hệ thống.
              <br />
              Lời mời phòng ban chỉ áp dụng cho thành viên đã có tài khoản.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20 flex gap-3 items-start text-xs text-amber-300 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Liên hệ quản trị viên phòng ban để được cấp tài khoản trước khi nhận lời mời.</span>
            </div>
          </CardContent>
          <CardFooter className="pb-7 pt-4">
            <Button className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300" onClick={() => router.push("/")}>
              Về trang chủ
            </Button>
          </CardFooter>
        </Card>
      </FullscreenLayout>
    );
  }

  // ── Case 2: User tồn tại nhưng chưa đăng nhập ─────────────
  if (!profile) {
    return (
      <FullscreenLayout>
        <Card className="w-full max-w-[480px] shadow-2xl border-slate-800 bg-slate-900/90 text-slate-100 backdrop-blur-md overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto w-20 h-20 relative mb-5">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl rotate-6 animate-pulse" />
              <div className="absolute inset-0 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-white">Lời mời phòng ban</CardTitle>
            <CardDescription className="text-slate-400 mt-1 text-sm">
              Bạn được mời tham gia phòng ban{" "}
              <span className="text-blue-400 font-semibold">
                &quot;{inviteData?.department?.name || "Phòng ban"}&quot;
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-2">
            <InviteInfoGrid inviteData={inviteData} />
            <div className="p-4 rounded-xl bg-blue-500/8 border border-blue-500/20 flex gap-3 items-center text-sm text-blue-300">
              <LogIn className="w-5 h-5 shrink-0 text-blue-400" />
              <div>
                <p className="font-semibold text-blue-200 text-xs mb-0.5">Yêu cầu đăng nhập</p>
                <p className="text-xs text-slate-400">Vui lòng đăng nhập bằng tài khoản nhận lời mời để tiếp tục.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pb-7 pt-4">
            <Button
              className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
              onClick={handleLoginRedirect}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Đăng nhập để chấp nhận
            </Button>
            <Button
              variant="ghost"
              className="w-full h-9 text-xs text-slate-500 hover:text-slate-300"
              onClick={() => router.push("/")}
            >
              Về trang chủ
            </Button>
          </CardFooter>
        </Card>
      </FullscreenLayout>
    );
  }

  // ── Case 3: Đã đăng nhập — Accept / Decline ─────────────
  const userEmail = (profile as any)?.user?.email || (profile as any)?.email;
  const emailMismatch =
    userEmail?.toLowerCase() !== (inviteData?.invitedEmail || "").toLowerCase();

  return (
    <FullscreenLayout>
      <Card className="w-full max-w-[540px] shadow-2xl border-slate-800 bg-slate-900/90 text-slate-100 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />

        <CardHeader className="text-center pb-3 pt-8">
          <div className="mx-auto w-20 h-20 relative mb-5">
            <div className="absolute inset-0 bg-blue-500/10 rounded-2xl rotate-6 animate-pulse" />
            <div className="absolute inset-0 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center shadow-lg">
              <Building2 className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Lời mời tham gia phòng ban
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm mt-1">
            Bạn được mời gia nhập phòng ban{" "}
            <span className="text-blue-400 font-semibold">
              &quot;{inviteData?.department?.name || "Phòng ban"}&quot;
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2 pb-3">
          <InviteInfoGrid inviteData={inviteData} />

          {/* Logged-in user info */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-750">
            <Avatar className="h-9 w-9 rounded-xl">
              <AvatarImage src={(profile as any)?.user?.avatar || (profile as any)?.avatar} />
              <AvatarFallback className="rounded-xl bg-blue-700 text-white text-sm font-bold">
                {(userEmail?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tài khoản đang đăng nhập</p>
              <p className="text-xs font-semibold text-slate-200 truncate">{userEmail}</p>
            </div>
          </div>

          {/* Email mismatch warning */}
          {emailMismatch && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex gap-3 items-start">
              <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-red-300 mb-0.5">Tài khoản không khớp!</p>
                <p className="text-slate-400">
                  Lời mời dành cho{" "}
                  <span className="font-semibold text-red-400">{inviteData?.invitedEmail}</span>.
                  Vui lòng{" "}
                  <button
                    className="underline text-red-300 font-semibold cursor-pointer hover:text-red-200"
                    onClick={handleLoginRedirect}
                  >
                    đổi tài khoản
                  </button>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Ready state */}
          {!emailMismatch && (
            <div className="p-3.5 rounded-xl bg-blue-500/8 border border-blue-500/20 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-xs text-blue-200 font-medium">
                Tài khoản của bạn đã sẵn sàng. Nhấn <strong className="text-white">Chấp nhận</strong> để gia nhập phòng ban ngay.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 pb-7 pt-3">
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-lg border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
            onClick={handleReject}
            disabled={isRejecting || isAccepting}
          >
            {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Từ chối"}
          </Button>
          <Button
            className="flex-1 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all active:scale-[0.98] disabled:opacity-50"
            onClick={handleAccept}
            disabled={isAccepting || isRejecting || emailMismatch}
          >
            {isAccepting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <>
                Chấp nhận
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </FullscreenLayout>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────

function FullscreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950 p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/8 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/8 blur-[130px] rounded-full" />
      {children}
    </div>
  );
}

function InviteInfoGrid({ inviteData }: { inviteData: any }) {
  const role = (inviteData?.role || "MEMBER").toUpperCase();
  const roleMeta = ROLE_META[role] || ROLE_META.MEMBER;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center gap-3">
        <Mail className="w-4 h-4 text-blue-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Email mời</p>
          <p className="text-xs font-semibold text-slate-300 truncate">{inviteData?.invitedEmail}</p>
        </div>
      </div>
      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center gap-3">
        <span className={roleMeta.color}>{roleMeta.icon}</span>
        <div className="min-w-0">
          <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Vai trò</p>
          <p className={`text-xs font-bold ${roleMeta.color}`}>{roleMeta.label}</p>
        </div>
      </div>
      {inviteData?.department && (
        <div className="col-span-2 p-3.5 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center gap-3">
          <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Phòng ban</p>
            <p className="text-xs font-bold text-slate-200">{inviteData.department.name}</p>
            {inviteData.department.description && (
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{inviteData.department.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
        <p className="text-slate-400 font-medium text-sm">{text}</p>
      </div>
    </div>
  );
}

function ErrorCard({ icon, message }: { icon: "link" | "expired"; message: string }) {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-amber-500" />
          </div>
          <CardTitle className="text-base font-bold">
            {icon === "link" ? "Đường dẫn không hợp lệ" : "Lời mời không còn hiệu lực"}
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm mt-1">{message}</CardDescription>
        </CardHeader>
        <CardFooter className="pb-7">
          <Button className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300" onClick={() => router.push("/")}>
            Về trang chủ
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
