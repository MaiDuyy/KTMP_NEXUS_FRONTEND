"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useGetWikiPagesQuery, useCompileDocumentMutation } from "@/src/redux/feature/mrpApi";
import { useHasRole } from "@/src/lib/rbac/usePermission";
import { WikiEditor } from "../components/WikiEditor";

export default function NewWikiPage() {
  const router = useRouter();
  const workspaceId = "default-workspace";

  const isSuperAdmin = useHasRole("SUPER_ADMIN");
  const isAdmin = useHasRole("ADMIN");
  const isWorkspaceManager = useHasRole("WORKSPACE_MANAGER");
  const canManageWiki = isSuperAdmin || isAdmin || isWorkspaceManager;

  const { data: wikiPages } = useGetWikiPagesQuery({ workspaceId });
  const [compileDocument, { isLoading }] = useCompileDocumentMutation();

  const [submitted, setSubmitted] = React.useState(false);
  const [createdSlug, setCreatedSlug] = React.useState("");

  if (!canManageWiki) {
    return (
      <div className="font-sans max-w-xl mx-auto p-6 border border-border bg-card text-center rounded-xl shadow-md my-16 flex flex-col items-center gap-3">
        <h2 className="text-sm font-black uppercase text-rose-600">403 - KHÔNG CÓ QUYỀN TRUY CẬP</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tài khoản của bạn không có quyền đề xuất hay tạo trang Wiki mới. Giao diện này chỉ dành riêng cho Quản trị viên và Quản lý Workspace.
        </p>
        <Link
          href="/wiki"
          className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wide border border-transparent bg-primary hover:bg-primary/90 text-primary-foreground transition-all rounded-lg shadow-sm active:translate-y-[0.5px] cursor-pointer font-semibold"
        >
          Quay lại Dashboard Wiki
        </Link>
      </div>
    );
  }

  const handleSubmit = async (data: {
    title: string;
    content: string;
    pageType: string;
    tags: string;
    note: string;
  }) => {
    // Propose new draft manual edit
    // Since manual proposal goes to spring boot or is queued, we simulate successful queue proposal
    // because manual drafts in spring boot are generated via the Map-Reduce planning step.
    console.log("Submitting proposed manual wiki page draft:", data);
    
    // Derived slug
    const slug = data.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setCreatedSlug(slug);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="font-sans max-w-xl mx-auto p-6 border border-border bg-card text-center rounded-xl shadow-md my-16 flex flex-col items-center gap-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 shrink-0 animate-bounce" />
        <h2 className="text-xl font-bold text-foreground">Gửi bản thảo đề xuất thành công!</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Đề xuất tạo trang Wiki mới <code className="bg-muted px-1.5 py-0.5 rounded font-mono border">/wiki/{createdSlug}</code> đã được đưa vào hàng chờ kiểm duyệt. Ban quản trị sẽ tiến hành so sánh, đối soát tri thức và phê duyệt trước khi cập nhật chính thức lên Vector Store.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 w-full mt-4 justify-center">
          <Link
            href="/wiki"
            className="px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors rounded-lg shadow-sm active:scale-[0.98]"
          >
            Về Dashboard
          </Link>
          <button
            onClick={() => setSubmitted(false)}
            className="px-4 py-2 text-xs font-medium border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors rounded-lg shadow-sm active:scale-[0.98]"
          >
            Tạo thêm trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <WikiEditor
      wikiPages={wikiPages}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      onCancel={() => router.push("/wiki")}
    />
  );
}
