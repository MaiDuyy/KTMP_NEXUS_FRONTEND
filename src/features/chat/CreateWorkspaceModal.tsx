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
import { useListDepartmentsQuery } from "@/src/redux/feature/departmentApi";
import { toast } from "sonner";
import { Loader2, Globe, Lock } from "lucide-react";
import { useDispatch } from "react-redux";
import { setWorkspace } from "@/src/redux/feature/workspaceSlice";

const formSchema = z.object({
  name: z.string().min(2, "Tên workspace phải có ít nhất 2 ký tự"),
  slug: z.string().min(2, "Slug phải có ít nhất 2 ký tự").regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  departmentId: z.string().optional(),
});

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const [createWorkspace, { isLoading }] = useCreateWorkspaceMutation();
  const { data: departments = [] } = useListDepartmentsQuery(undefined, { skip: !isOpen });
  const dispatch = useDispatch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isPublic: true,
      departmentId: "",
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
      const payload = {
        ...values,
        departmentId: values.departmentId || undefined,
      };
      const result = await createWorkspace(payload).unwrap();
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
      <DialogContent className="sm:max-w-[425px] rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#19191B] p-6 shadow-2xl [&>button]:rounded-[2px]">
        <DialogHeader className="border-b border-slate-100 dark:border-white/[0.04] pb-4">
          <DialogTitle className="text-sm font-semibold uppercase font-mono tracking-wider text-slate-800 dark:text-slate-200">
            Tạo Workspace mới
          </DialogTitle>
          <DialogDescription className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-2">
            Workspace là nơi team của bạn làm việc. Bạn có thể mời thành viên sau khi tạo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="text-left">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block font-mono">Tên Workspace</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="VD: Dự án Alpha, Team Marketing..." 
                      {...field} 
                      onChange={onNameChange}
                      className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-white/[0.06] rounded-[2px] text-xs h-9 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 font-mono transition-colors text-slate-850 dark:text-slate-150"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-mono text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem className="text-left">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block font-mono">Slug (Đường dẫn)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 dark:text-zinc-500 text-xs font-mono">workspace/</span>
                      <Input 
                        placeholder="my-awesome-team" 
                        {...field} 
                        className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-white/[0.06] rounded-[2px] text-xs h-9 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 font-mono transition-colors text-slate-850 dark:text-slate-150"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] font-mono text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem className="text-left">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block font-mono">Phòng ban trực thuộc</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-9 w-full rounded-[2px] border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#1e1e21] px-3 py-1 text-xs focus-visible:outline-none focus:border-blue-500 font-mono text-slate-800 dark:text-slate-200"
                    >
                      <option value="" className="bg-white dark:bg-[#19191B]">-- Không trực thuộc (Dự án độc lập) --</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id} className="bg-white dark:bg-[#19191B]">
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage className="text-[10px] font-mono text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="text-left">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block font-mono">Mô tả (Không bắt buộc)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Mục đích của workspace này là gì?" 
                      className="resize-none bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-white/[0.06] rounded-[2px] text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 font-mono transition-colors text-slate-850 dark:text-slate-150 h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-mono text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-[2px] border border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-zinc-950/20 p-3 shadow-sm">
                  <div className="space-y-0.5 text-left">
                    <FormLabel className="text-xs font-bold text-slate-750 dark:text-slate-300">Chế độ công khai</FormLabel>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                      Cho phép người khác tìm thấy workspace này
                    </div>
                  </div>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`gap-2 rounded-[2px] border border-slate-200 dark:border-white/[0.06] font-mono text-xs font-medium uppercase tracking-wider transition-colors ${
                        field.value 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                          : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                      onClick={() => field.onChange(!field.value)}
                    >
                      {field.value ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {field.value ? "Công khai" : "Riêng tư"}
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-white/[0.04]">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="rounded-[2px] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.02] font-mono text-xs font-medium h-9 uppercase tracking-wider transition-colors"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-[2px] font-mono text-xs font-medium h-9 uppercase tracking-wider transition-colors"
              >
                {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Tạo Workspace
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
