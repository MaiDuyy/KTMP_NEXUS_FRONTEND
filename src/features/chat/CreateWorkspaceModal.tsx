"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateWorkspaceMutation } from "@/src/redux/feature/workspaceApi";
import { toast } from "sonner";
import { Loader2, Globe, Lock } from "lucide-react";
import { useDispatch } from "react-redux";
import { setWorkspace } from "@/src/redux/feature/workspaceSlice";

const formSchema = z.object({
  name: z.string().min(2, "Tên workspace phải có ít nhất 2 ký tự"),
  slug: z.string().min(2, "Slug phải có ít nhất 2 ký tự").regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
});

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const [createWorkspace, { isLoading }] = useCreateWorkspaceMutation();
  const dispatch = useDispatch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isPublic: true,
    },
  });

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    // Auto-generate slug
    const slug = name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    form.setValue("slug", slug, { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = await createWorkspace(values).unwrap();
      toast.success(`Đã tạo workspace "${result.name}" thành công!`);
      dispatch(setWorkspace(result.id)); // Tự động chuyển sang workspace mới
      onClose();
      form.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Không thể tạo workspace");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo Workspace mới</DialogTitle>
          <DialogDescription>
            Workspace là nơi team của bạn làm việc. Bạn có thể mời thành viên sau khi tạo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên Workspace</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="VD: Dự án Alpha, Team Marketing..." 
                      {...field} 
                      onChange={onNameChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (Đường dẫn)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">workspace/</span>
                      <Input placeholder="my-awesome-team" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả (Không bắt buộc)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Mục đích của workspace này là gì?" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Chế độ công khai</FormLabel>
                    <div className="text-[12px] text-muted-foreground">
                      Cho phép người khác tìm thấy workspace này
                    </div>
                  </div>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`gap-2 ${field.value ? 'bg-green-50 text-green-700' : 'bg-slate-50'}`}
                      onClick={() => field.onChange(!field.value)}
                    >
                      {field.value ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {field.value ? "Công khai" : "Riêng tư"}
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tạo Workspace
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
