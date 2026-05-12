import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Participant } from "../types";
import { getInitials, normalizeUrl, avatarColor } from "./utils";
import { getAvatarUrl } from "@/src/utils/image-utils";
interface MemberAvatarProps {
    participant: Participant;
    size?: "sm" | "md";
}

export function MemberAvatar({ participant, size = "md" }: MemberAvatarProps) {
    const name = participant.account?.name || participant.name || "Người dùng";
    const avatar = participant.account?.avatar || participant.avatar;
    const sz = size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs";
    return (
        <Avatar className={cn(sz, "rounded-lg flex-shrink-0")}>
            <AvatarImage src={getAvatarUrl(avatar || "", name)} />
            <AvatarFallback
                className={cn("rounded-lg font-semibold", avatarColor(name))}
            >
                {getInitials(name)}
            </AvatarFallback>
        </Avatar>
    );
}