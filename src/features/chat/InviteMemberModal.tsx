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
            <DialogContent className="sm:max-w-[400px] rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#19191B] p-6 shadow-2xl [&>button]:rounded-[2px]">
                <DialogHeader className="border-b border-slate-100 dark:border-white/[0.04] pb-4">
                    <DialogTitle className="text-sm font-semibold uppercase font-mono tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-500" />
                        Mời thành viên mới
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-2">
                        Gửi lời mời tham gia workspace qua email.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-1 text-left">
                                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block font-mono">Địa chỉ Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="example@company.com"
                                            {...field}
                                            disabled={isLoading}
                                            className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-white/[0.06] rounded-[2px] text-xs h-9 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 font-mono transition-colors text-slate-850 dark:text-slate-150"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-mono text-red-500" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem className="space-y-1 text-left">
                                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block font-mono">Vai trò</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-white/[0.06] rounded-[2px] text-xs h-9 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 font-mono transition-colors text-slate-850 dark:text-slate-150">
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-[2px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B]">
                                            <SelectItem value="MEMBER" className="text-xs font-mono rounded-[2px]">Member (Thành viên)</SelectItem>
                                            <SelectItem value="ADMIN" className="text-xs font-mono rounded-[2px]">Admin (Quản trị viên)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-[10px] font-mono text-red-500" />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/[0.04]">
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={onClose} 
                                disabled={isLoading} 
                                className="rounded-[2px] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.02] font-mono text-xs font-medium h-9 px-4 uppercase tracking-wider transition-colors"
                            >
                                Hủy
                            </Button>
                            <Button 
                                type="submit" 
                                size="sm" 
                                disabled={isLoading} 
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-[2px] font-mono text-xs font-medium h-9 px-4 uppercase tracking-wider transition-colors gap-1.5"
                            >
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
