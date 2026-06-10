"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useGetDraftsByStatusQuery,
  useGetDraftsByWorkspaceQuery,
  useBulkApproveDraftsMutation,
  useApproveDraftMutation,
  useRejectDraftMutation,
  WikiPageDraft,
} from "@/src/redux/feature/mrpApi";
import { WikiTypeBadge } from "../components/WikiTypeBadge";
import { useHasRole } from "@/src/lib/rbac/usePermission";
import {
  CheckCircle,
  RefreshCcw,
  Inbox,
  ExternalLink,
  ArrowLeft,
  Filter,
  ChevronDown,
  Clock,
  CheckCheck,
  XCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";

type ScopeMode = "review" | "mine";
type StatusOption = "pending" | "needs_revision" | "approved" | "rejected";

const STATUS_META: Record<
  StatusOption,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    dotClass: string;
    badgeClass: string;
  }
> = {
  pending: {
    label: "Chờ duyệt",
    icon: Clock,
    dotClass: "bg-blue-500",
    badgeClass:
      "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800",
  },
  needs_revision: {
    label: "Cần sửa",
    icon: AlertCircle,
    dotClass: "bg-amber-500",
    badgeClass:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800",
  },
  approved: {
    label: "Đã duyệt",
    icon: CheckCheck,
    dotClass: "bg-emerald-500",
    badgeClass:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800",
  },
  rejected: {
    label: "Từ chối",
    icon: XCircle,
    dotClass: "bg-rose-500",
    badgeClass:
      "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800",
  },
};

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
  });
}

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase() as StatusOption;
  const meta = STATUS_META[key] ?? STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${meta.badgeClass}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {meta.label}
    </span>
  );
}

const WORKPSACE_ID = "default-workspace";

