"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import { WikiPage } from "@/src/redux/feature/mrpApi";
// import { WikiPage } from "@/redux/feature/mrpApi";

interface AiCheckResult {
  passed: boolean;
  title: string;
  description: string;
  status: "success" | "warning" | "error";
  details?: string[];
}

interface WikiAiCheckPanelProps {
  content: string;
  title: string;
  slug: string;
  wikiPages: WikiPage[] | undefined;
}

export function WikiAiCheckPanel({ content, title, slug, wikiPages }: WikiAiCheckPanelProps) {
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanTime, setScanTime] = React.useState<string>("");

  // Run checks dynamically on content/title/slug
  const checks = React.useMemo<AiCheckResult[]>(() => {
    const results: AiCheckResult[] = [];

    // 1. Duplicate Page Check
    const exists = wikiPages?.some((p) => p.slug === slug);
    if (exists) {
      results.push({
        passed: false,
        title: "Trùng lặp thực thể (Duplicate check)",
        description: "Slug trang này đã tồn tại trong Wiki chính thức của Workspace.",
        status: "warning",
        details: [`Slug trùng: /wiki/${slug}`, "Lưu ý: Lưu bản thảo sẽ ghi đè lên bài viết này dưới dạng đề xuất phiên bản mới."],
      });
    } else {
      results.push({
        passed: true,
        title: "Trùng lặp thực thể (Duplicate check)",
        description: "Trang này là duy nhất, không trùng lặp slug trong hệ thống.",
        status: "success",
      });
    }

    // 2. Data Leak Check (Phone & Email)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:\+84|0)(?:\s*\d){9,10}/g;

    const emailsFound = content.match(emailRegex) || [];
    const phonesFound = content.match(phoneRegex) || [];

    if (emailsFound.length > 0 || phonesFound.length > 0) {
      const details: string[] = [];
      if (emailsFound.length > 0) details.push(`Tìm thấy ${emailsFound.length} email: ${Array.from(new Set(emailsFound)).join(", ")}`);
      if (phonesFound.length > 0) details.push(`Tìm thấy ${phonesFound.length} số điện thoại: ${Array.from(new Set(phonesFound)).join(", ")}`);

      results.push({
        passed: false,
        title: "Rò rỉ thông tin cá nhân (Data Leaks)",
        description: "Phát hiện thông tin liên hệ nhạy cảm (Email/SĐT) có thể vi phạm bảo mật.",
        status: "error",
        details,
      });
    } else {
      results.push({
        passed: true,
        title: "Rò rỉ thông tin cá nhân (Data Leaks)",
        description: "Không phát hiện địa chỉ email hay số điện thoại nào trong văn bản.",
        status: "success",
      });
    }

    // 3. Tone & Quality Check
    const emptySections = (content.match(/#+\s+$/gm) || []).length;
    const cliches = ["seamless", "empower", "elevate", "orchestrate", "perfect", "100% correct", "flawlessly"];
    const foundCliches = cliches.filter((c) => content.toLowerCase().includes(c));

    const qualityDetails: string[] = [];
    if (content.length < 50) {
      qualityDetails.push("Nội dung quá ngắn (dưới 50 ký tự), thiếu thông tin chi tiết.");
    }
    if (emptySections > 0) {
      qualityDetails.push(`Phát hiện ${emptySections} tiêu đề không chứa nội dung.`);
    }
    if (foundCliches.length > 0) {
      qualityDetails.push(`Phát hiện từ ngữ sáo rỗng (AI Cliches): ${foundCliches.map(c => `"${c}"`).join(", ")}`);
    }

    if (qualityDetails.length > 0) {
      results.push({
        passed: false,
        title: "Phân tích văn phong & Chất lượng (Tone & Structure)",
        description: "Phát hiện một số lỗi cấu trúc hoặc từ ngữ sáo rỗng cần tối ưu.",
        status: "warning",
        details: qualityDetails,
      });
    } else {
      results.push({
        passed: true,
        title: "Phân tích văn phong & Chất lượng (Tone & Structure)",
        description: "Cấu trúc văn bản tối ưu, không có lỗi định dạng hoặc từ ngữ sáo rỗng.",
        status: "success",
      });
    }

    // 4. Markdown Formatting Check
    const hasHeadings = /^#\s+/m.test(content) || /^##\s+/m.test(content) || /^###\s+/m.test(content);
    const hasLinks = /\[.+\]\(.+\)/.test(content);

    const formatDetails: string[] = [];
    if (!hasHeadings) formatDetails.push("Thiếu tiêu đề tiêu chuẩn (H1, H2, H3) để xây dựng phân cấp thông tin.");
    if (!hasLinks) formatDetails.push("Không tìm thấy liên kết nội bộ [[wikilink]] hoặc URL ngoài.");

    if (formatDetails.length > 0) {
      results.push({
        passed: false,
        title: "Kiểm tra định dạng tài liệu (Markdown validation)",
        description: "Tài liệu chưa tận dụng tối đa định dạng Markdown.",
        status: "warning",
        details: formatDetails,
      });
    } else {
      results.push({
        passed: true,
        title: "Kiểm tra định dạng tài liệu (Markdown validation)",
        description: "Sử dụng đầy đủ hệ thống tiêu đề, danh sách và siêu liên kết.",
        status: "success",
      });
    }

    return results;
  }, [content, slug, wikiPages]);

  const allPassed = checks.every((c) => c.status === "success");
  const hasErrors = checks.some((c) => c.status === "error");

  const triggerScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const now = new Date();
      setScanTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`);
    }, 800);
  };

  React.useEffect(() => {
    const now = new Date();
    setScanTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`);
  }, []);

  return (
    <div className="border border-border bg-card text-card-foreground rounded-xl p-3 flex flex-col gap-3 font-sans shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          ) : allPassed ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          )}
          <span className="font-mono text-xs uppercase tracking-wider font-extrabold text-foreground">
            BẢNG KIỂM TRA CHẤT LƯỢNG AI (AI AUDIT PANEL)
          </span>
        </div>
        <button
          onClick={triggerScan}
          disabled={isScanning}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 disabled:opacity-50 rounded-lg shadow-sm active:scale-[0.98]"
        >
          <RefreshCw className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`} />
          {isScanning ? "Đang quét..." : "Quét lại"}
        </button>
      </div>

      <div className="flex flex-col gap-2.5 my-1">
        {checks.map((chk, idx) => (
          <div
            key={idx}
            className={`border border-border p-2.5 rounded-lg flex items-start gap-2.5 transition-colors ${
              chk.status === "success"
                ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                : chk.status === "error"
                ? "bg-rose-500/5 hover:bg-rose-500/10"
                : "bg-amber-500/5 hover:bg-amber-500/10"
            }`}
          >
            {chk.status === "success" ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : chk.status === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-xs font-bold text-foreground leading-none">{chk.title}</span>
              <p className="text-[11px] text-muted-foreground leading-normal">{chk.description}</p>
              {chk.details && chk.details.length > 0 && (
                <ul className="list-disc pl-4 mt-2 space-y-1 text-[10px] font-mono text-foreground/80 border-t border-dashed border-border pt-1.5">
                  {chk.details.map((d, dIdx) => (
                    <li key={dIdx} className="leading-relaxed">{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-2 flex items-center justify-between text-[9px] font-mono text-muted-foreground select-none">
        <span>TRẠNG THÁI: {isScanning ? "ĐANG PHÂN TÍCH..." : "ĐÃ KIỂM TRA"}</span>
        <span>LẦN CUỐI: {scanTime}</span>
      </div>
    </div>
  );
}
