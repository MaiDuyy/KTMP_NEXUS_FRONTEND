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
    <div className="flex flex-col gap-1 px-2 py-2">
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Quản lý hệ thống
      </div>
      <div className="flex flex-col gap-1">
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
                        "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        item.isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}>
                      {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
                      <span className="flex-1 text-left truncate">{item.title}</span>
                      <ChevronRight className="w-4 h-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="overflow-hidden">
                    <div className="flex flex-col gap-1 ml-4 mt-1 border-l pl-4 py-1">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.url}
                          className={cn(
                            "block px-3 py-1.5 text-sm rounded-md transition-colors",
                            subItem.isActive 
                              ? "font-medium text-primary bg-primary/5" 
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    item.isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
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
