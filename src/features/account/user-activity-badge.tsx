"use client";

import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserActivityBadgeProps {
    name: string;
    avatar?: string | null;
    isOnline?: boolean;
    lastSeenText?: string;
    status?: string | null;
    size?: "sm" | "md" | "lg";
    showStatus?: boolean;
}

const sizeClasses = {
    sm: {
        avatar: "h-8 w-8",
        badge: "h-2.5 w-2.5 right-0 bottom-0",
    },
    md: {
        avatar: "h-10 w-10",
        badge: "h-3 w-3 right-0 bottom-0",
    },
    lg: {
        avatar: "h-12 w-12",
        badge: "h-3.5 w-3.5 right-0.5 bottom-0.5",
    },
};

export function UserActivityBadge({
    name,
    avatar,
    isOnline = false,
    lastSeenText,
    status,
    size = "md",
    showStatus = true,
}: UserActivityBadgeProps) {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Avatar URL đã là Cloudinary URL đầy đủ
    const avatarSrc = avatar || undefined;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="relative inline-block">
                        <Avatar className={cn(sizeClasses[size].avatar)}>
                            <AvatarImage src={avatarSrc} alt={name} />
                            <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                                {getInitials(name)}
                            </AvatarFallback>
                        </Avatar>
                        {/* Online indicator */}
                        <span
                            className={cn(
                                "absolute rounded-full border-2 border-background",
                                sizeClasses[size].badge,
                                isOnline
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                            )}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                    <div className="space-y-1">
                        <p className="font-medium">{name}</p>
                        <p className="text-xs flex items-center gap-1">
                            <Circle
                                className={cn(
                                    "h-2 w-2",
                                    isOnline ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                                )}
                            />
                            {isOnline ? "Đang hoạt động" : lastSeenText || "Không hoạt động"}
                        </p>
                        {showStatus && status && (
                            <p className="text-xs text-muted-foreground italic">"{status}"</p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
