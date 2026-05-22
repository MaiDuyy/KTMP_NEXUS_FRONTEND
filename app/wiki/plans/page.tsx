"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetCompilationPlansQuery,
  useApprovePlanMutation,
  useGetPlanByIdQuery,
  SourceCompilationPlan
} from "@/src/redux/feature/mrpApi";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  Activity,
  ArrowRight,
  HelpCircle,
  Play,
  RotateCw,
  Eye,
  Check,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useHasRole } from "@/src/lib/rbac/usePermission";

import { WikiPagination } from "../components/WikiPagination";

export default function CompilationPlansPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const router = useRouter();
  const workspaceId = "default-workspace";

  // RBAC checks
  const isSuperAdmin = useHasRole("SUPER_ADMIN");
  const isAdmin = useHasRole("ADMIN");
  const isWorkspaceManager = useHasRole("WORKSPACE_MANAGER");
  const canManageWiki = isSuperAdmin || isAdmin || isWorkspaceManager;

  // Pagination State
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(5);

  // RTK Query hooks
  const { data: plansResponse, isLoading: isPlansLoading, refetch: refetchPlans } = useGetCompilationPlansQuery({ page, size }, { skip: !canManageWiki });
  const [approvePlan, { isLoading: isApproving }] = useApprovePlanMutation();
  // State
  const [selectedPlanId, setSelectedPlanId] = React.useState<number | null>(null);
  const [runAutoApproveDrafts, setRunAutoApproveDrafts] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);
  // Extract plans list and total elements
  const plans = React.useMemo(() => {
    if (!plansResponse) return [];
    if (Array.isArray(plansResponse)) return plansResponse;
    return plansResponse.content || [];
  }, [plansResponse]);

  const totalElements = React.useMemo(() => {
    if (!plansResponse) return 0;
    if (Array.isArray(plansResponse)) return plansResponse.length;
    return plansResponse.totalElements || 0;
  }, [plansResponse]);

  const totalPages = React.useMemo(() => {
    if (!plansResponse) return 0;
    if (Array.isArray(plansResponse)) return Math.ceil(plansResponse.length / size);
    return plansResponse.totalPages || 0;
  }, [plansResponse, size]);

  const { data: fetchedActivePlan } = useGetPlanByIdQuery(selectedPlanId || 0, { skip: selectedPlanId === null });
  const activePlan = fetchedActivePlan || null;



  // Reset page if totalElements changes and page is out of bounds
  React.useEffect(() => {
    if (totalElements > 0 && page * size >= totalElements) {
      setPage(0);
    }
  }, [totalElements, page, size]);

  const paginatedPlans = plans;

  interface ProposedWikiItem {
    type?: string;
    category?: string;
    title?: string;
    concept?: string;
    entity?: string;
    topic?: string;
    slug?: string;
    summary?: string;
    definition?: string;
    description?: string;
  }

  // Parse planJson robustly
  const parsedPlanItems = React.useMemo(() => {
    if (!activePlan || !activePlan.planJson) return [];
    try {
      const parsed = JSON.parse(activePlan.planJson);
      
      // Case 1: Array of objects
      if (Array.isArray(parsed)) {
        return parsed as ProposedWikiItem[];
      }
      
      // Case 2: Object with lists of concepts, entities, topics
      if (typeof parsed === "object" && parsed !== null) {
        // Flatten lists
        const items: ProposedWikiItem[] = [];
        Object.entries(parsed).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            (value as unknown[]).forEach((item) => {
              const typedItem = item as ProposedWikiItem;
              items.push({
                ...typedItem,
                category: key // store category (concepts, entities, topics etc)
              });
            });
          }
        });
        if (items.length > 0) return items;

        // Try single object conversion
        return [parsed as ProposedWikiItem];
      }
      
      return [];
    } catch (e) {
      console.error("[CompilationPlans] Failed to parse planJson:", e);
      return [];
    }
  }, [activePlan]);

  const handleApprovePlan = async () => {
    if (!activePlan) return;
    setMessage(null);
    try {
      const response = await approvePlan({
        planId: activePlan.id,
        workspaceId,
        runAutoApproveDrafts
      }).unwrap();
      
      setMessage({
        text: `Kế hoạch biên soạn #${activePlan.id} đã được duyệt & thực thi thành công! Các bản thảo nháp tương ứng đã được khởi tạo.`,
        type: "success"
      });
      
      refetchPlans();
    } catch (err) {
      const error = err as { data?: { message?: string } } | undefined;
      setMessage({
        text: error?.data?.message || "Lỗi xảy ra khi duyệt kế hoạch biên soạn.",
        type: "error"
      });
    }
  };

  // Auto select first plan on load if none selected
  React.useEffect(() => {
    if (plans && plans.length > 0 && selectedPlanId === null) {
      // Find the first PENDING_REVIEW plan, or default to first plan
      const firstPending = plans.find(p => p.status === "PENDING_REVIEW");
      setSelectedPlanId(firstPending ? firstPending.id : plans[0].id);
    }
  }, [plans, selectedPlanId]);

  // Keyboard shortcut: Press D to approve / execute
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea") return;

      if (e.key.toLowerCase() === "d" && activePlan && activePlan.status === "PENDING_REVIEW") {
        e.preventDefault();
        handleApprovePlan();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePlan, runAutoApproveDrafts]);

  if (!canManageWiki) {
    return (
      <div className="font-sans max-w-xl mx-auto p-6 border border-border bg-card text-center rounded-xl shadow-md my-16 flex flex-col items-center gap-3">
        <h2 className="text-sm font-black uppercase text-rose-600">403 - KHÔNG CÓ QUYỀN TRUY CẬP</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tài khoản của bạn không có quyền truy cập Kế hoạch Biên soạn. Giao diện này chỉ dành riêng cho Quản trị viên và Quản lý Workspace.
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

  return (
    <div className={`font-sans flex flex-col gap-4 w-full text-foreground w-full h-full mx-auto h-full overflow-y-auto ${isEmbedded ? "p-0" : "p-3 md:p-4"}`}>
      
      {/* Header */}
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-2 gap-3 select-none">
          <div className="flex items-center gap-3">
            <Link
              href="/wiki"
              className="p-1.5 border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors rounded-lg shadow-sm active:scale-[0.98]"
              title="Quay lại Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Giao diện quản trị viên (Admin Tools)
              </span>
              <h1 className="text-xl font-bold text-foreground leading-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary shrink-0" />
                Kế hoạch Biên soạn (Compilation Plans)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetchPlans()}
              className="p-2 border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors rounded-lg shadow-sm active:scale-[0.98]"
              title="Làm mới danh sách"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            
            <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-muted-foreground bg-muted p-1 border border-border rounded-lg">
              <span>Phím tắt:</span>
              <span className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground font-bold">[D] Phê duyệt nhanh</span>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`border p-3 text-xs rounded-xl shadow-md ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* Left Column: Plan list picker (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 border border-border bg-card p-3 rounded-xl shadow-md">
          <div className="border-b pb-1.5 flex items-center justify-between">
            <span className="font-mono text-xs uppercase font-extrabold text-foreground">
              DANH SÁCH KẾ HOẠCH ({plans?.length || 0})
            </span>
          </div>

          {isPlansLoading ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
              <p className="text-[11px] font-mono text-muted-foreground uppercase">Đang lấy dữ liệu kế hoạch...</p>
            </div>
          ) : !plans || plans.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl bg-muted/5">
              <Clock className="w-6 h-6 text-muted-foreground/60" />
              <p className="text-xs font-bold text-foreground">Không tìm thấy Kế hoạch nào</p>
              <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed mx-auto">
                Khi bạn khởi chạy Trình biên soạn MRP từ tài liệu thô, các kế hoạch biên soạn đề xuất sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                {paginatedPlans.map((plan) => {
                  const isPending = plan.status === "PENDING_REVIEW";
                  
                  const statusClass = isPending 
                    ? "bg-amber-500/10 border-amber-500 text-amber-800 dark:text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-400";
                    
                  return (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setMessage(null);
                      }}
                      className={`w-full text-left p-2.5 border transition-all rounded-lg flex flex-col gap-1.5 ${
                        selectedPlanId === plan.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-background hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded-md leading-none ${statusClass}`}>
                          PLAN #{plan.id}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {new Date(plan.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>

                      <h3 className="text-xs font-extrabold text-foreground leading-normal flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        Tài liệu gốc ID: {plan.sourceDocumentId}
                      </h3>

                      <div className="text-[10px] text-muted-foreground flex items-center justify-between border-t border-dashed border-border pt-1.5 mt-0.5 select-none">
                        <span className="font-mono">Status: {plan.status}</span>
                        <span className="flex items-center gap-0.5 text-primary">
                          Chi tiết <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <WikiPagination
                page={page}
                size={size}
                totalPages={totalPages}
                totalElements={totalElements}
                setPage={setPage}
                compact={true}
              />
            </>
          )}
        </div>

        {/* Right Column: Active Plan Detail Board (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {activePlan ? (
            <div className="flex flex-col gap-3">
              
              {/* Main Panel Board */}
              <div className="border border-border bg-card p-4 rounded-xl shadow-md flex flex-col gap-3">
                
                {/* Meta details header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-2 gap-2">
                  <div>
                    <span className="font-mono text-[9px] uppercase font-bold text-muted-foreground">Chi tiết kế hoạch biên soạn</span>
                    <h2 className="text-sm font-bold text-foreground mt-0.5">
                      KẾ HOẠCH SỐ #{activePlan.id} — NGUỒN TÀI LIỆU {activePlan.sourceDocumentId}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 select-none">
                    <span className="text-[10px] bg-muted px-2 py-0.5 border border-border rounded-md font-semibold text-foreground">
                      Trạng thái: {activePlan.status}
                    </span>
                  </div>
                </div>

                {/* Audit summary panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-xs">
                  <div className="border border-border bg-muted/30 p-2.5 rounded-lg flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-extrabold text-muted-foreground">Tài liệu nguồn</span>
                    <span className="font-bold text-foreground">Document ID #{activePlan.sourceDocumentId}</span>
                  </div>
                  <div className="border border-border bg-muted/30 p-2.5 rounded-lg flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-extrabold text-muted-foreground">Ngày khởi tạo</span>
                    <span className="font-bold text-foreground">{new Date(activePlan.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="border border-border bg-muted/30 p-2.5 rounded-lg flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-extrabold text-muted-foreground">Tổng số đề xuất</span>
                    <span className="font-bold text-primary">{parsedPlanItems.length} Thực thể tri thức</span>
                  </div>
                </div>

                {/* Proposed Items Tree / Grid List */}
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10.5px] uppercase font-extrabold text-foreground">
                    CÁC THỰC THỂ TRI THỨC ĐỀ XUẤT BIÊN SOẠN (PROPOSED ARTICLES)
                  </span>

                  {parsedPlanItems.length === 0 ? (
                    <div className="border border-dashed border-border p-4 rounded-xl text-center font-sans text-xs text-muted-foreground bg-muted/5">
                      Kế hoạch này không chứa dữ liệu thực thể tri thức đề xuất hợp lệ hoặc định dạng JSON trống.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                      {parsedPlanItems.map((item, idx) => {
                        const type = item.type || item.category || "concept";
                        const isConcept = type.toLowerCase().includes("concept") || type.toLowerCase().includes("khái niệm");
                        const isEntity = type.toLowerCase().includes("entity") || type.toLowerCase().includes("thực thể");
                        
                        const typeLabel = isConcept ? "Concept" : isEntity ? "Entity" : "Topic";
                        const typeClass = isConcept
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-400"
                          : isEntity
                          ? "bg-sky-500/10 border-sky-500 text-sky-800 dark:text-sky-400"
                          : "bg-amber-500/10 border-amber-500 text-amber-800 dark:text-amber-400";

                        return (
                          <div
                            key={idx}
                            className="border border-border p-2.5 bg-background hover:bg-muted/5 rounded-lg transition-colors flex flex-col gap-1.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-border pb-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded-md ${typeClass}`}>
                                  {typeLabel}
                                </span>
                                <h4 className="text-xs font-extrabold text-foreground truncate max-w-[200px] md:max-w-[320px]">
                                  {item.title || item.concept || item.entity || item.topic || "Không có tiêu đề"}
                                </h4>
                              </div>

                              <code className="text-[10px] bg-muted px-1.5 py-0.5 border border-border rounded-md text-primary">
                                /{item.slug || "no-slug"}
                              </code>
                            </div>

                            <p className="text-[11px] text-muted-foreground leading-normal">
                              {item.summary || item.definition || item.description || "Không có tóm tắt chi tiết cho thực thể này."}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Audit Action Footer Box */}
                {activePlan.status === "PENDING_REVIEW" ? (
                  <div className="border border-border bg-muted/40 p-3 rounded-lg mt-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase font-extrabold text-foreground">
                        PHÊ DUYỆT THỰC THI (PLAN APPROVAL)
                      </span>
                    </div>

                    <p className="text-[11px] text-foreground/80 leading-relaxed font-sans">
                      Khi phê duyệt, tiến trình nền song song Spring Batch và Java Virtual Threads sẽ tiến hành <strong>Refine & Commit</strong>. Nội dung sẽ được trộn nâng cao (Prompt Merge) với các bài viết hiện tại và các bản thảo (Drafts) mới sẽ tự động được sinh ra trong Review Console.
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-border pt-2.5 gap-3">
                      
                      {/* Run auto approve drafts flag */}
                      <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-bold text-foreground select-none">
                        <input
                          type="checkbox"
                          checked={runAutoApproveDrafts}
                          onChange={(e) => setRunAutoApproveDrafts(e.target.checked)}
                          className="w-4 h-4 border border-border bg-background rounded text-primary focus:ring-0 cursor-pointer"
                        />
                        <span>Tự động phê duyệt & Trộn trực tiếp (Run Auto-Approve Drafts)</span>
                      </label>

                      <button
                        onClick={handleApprovePlan}
                        disabled={isApproving}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-600/90 text-white transition-colors rounded-lg shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {isApproving ? "Đang thực thi..." : "Phê duyệt & Chạy (D)"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-emerald-500/30 bg-emerald-500/5 p-3 rounded-lg mt-1 flex items-start gap-3 select-none text-emerald-800 dark:text-emerald-400">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs uppercase font-extrabold leading-none">Kế hoạch đã được phê duyệt</span>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        Kế hoạch này đã được ban quản trị kiểm tra và thực thi hoàn tất. Các bản thảo nháp được đề xuất bởi tài liệu này đã được đồng bộ hóa và hợp nhất vào Wiki tri thức.
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="border border-dashed border-border p-6 rounded-xl text-center flex flex-col items-center justify-center min-h-[400px] bg-muted/5">
              <Sparkles className="w-10 h-10 text-primary/70 mb-3 shrink-0 animate-pulse" />
              <h2 className="text-sm font-semibold uppercase text-foreground">Không có kế hoạch nào được chọn</h2>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-normal">
                Vui lòng nhấp chọn một kế hoạch biên soạn từ danh sách bên trái để mở bảng đối soát thực thể tri thức, kiểm tra cấu trúc nội dung và phê duyệt thực thi pipeline.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
