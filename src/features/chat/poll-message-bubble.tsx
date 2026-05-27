"use client";

import { useState, useEffect } from "react";
import { useGetPollQuery, useVotePollMutation, useGetChatByIdQuery } from "@/src/redux/feature/chatApi";
import { useGetWorkspaceMembersQuery } from "@/src/redux/feature/workspaceApi";
import { useSelector } from "react-redux";
import { RootState } from "@/src/redux/store";
import { cn } from "@/lib/utils";
import { Loader2, Check, Clock, Users, Award, Star } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PollMessageBubbleProps {
  pollId: string;
  isMe: boolean;
}

export default function PollMessageBubble({ pollId, isMe }: PollMessageBubbleProps) {
  const { data: response, isLoading, error, refetch } = useGetPollQuery(pollId);
  const [votePoll, { isLoading: isVoting }] = useVotePollMutation();

  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const { data: membersData } = useGetWorkspaceMembersQuery(
    { workspaceId: currentWorkspaceId || "" },
    { skip: !currentWorkspaceId }
  );

  const poll = response?.poll;

  // Retrieve chat participants to resolve user profiles in private/group chats
  const { data: chatData } = useGetChatByIdQuery(poll?.chatId || "", {
    skip: !poll?.chatId,
  });
  const chatParticipants = chatData?.chat?.participants || [];

  // States for real-time expiration and voter lookup
  const [isExpiredLocal, setIsExpiredLocal] = useState(false);
  const [votersModalOpen, setVotersModalOpen] = useState(false);
  const [selectedOptionForVoters, setSelectedOptionForVoters] = useState<any>(null);

  // Real-time expiration timer
  useEffect(() => {
    if (!poll?.endsAt) return;

    const checkExpiry = () => {
      const remaining = new Date(poll.endsAt).getTime() - Date.now();
      if (remaining <= 0) {
        setIsExpiredLocal(true);
      } else {
        setIsExpiredLocal(false);
        const timer = setTimeout(() => {
          setIsExpiredLocal(true);
          refetch(); // Fetch absolute final results from database
          toast.info(`Khảo sát "${poll.title}" đã kết thúc!`);
        }, remaining);
        return () => clearTimeout(timer);
      }
    };

    checkExpiry();
  }, [poll?.endsAt, poll?.title, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 min-w-[280px]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !response?.success || !poll) {
    return (
      <div className="p-4 text-center text-xs opacity-60 min-w-[280px]">
        Không thể tải thông tin cuộc khảo sát
      </div>
    );
  }

  const isExpired = poll.isExpired || isExpiredLocal;
  const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + (opt._count?.votes || 0), 0);
  const hasVoted = poll.votedOptionId !== null;
  const showResults = hasVoted || isExpired;

  // Find the winning vote count if expired
  const maxVotes = Math.max(...poll.options.map((opt: any) => opt._count?.votes || 0));

  const handleVote = async (optionId: string) => {
    if (isExpired) {
      toast.warning("Cuộc khảo sát này đã kết thúc!");
      return;
    }
    
    // Nếu chọn đúng phương án đã vote thì bỏ qua không gửi trùng
    if (poll.votedOptionId === optionId) return;

    try {
      await votePoll({ pollId, optionId }).unwrap();
      toast.success("Bình chọn thành công!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Lỗi khi thực hiện bình chọn!");
    }
  };

  return (
    <div className="py-1 min-w-[250px] flex flex-col gap-3 transition-all z-10">
      {/* Header Info */}
      <div className="flex flex-col gap-1">
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
          isMe ? "text-blue-200" : "text-blue-500"
        )}>
          📊 Cuộc khảo sát ý kiến
        </span>
        <h4 className={cn(
          "text-sm font-extrabold leading-snug break-words",
          isMe ? "text-white" : "text-slate-800 dark:text-white"
        )}>
          {poll.title}
        </h4>
      </div>

      {/* Options List */}
      <div className="flex flex-col gap-2.5">
        {poll.options.map((option: any) => {
          const voteCount = option._count?.votes || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = poll.votedOptionId === option.id;
          const isWinner = isExpired && maxVotes > 0 && voteCount === maxVotes;

          // Resolve voter names and avatars using chat participants and workspace members cache
          const votersList = option.votes || [];
          const resolvedVoters = votersList.map((voterId: string) => {
            const participant = chatParticipants.find((p: any) => p.accountId === voterId);
            if (participant) {
              return {
                id: voterId,
                name: participant?.account?.name || participant?.name || "Người dùng",
                avatar: participant?.account?.avatar || participant?.avatar || "",
              };
            }
            const member = membersData?.items?.find((m: any) => m.userId === voterId);
            return {
              id: voterId,
              name: member?.user?.name || "Người dùng",
              avatar: member?.user?.avatar || "",
            };
          });

          const maxVisibleVoters = 3;
          const visibleVoters = resolvedVoters.slice(0, maxVisibleVoters);
          const extraVotersCount = resolvedVoters.length - maxVisibleVoters;

          let tooltipText = "";
          if (resolvedVoters.length > 0) {
            const names = resolvedVoters.map((v: any) => v.name);
            if (names.length <= 3) {
              tooltipText = names.join(", ");
            } else {
              tooltipText = `${names.slice(0, 3).join(", ")} và ${names.length - 3} người khác`;
            }
          }

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={isVoting || isExpired}
              className={cn(
                "relative w-full text-left p-3 rounded-[4px] overflow-hidden border flex flex-col gap-1.5 select-none",
                "motion-safe:transition-all motion-safe:duration-200 active:scale-[0.98] group disabled:active:scale-100 disabled:cursor-not-allowed",
                isMe
                  ? isWinner
                    ? "bg-white/30 border-white/40 text-white shadow-sm ring-1 ring-white/20 font-semibold"
                    : isSelected
                      ? "bg-white/20 border-white/30 text-white shadow-sm ring-1 ring-white/10"
                      : isExpired
                        ? "bg-white/5 border-white/5 text-blue-200/60 opacity-70"
                        : "bg-white/5 border-white/10 text-blue-50 hover:bg-white/10"
                  : isWinner
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs ring-1 ring-emerald-500/20"
                    : isSelected
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold"
                      : isExpired
                        ? "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400 opacity-70"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-xs"
              )}
            >
              {/* Progress Background bar */}
              <div 
                className={cn(
                  "absolute left-0 top-0 bottom-0 z-0",
                  "motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out",
                  isMe 
                    ? isWinner 
                      ? "bg-white/25" 
                      : isSelected 
                        ? "bg-white/15" 
                        : "bg-white/5" 
                    : isWinner
                      ? "bg-emerald-500/15"
                      : isSelected 
                        ? "bg-blue-500/10" 
                        : "bg-slate-100 dark:bg-slate-800/40"
                )}
                style={{ width: `${percentage}%` }}
              />

              {/* Option Text and Checkmark */}
              <div className="relative z-10 flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isWinner && (
                    <Award size={12} className={cn("flex-shrink-0", isMe ? "text-yellow-300" : "text-emerald-600 dark:text-emerald-400")} />
                  )}
                  <span className="text-xs break-words font-medium">{option.text}</span>
                </div>
                {isSelected && (
                  <span className={cn(
                    "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                    isMe ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                  )}>
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </div>

              {/* Progress bar and percentages */}
              {showResults && (
                <div className="relative z-10 flex items-center justify-between w-full text-[10px] opacity-75 font-semibold mt-0.5">
                  <span className={isMe ? "text-blue-100" : "text-slate-500"}>
                    {voteCount} phiếu
                  </span>
                  <span>{percentage}%</span>
                </div>
              )}

              {/* Avatar Stack for voters */}
              {showResults && resolvedVoters.length > 0 && (
                <div 
                  className="relative z-10 flex items-center gap-1.5 mt-1 border-t border-dotted border-current/10 pt-1.5 w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center select-none">
                          <div className="flex -space-x-1.5 overflow-hidden mr-1.5">
                            {visibleVoters.map((voter: any, idx: number) => (
                              <div
                                key={voter.id}
                                className={cn(
                                  "inline-block rounded-full ring-2",
                                  isMe ? "ring-blue-600" : "ring-white dark:ring-slate-900"
                                )}
                                style={{ zIndex: 10 - idx }}
                              >
                                <Avatar className="w-4 h-4 border-0">
                                  <AvatarImage src={voter.avatar || undefined} alt={voter.name} />
                                  <AvatarFallback className="text-[7px] bg-slate-300 font-bold uppercase flex items-center justify-center w-full h-full text-slate-700">
                                    {voter.name.slice(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            ))}
                            {extraVotersCount > 0 && (
                              <div
                                className={cn(
                                  "inline-flex items-center justify-center w-4 h-4 rounded-full ring-2 text-[7px] font-bold z-0",
                                  isMe
                                    ? "bg-white/30 text-white ring-blue-600"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-white dark:ring-slate-900"
                                )}
                              >
                                +{extraVotersCount}
                              </div>
                            )}
                          </div>
                          
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOptionForVoters(option);
                              setVotersModalOpen(true);
                            }}
                            className={cn(
                              "text-[9px] font-medium leading-none hover:underline cursor-pointer",
                              isMe ? "text-blue-100/90" : "text-blue-600 dark:text-blue-400"
                            )}
                          >
                            {resolvedVoters.length} bình chọn
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px] px-2 py-1 rounded-[4px] z-50">
                        <p>{tooltipText}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className={cn(
        "flex items-center justify-between text-[10px] mt-1 border-t pt-2.5",
        isMe ? "border-white/15 text-blue-200/70" : "border-slate-100 dark:border-slate-800 text-slate-400"
      )}>
        <div className="flex items-center gap-1 font-semibold">
          <Users size={11} />
          <span>{totalVotes} người tham gia</span>
        </div>

        {poll.endsAt && (
          <div className="flex items-center gap-1 font-semibold">
            <Clock size={11} />
            {isExpired ? (
              <span className={cn(
                "px-1.5 py-0.5 rounded font-bold text-[9px] uppercase",
                isMe ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              )}>
                Đã kết thúc
              </span>
            ) : (
              <span>
                Còn {formatDistanceToNow(new Date(poll.endsAt), { locale: vi })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Voters List Modal */}
      <Dialog open={votersModalOpen} onOpenChange={setVotersModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[6px] border-slate-200 dark:border-slate-800">
          <DialogHeader className="border-b pb-3 border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 leading-none">
              <Users size={16} className="text-blue-500" />
              Thành viên đã bình chọn
            </DialogTitle>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-normal italic">
              Phương án: &ldquo;{selectedOptionForVoters?.text}&rdquo;
            </p>
          </DialogHeader>

          <div className="max-h-60 overflow-y-auto space-y-2.5 py-2 pr-1 custom-scrollbar">
            {!selectedOptionForVoters || selectedOptionForVoters.votes?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Chưa có lượt bình chọn nào cho phương án này.</p>
            ) : (
              selectedOptionForVoters.votes.map((voterId: string) => {
                const participant = chatParticipants.find((p: any) => p.accountId === voterId);
                let name = "Người dùng";
                let avatar = "";
                let roleLabel = "Thành viên";

                if (participant) {
                  name = participant?.account?.name || participant?.name || "Người dùng";
                  avatar = participant?.account?.avatar || participant?.avatar || "";
                  if (participant.role) {
                    roleLabel = participant.role === "CHANNEL_OWNER"
                      ? "Chủ phòng"
                      : participant.role === "CHANNEL_MODERATOR"
                      ? "Kiểm duyệt viên"
                      : "Thành viên";
                  }
                } else {
                  const member = membersData?.items?.find((m: any) => m.userId === voterId);
                  if (member) {
                    name = member?.user?.name || "Người dùng";
                    avatar = member?.user?.avatar || "";
                    roleLabel = member?.role === "WORKSPACE_OWNER"
                      ? "Chủ sở hữu"
                      : member?.role === "WORKSPACE_ADMIN"
                      ? "Quản trị viên"
                      : "Thành viên";
                  }
                }

                return (
                  <div key={voterId} className="flex items-center gap-3 p-1.5 rounded-[4px] hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <Avatar className="h-7 w-7 rounded-[4px] border border-slate-200/60 shrink-0">
                      <AvatarImage className="rounded-[4px]" src={avatar || undefined} />
                      <AvatarFallback className="rounded-[4px] bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{name}</p>
                      <p className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">{roleLabel}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-end border-t pt-3 border-slate-100 dark:border-slate-800">
            <Button onClick={() => setVotersModalOpen(false)} className="h-8 text-xs font-bold px-4 rounded-[4px]">
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
