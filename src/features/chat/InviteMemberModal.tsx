"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// import { useSendInviteMutation } from "@/redux/feature/workspaceApi";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { useSendInviteMutation } from "@/src/redux/feature/workspaceApi";

const inviteSchema = z.object({
    email: z.string().email({ message: "Email không hợp lệ" }),
    role: z.string().min(1, { message: "Vui lòng chọn vai trò" }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
}

export function InviteMemberModal({ isOpen, onClose, workspaceId }: InviteMemberModalProps) {
    const [sendInvite, { isLoading }] = useSendInviteMutation();

    const form = useForm<InviteFormValues>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            email: "",
            role: "MEMBER",
        },
    });

    const onSubmit = async (values: InviteFormValues) => {
        try {
            await sendInvite({
                workspaceId,
                email: values.email,
                role: values.role,
            }).unwrap();

            toast.success(`Đã gửi lời mời tới ${values.email}`);
            form.reset();
            onClose();
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi gửi lời mời");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] rounded-[4px]">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        Mời thành viên mới
                    </DialogTitle>
                    <DialogDescription className="text-[11px] text-slate-500">
                        Gửi lời mời tham gia workspace qua email.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-xs font-semibold text-slate-700">Địa chỉ Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="example@company.com"
                                            {...field}
                                            disabled={isLoading}
                                            className="h-8 text-sm rounded-[4px]"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[11px]" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-xs font-semibold text-slate-700">Vai trò</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-8 text-sm rounded-[4px]">
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-[4px]">
                                            <SelectItem value="MEMBER" className="text-xs">Member (Thành viên)</SelectItem>
                                            <SelectItem value="ADMIN" className="text-xs">Admin (Quản trị viên)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-[11px]" />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading} className="h-7 text-xs rounded-[4px]">Hủy</Button>
                            <Button type="submit" size="sm" disabled={isLoading} className="h-7 text-xs rounded-[4px] gap-1.5">
                                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Gửi lời mời
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
