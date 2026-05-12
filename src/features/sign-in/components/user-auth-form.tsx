import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { sleep, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Import từ Redux (RTK Query)
import { useLoginMutation } from "@/src/redux/feature/authApi";
// import { useLazyGetMyPermissionsQuery } from "@/src/redux/feature/rbacApi";
import { useAppDispatch } from "@/src/redux/hooks";
import { setCredentials, setPermissions } from "@/src/redux/feature/authSlice";
import { useLazyGetUserPermissionsQuery } from "@/src/redux/feature/rbacApi";

// 1. Schema Validation
const formSchema = z.object({
  email: z.string().email({
    message: "Email không hợp lệ",
  }),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string;
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [login] = useLoginMutation();
  const [getMyPermissions] = useLazyGetUserPermissionsQuery();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });



  const getDeviceInfo = () => {
    if (typeof window === "undefined") return {};
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }
    return {
      deviceId,
      deviceName: navigator.userAgent,
      platform: "Web",
    };
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setIsSpinning(true); // Bắt đầu quay spinner ngay lập tức

    const loginPromise = async () => {
      try {
        // Bước 1: Giả lập chờ 2 giây
        await sleep(500);

        const deviceInfo = getDeviceInfo();

        // Bước 2: Gọi API thực tế bằng RTK Query
        // unwrap() giúp chuyển đổi kết quả thành Promise (resolve data hoặc reject error)
        const userData = await login({
          email: data.email,
          password: data.password,
          ...deviceInfo,
        }).unwrap();

        // Bước 3: Lưu vào Redux Store
        dispatch(setCredentials({
          ...userData,
          permissions: userData.permissions || [],
          roles: userData.roles || [],
        }));

        // Bước 4: Permissions đã kèm theo trong login response
        if (userData.permissions?.length) {
          dispatch(setPermissions({
            permissions: userData.permissions,
            roles: userData.roles || [],
          }));
        } else {
          // Fallback: Fetch từ RBAC service nếu login response không có
          try {
            const userId = userData.user?.id;
            if (userId) {
              const permissionsData = await getMyPermissions(userId).unwrap();
              dispatch(setPermissions({
                permissions: permissionsData.permissions as string[],
                roles: permissionsData.roles?.map((r: any) => typeof r === 'string' ? r : r.name) || [],
              }));
            }
          } catch (permError) {
            console.warn("Không thể lấy permissions từ RBAC:", permError);
          }
        }

        return "Đăng nhập thành công!";
      } catch (error) {

        throw error;
      }
    };

    toast.promise(loginPromise(), {
      loading: "Đang đăng nhập...",
      success: (message) => {
        setIsSpinning(false); // Tắt spinner
        router.push("/chat");
        return message;
      },
      error: (err) => {
        setIsSpinning(false); // Tắt spinner nếu lỗi
        console.error("Login failed:", err);
        setError(err?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        return err?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-3", className)}
        {...props}
      >
        {error && (
          <p className="text-red-500">{error}</p>
        )}
        <FormField
          control={form.control}
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
              <Link
                href="/auth/forgot-password"
                className="text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75"
              >
                Quên mật khẩu?
              </Link>
            </FormItem>
          )}
        />
        <Button className="mt-2 w-full" disabled={isSpinning}>
          {isSpinning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          Đăng nhập
        </Button>

        <div className="text-center text-sm">
          Chưa có tài khoản?{" "}
          <Link href="/auth/sign-up" className="underline hover:text-primary">
            Đăng ký ngay
          </Link>
        </div>
      </form>
    </Form>
  );
}