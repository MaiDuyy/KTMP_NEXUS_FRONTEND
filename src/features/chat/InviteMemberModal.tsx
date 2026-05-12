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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
                        Mời thành viên mới
                    </DialogTitle>
                    <DialogDescription>
                        Gửi lời mời tham gia workspace qua email. Người nhận sẽ nhận được một liên kết để tham gia.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Địa chỉ Email</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="example@company.com" 
                                            {...field} 
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vai trò</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="MEMBER">Member (Thành viên)</SelectItem>
                                            <SelectItem value="ADMIN">Admin (Quản trị viên)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Gửi lời mời
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
