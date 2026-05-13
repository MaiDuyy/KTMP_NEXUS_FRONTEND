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

export function NavUser() {
  const { isMobile } = useSidebar();
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
          <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors text-left">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer">
            <UserCircle className="w-4 h-4 mr-3" />
            Trang cá nhân
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
            <LogOut className="w-4 h-4 mr-3" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