export default function WikiQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isSuperAdmin = useHasRole("SUPER_ADMIN");
  const isAdmin = useHasRole("ADMIN");
  const isWorkspaceManager = useHasRole("WORKSPACE_MANAGER");
  const canManageWiki = isSuperAdmin || isAdmin || isWorkspaceManager;

  const [scopeMode, setScopeMode] = React.useState<ScopeMode>(
    canManageWiki ? "review" : "mine"
  );
  const [status, setStatus] = React.useState<StatusOption>("pending");
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [bulkResult, setBulkResult] = React.useState<{
    approved: number;
    skipped: number;
    errored: number;
  } | null>(null);
  const [rejectNote, setRejectNote] = React.useState("");
  const [rejectTargetId, setRejectTargetId] = React.useState<number | null>(null);

  const { data: drafts = [], isLoading, refetch } = useGetDraftsByStatusQuery({
    status,
    mine: scopeMode === "mine",
    limit: 200,
  });

  const [bulkApprove, { isLoading: isBulking }] = useBulkApproveDraftsMutation();
  const [approveDraft, { isLoading: isApproving }] = useApproveDraftMutation();
  const [rejectDraft, { isLoading: isRejecting }] = useRejectDraftMutation();

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === drafts.length) setSelected(new Set());
    else setSelected(new Set(drafts.map((d) => d.id)));
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    try {
      const result = await bulkApprove({
        draft_ids: Array.from(selected),
        allow_conflict: false,
      }).unwrap();
      setBulkResult({
        approved: result.approved,
        skipped: result.skipped,
        errored: result.errored,
      });
      setSelected(new Set());
      refetch();
    } catch {
      // silent
    }
  };

  const handleApproveOne = async (id: number) => {
    try {
      await approveDraft(id).unwrap();
      refetch();
    } catch {}
  };

  const handleRejectOne = async () => {
    if (!rejectTargetId) return;
    try {
      await rejectDraft({ draftId: rejectTargetId, note: rejectNote }).unwrap();
      setRejectTargetId(null);
      setRejectNote("");
      refetch();
    } catch {}
  };

  const allChecked = drafts.length > 0 && selected.size === drafts.length;
  const someChecked = selected.size > 0 && selected.size < drafts.length;

  // Stats derived from loaded drafts
  const pendingCount = drafts.filter((d) => d.status === "PENDING").length;
  const needsRevisionCount = drafts.filter((d) => d.status === "NEEDS_REVISION").length;

  return (
    <div className="flex flex-col gap-5 max-w-[1200px] mx-auto">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link
            href="/wiki"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Đóng góp wiki
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quản lý bản thảo đang chờ xét duyệt và theo dõi lịch sử đóng góp.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:mt-0 mt-3 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border bg-card text-foreground rounded-lg hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Làm mới
          </button>
          {canManageWiki && status === "pending" && scopeMode === "review" && (
            <button
              onClick={handleBulkApprove}
              disabled={isBulking || selected.size === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Phê duyệt{selected.size > 0 ? ` (${selected.size})` : " đã chọn"}
            </button>
          )}
          <Link
            href="/wiki/review"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border bg-card text-foreground rounded-lg hover:bg-accent transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Bảng kiểm duyệt
          </Link>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Tổng bản thảo",
            value: drafts.length,
            icon: FileText,
            color: "text-foreground",
            bg: "bg-card",
          },
          {
            label: "Chờ duyệt",
            value: pendingCount,
            icon: Clock,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/30",
          },
          {
            label: "Cần sửa",
            value: needsRevisionCount,
            icon: AlertCircle,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/30",
          },
          {
            label: "Người đóng góp",
            value: new Set(drafts.map((d) => d.authorId)).size,
            icon: Users,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-3 flex items-center gap-3 shadow-sm"
            >
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className={`text-lg font-bold tabular-nums ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters Row ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-border pb-4">
        {/* Scope tabs */}
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
          {(
            [
              {
                value: "review" as ScopeMode,
                label: "Cần kiểm duyệt",
                show: canManageWiki,
              },
              { value: "mine" as ScopeMode, label: "Của tôi", show: true },
            ] as const
          )
            .filter((o) => o.show)
            .map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setScopeMode(opt.value);
                  setSelected(new Set());
                  setBulkResult(null);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  scopeMode === opt.value
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.value === "review" && pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold mr-1.5">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
                {opt.label}
              </button>
            ))}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {(Object.entries(STATUS_META) as [StatusOption, typeof STATUS_META[StatusOption]][]).map(
            ([key, meta]) => {
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setStatus(key);
                    setSelected(new Set());
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    status === key
                      ? meta.badgeClass + " ring-2 ring-offset-1 ring-primary/30"
                      : "border border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                  {meta.label}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Bulk result notification */}
      {bulkResult && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-300">
            Hoàn tất:{" "}
            <strong>{bulkResult.approved}</strong> đã duyệt
            {bulkResult.skipped > 0 && `, ${bulkResult.skipped} bỏ qua`}
            {bulkResult.errored > 0 && (
              <span className="text-rose-600 dark:text-rose-400">, {bulkResult.errored} lỗi</span>
            )}
          </span>
          <button
            onClick={() => setBulkResult(null)}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Drafts Table ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 gap-2">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Đang tải...</span>
        </div>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Inbox className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-foreground">Hàng đợi trống</p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Không có bản thảo nào ở trạng thái{" "}
            <strong>{STATUS_META[status]?.label}</strong> trong phạm vi này.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {canManageWiki && status === "pending" && scopeMode === "review" && (
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      onChange={toggleAll}
                      className="cursor-pointer accent-primary"
                    />
                  </th>
                )}
                <th className="p-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Trang
                </th>
                <th className="p-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                  Loại
                </th>
                <th className="p-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">
                  Tác giả
                </th>
                <th className="p-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Trạng thái
                </th>
                <th className="p-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                  Vòng
                </th>
                <th className="p-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">
                  Ghi chú
                </th>
                <th className="p-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                  Thời gian
                </th>
                {canManageWiki && status === "pending" && scopeMode === "review" && (
                  <th className="p-3 text-right text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Thao tác
                  </th>
                )}
                <th className="p-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drafts.map((d) => {
                const checked = selected.has(d.id);
                return (
                  <tr
                    key={d.id}
                    className={`group transition-colors ${
                      checked ? "bg-primary/5" : "hover:bg-muted/30"
                    }`}
                  >
                    {canManageWiki && status === "pending" && scopeMode === "review" && (
                      <td className="p-3 align-middle">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(d.id)}
                          className="cursor-pointer accent-primary"
                        />
                      </td>
                    )}
                    <td className="p-3 align-middle max-w-[200px]">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/wiki/${d.slug}`}
                          className="font-semibold text-foreground hover:text-primary hover:underline truncate text-[13px]"
                        >
                          {d.title || d.slug}
                        </Link>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">
                          /{d.slug}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 align-middle hidden md:table-cell">
                      <WikiTypeBadge type={d.pageType || "concept"} />
                    </td>
                    <td className="p-3 align-middle hidden lg:table-cell">
                      <span className="text-[12px] text-foreground">
                        {d.authorId || "Ẩn danh"}
                      </span>
                    </td>
                    <td className="p-3 align-middle">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="p-3 align-middle hidden sm:table-cell">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        v{(d.revisionRound ?? 0) + 1}
                      </span>
                    </td>
                    <td className="p-3 align-middle hidden xl:table-cell max-w-[160px]">
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {d.note || d.reviewerNote || (
                          <em className="opacity-50">Không có ghi chú</em>
                        )}
                      </p>
                    </td>
                    <td className="p-3 align-middle hidden sm:table-cell">
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {relativeTime(d.createdAt)}
                      </span>
                    </td>
                    {canManageWiki && status === "pending" && scopeMode === "review" && (
                      <td className="p-3 align-middle">
                        <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleApproveOne(d.id)}
                            disabled={isApproving}
                            className="px-2 py-1 text-[10px] font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors cursor-pointer disabled:opacity-50"
                            title="Phê duyệt"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRejectTargetId(d.id)}
                            className="px-2 py-1 text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md transition-colors cursor-pointer"
                            title="Từ chối"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                    <td className="p-3 align-middle">
                      <Link
                        href={`/wiki/review?draftId=${d.id}`}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                        title="Mở bảng kiểm duyệt chi tiết"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table footer */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {selected.size > 0 ? (
                <>{selected.size} / {drafts.length} đang được chọn</>
              ) : (
                <>{drafts.length} bản thảo</>
              )}
            </span>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reject note dialog */}
      {rejectTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-sm font-bold text-foreground mb-1">
              Từ chối bản thảo
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Hãy để lại ghi chú cho tác giả biết lý do từ chối.
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Lý do từ chối hoặc hướng dẫn sửa..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => {
                  setRejectTargetId(null);
                  setRejectNote("");
                }}
                className="px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectOne}
                disabled={isRejecting}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRejecting ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
