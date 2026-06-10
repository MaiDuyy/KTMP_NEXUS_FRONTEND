import React from "react";
import { BarChart2, Image, Video, Paperclip, Mic, Smile, Phone, Video as VideoIcon } from "lucide-react";
import { useGetPollQuery, useGetTasksQuery } from "@/src/redux/feature/chatApi";

interface MessageSnippetProps {
  type: string;
  content?: string | null;
  file?: {
    name: string;
    size?: string;
    type?: string;
  } | null;
  className?: string;
  iconClassName?: string;
  chatId?: string;
}

const PollTitleResolver: React.FC<{ pollId: string }> = ({ pollId }) => {
  const { data } = useGetPollQuery(pollId, { skip: !pollId });
  return <span>{data?.poll?.title || "Khảo sát ý kiến"}</span>;
};

const TaskTitleResolver: React.FC<{ taskId: string; chatId: string }> = ({ taskId, chatId }) => {
  const { data } = useGetTasksQuery(chatId, { skip: !chatId || !taskId });
  const task = data?.tasks?.find((t: any) => t.id === taskId);
  return <span>{task?.title || "Kế hoạch công việc"}</span>;
};

const getFileNameFromUrl = (url?: string | null) => {
  if (!url) return "Tệp đính kèm";
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart.split("?")[0] || "Tệp đính kèm";
  } catch {
    return "Tệp đính kèm";
  }
};

export const MessageSnippet: React.FC<MessageSnippetProps> = ({
  type,
  content,
  file,
  className = "",
  iconClassName = "h-4 w-4 inline-block align-middle shrink-0 mr-1.5 text-slate-500 dark:text-slate-400",
  chatId
}) => {
  // Clear markdown mentions formatting: @[Name](userId) -> @Name
  const cleanText = (text?: string | null) => {
    if (!text) return "";
    return text.replace(/@\[([^\]]+)\]\(([a-zA-Z0-9_-]+)\)/g, "@$1");
  };

  switch (type) {
    case "text":
      return <span className={className}>{cleanText(content)}</span>;

    case "poll":
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <BarChart2 className={iconClassName} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">Khảo sát: </span>
          {content ? <PollTitleResolver pollId={content} /> : <span>Khảo sát ý kiến</span>}
        </span>
      );

    case "task":
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <BarChart2 className={iconClassName} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">Kế hoạch: </span>
          {content && chatId ? (
            <TaskTitleResolver taskId={content} chatId={chatId} />
          ) : (
            <span>Kế hoạch công việc</span>
          )}
        </span>
      );

    case "image":
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <Image className={iconClassName} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">Hình ảnh</span>
          {content && !content.startsWith("http") && !content.startsWith("/") && !content.startsWith("data:") && (
            <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
              ({cleanText(content)})
            </span>
          )}
        </span>
      );

    case "video":
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <Video className={iconClassName} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">Video</span>
          {content && !content.startsWith("http") && !content.startsWith("/") && (
            <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
              ({cleanText(content)})
            </span>
          )}
        </span>
      );

    case "file": {
      const fileName = file?.name || getFileNameFromUrl(content);
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <Paperclip className={iconClassName} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">Tệp đính kèm: </span>
          <span className="truncate max-w-[200px]" title={fileName}>
            {fileName}
          </span>
        </span>
      );
    }

    case "audio":
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <Mic className={iconClassName} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">Âm thanh</span>
        </span>
      );

    case "sticker":
    case "gif":
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <Smile className={iconClassName} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {type === "gif" ? "GIF" : "Nhãn dán"}
          </span>
        </span>
      );

    case "call_participant_joined":
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <Phone className={iconClassName} />
          <span>Đã tham gia cuộc gọi</span>
        </span>
      );

    case "call_participant_left":
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <Phone className={iconClassName} />
          <span>Đã rời cuộc gọi</span>
        </span>
      );

    case "call_started":
    case "call_ended":
    case "call_missed":
    case "call_declined":
    case "call_cancelled": {
      let isVideoCall = false;
      try {
        if (content) {
          const callMeta = JSON.parse(content);
          isVideoCall = callMeta.isVideo ?? false;
        }
      } catch {}

      const CallIcon = isVideoCall ? VideoIcon : Phone;
      let label = "Cuộc gọi";
      if (type === "call_started") {
        label = isVideoCall ? "Cuộc gọi video mới" : "Cuộc gọi thoại mới";
      } else if (type === "call_ended") {
        label = isVideoCall ? "Cuộc gọi video" : "Cuộc gọi thoại";
      } else if (type === "call_missed") {
        label = "Cuộc gọi nhỡ";
      } else if (type === "call_declined") {
        label = "Cuộc gọi bị từ chối";
      } else if (type === "call_cancelled") {
        label = "Cuộc gọi đã hủy";
      }

      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <CallIcon className={iconClassName} />
          <span>{label}</span>
        </span>
      );
    }

    case "system":
      return (
        <span className={`italic text-slate-400 dark:text-slate-500 ${className}`}>
          {cleanText(content)}
        </span>
      );

    default:
      return (
        <span className={className}>
          [{type}] {cleanText(content)}
        </span>
      );
  }
};
