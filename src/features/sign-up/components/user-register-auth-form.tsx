import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, CalendarIcon } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // Đảm bảo bạn có component Select của shadcn/ui

// Giả sử bạn đã tạo hook này trong authApi
import { useRegisterMutation } from "@/src/redux/feature/authApi";
import { useAppDispatch } from "@/src/redux/hooks";

// 1. Schema Validation
const registerSchema = z
    .object({
        name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
        email: z.string().email({ message: "Email không hợp lệ" }),
        number: z
            .string()
            .min(10, "Số điện thoại không hợp lệ")
            .regex(/^[0-9]+$/, "Chỉ được nhập số"),
        password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
        confirmPassword: z.string(),
        gender: z.string().optional(),
        birthDate: z.string().optional(),
        location: z.string().optional(),
        // role: RoleType thường được set mặc định ở Backend hoặc chọn riêng, ở đây mình ẩn đi
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Mật khẩu nhập lại không khớp",
        path: ["confirmPassword"],
    });

export function UserRegisterForm({ className, ...props }: React.HTMLAttributes<HTMLFormElement>) {
    const [isSpinning, setIsSpinning] = useState(false);
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const dispatch = useAppDispatch();

    // Gọi hook Register từ RTK Query (Thay thế bằng hook thực tế của bạn)
    const [registerUser] = useRegisterMutation();
    // Giả lập hàm register để code không bị lỗi khi copy
    // const registerUser = async (data: any) => { return { unwrap: () => Promise.resolve(data) } };

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            number: "",
            password: "",
            confirmPassword: "",
            gender: undefined,
            birthDate: "",
            location: "",
        },
    });

    const onSubmit = (data: z.infer<typeof registerSchema>) => {
        setIsSpinning(true);

        const registerPromise = async () => {
            try {
                await sleep(2000); // Giả lập delay

                // Loại bỏ confirmPassword trước khi gửi lên API
                const { confirmPassword, ...requestData } = data;

                // Gọi API
                // @ts-ignore
                await registerUser(requestData).unwrap();

                return { message: "Đăng ký tài khoản thành công!", email: data.email };
            } catch (error: any) {
                // Xử lý lỗi từ server
                const msg = error?.data?.message || "Đăng ký thất bại.";

                // Nếu lỗi liên quan đến email trùng, gán lỗi vào field email
                if (msg.toLowerCase().includes("email")) {
                    form.setError("email", { message: msg });
                } else {
                    setError(msg);
                }

                throw error;
            }
        };

        toast.promise(registerPromise(), {
            loading: "Đang tạo tài khoản...",
            success: (result) => {
                setIsSpinning(false);
                // Chuyển hướng đến trang xác thực OTP với email
                router.push(`/auth/verify-email?email=${encodeURIComponent(result.email)}`);
                return result.message;
            },
            error: (err) => {
                setIsSpinning(false);
                return "Vui lòng kiểm tra lại thông tin";
            },
        });
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn("grid gap-4", className)}
                {...props}
            >
                {error && (
                    <p className="text-red-500">{error}</p>
                )}
                {/* Hàng 1: Tên & SĐT */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Họ và tên <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Nguyễn Văn A" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Số điện thoại <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="0901234567" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Email */}
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="name@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Hàng 2: Mật khẩu & Nhập lại */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mật khẩu <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nhập lại mật khẩu <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Hàng 3: Giới tính & Ngày sinh (Optional) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Giới tính</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn giới tính" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="male">Nam</SelectItem>
                                        <SelectItem value="female">Nữ</SelectItem>
                                        <SelectItem value="other">Khác</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ngày sinh</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Địa chỉ (Optional) */}
                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Địa chỉ</FormLabel>
                            <FormControl>
                                <Input placeholder="Hồ Chí Minh, Việt Nam" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button className="mt-4 w-full" disabled={isSpinning}>
                    {isSpinning ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    Đăng ký tài khoản
                </Button>

                <div className="text-center text-sm">
                    Đã có tài khoản?{" "}
                    <Link href="/auth/sign-in" className="underline hover:text-primary">
                        Đăng nhập ngay
                    </Link>
                </div>

            </form>
        </Form>
    );
}