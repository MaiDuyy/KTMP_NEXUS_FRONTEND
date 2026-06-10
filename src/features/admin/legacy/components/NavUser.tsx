"use client";

import React, { useState } from "react";
import {
  MoreVertical,
  LogOut,
  UserCircle,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { useGetAccountDetailsQuery } from "@/src/redux/feature/accountApi";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/src/redux/hooks";
import { performFullLogout } from "@/src/utils/auth-utils";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/src/utils/image-utils";

export function NavUser() {
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { data: accountData } = useGetAccountDetailsQuery();
  const user = accountData?.user;
  const router = useRouter();
  const dispatch = useAppDispatch();

  if (!user) return null;

  const handleLogout = () => {
    performFullLogout(dispatch);
  };

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="flex flex-col gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(
            "flex items-center w-full p-1.5 rounded transition-colors text-left focus:outline-none",
            isCollapsed ? "justify-center hover:bg-secondary/60" : "gap-2 hover:bg-secondary/60"
          )}>
            <Avatar className="h-7 w-7 rounded">
              <AvatarImage src={getAvatarUrl(user?.avatar)} alt={user.name} />
              <AvatarFallback className="rounded bg-primary/10 text-primary font-bold text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-foreground">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-52 rounded border border-border/60 bg-popover text-popover-foreground shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)]"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={8}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-2.5 py-2 text-left text-xs border-b border-border/40">
              <Avatar className="h-7 w-7 rounded">
                <AvatarImage src={getAvatarUrl(user?.avatar)} alt={user.name} />
                <AvatarFallback className="rounded bg-primary/10 text-primary font-bold text-[10px]">
                    {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-foreground">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer text-xs py-1.5 focus:bg-secondary focus:text-foreground">
            <UserCircle className="w-3.5 h-3.5 mr-2" />
            Trang cá nhân
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs py-1.5 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
