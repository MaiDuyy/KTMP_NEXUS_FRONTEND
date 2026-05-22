"use client"

import React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  url?: string
  icon?: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
    isActive?: boolean
  }[]
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
  return (
    <div className="flex flex-col gap-0.5 px-1.5 py-1">
      <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">
        Quản lý hệ thống
      </div>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <div className="flex flex-col">
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <button className={cn(
                        "flex items-center gap-2.5 w-full px-2.5 py-1 text-xs font-medium rounded transition-colors",
                        "hover:bg-secondary hover:text-foreground",
                        item.isActive ? "text-foreground font-semibold bg-secondary/60" : "text-muted-foreground"
                    )}>
                      {item.icon && <item.icon className="w-3.5 h-3.5 shrink-0" />}
                      <span className="flex-1 text-left truncate">{item.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground/75" />
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="overflow-hidden">
                    <div className="flex flex-col gap-0.5 ml-3.5 mt-0.5 border-l border-border/40 pl-2.5 py-0.5">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.url}
                          className={cn(
                            "block px-2.5 py-1 text-xs rounded transition-colors",
                            subItem.isActive 
                              ? "font-semibold text-primary bg-primary/5 dark:bg-primary/10 border-l border-primary -ml-[11px] pl-[10px]" 
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                          )}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  </CollapsibleContent>
                </>
              ) : (
                <Link
                  href={item.url || "#"}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1 text-xs font-medium rounded transition-colors",
                    item.isActive 
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {item.icon && <item.icon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="flex-1 truncate">{item.title}</span>
                </Link>
              )}
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  )
}
