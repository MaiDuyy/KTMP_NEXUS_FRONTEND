"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
    Search,
    User,
    Hash,
    Building2,
    Settings,
    ChevronRight,
    Loader2,
    X,
    FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLazyListUsersQuery } from '@/src/redux/feature/adminApi'
import { useListWorkspacesQuery } from '@/src/redux/feature/channelApi'

interface SearchResult {
    id: string
    type: 'user' | 'channel' | 'workspace' | 'action'
    title: string
    subtitle: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any
    tab: string
    avatar?: string
}

const RESULT_TYPE_LABELS: Record<string, string> = {
    user: 'Người dùng',
    channel: 'Kênh',
    workspace: 'Workspace',
    action: 'Hành động',
}

const RESULT_TYPE_COLORS: Record<string, string> = {
    user: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    channel: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    workspace: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    action: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

const QUICK_ACTIONS = [
    { icon: User, label: 'Quản lý người dùng', tab: 'users' },
    { icon: Building2, label: 'Quản lý Workspace', tab: 'workspaces' },
    { icon: Hash, label: 'Quản lý Kênh', tab: 'channels' },
    { icon: Settings, label: 'Cài đặt hệ thống', tab: 'settings' },
]

export function GlobalSearch({ className }: { className?: string }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    const [triggerSearchUsers] = useLazyListUsersQuery()
    const { data: workspaces = [] } = useListWorkspacesQuery()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(true)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (!query.trim()) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setResults([])
            return
        }

        setLoading(true)
        const timer = setTimeout(async () => {
            const q = query.toLowerCase()
            const found: SearchResult[] = []

            // Search workspaces (client-side from cached data)
            workspaces.forEach(ws => {
                if (ws.name.toLowerCase().includes(q)) {
                    found.push({
                        id: ws.id,
                        type: 'workspace',
                        title: ws.name,
                        subtitle: `Workspace`,
                        icon: Building2,
                        tab: 'workspaces',
                    })
                }
            })

            // Search users via API
            try {
                const userResults = await triggerSearchUsers({ search: query, limit: 5 }).unwrap()
                const formattedUsers = (userResults.items || []).map(u => ({
                    id: u.id,
                    type: 'user' as const,
                    title: u.name,
                    subtitle: u.email,
                    icon: User,
                    tab: 'users',
                    avatar: u.avatar,
                }))
                found.push(...formattedUsers)
            } catch {}

            // Quick actions match
            QUICK_ACTIONS.forEach(a => {
                if (a.label.toLowerCase().includes(q)) {
                    found.push({
                        id: `action-${a.tab}`,
                        type: 'action',
                        title: a.label,
                        subtitle: 'Truy cập nhanh',
                        icon: a.icon,
                        tab: a.tab,
                    })
                }
            })

            setResults(found)
            setLoading(false)
            setSelectedIndex(0)
        }, 300)

        return () => clearTimeout(timer)
    }, [query, triggerSearchUsers, workspaces])

    const handleSelect = (result: SearchResult | { tab: string }) => {
        setOpen(false)
        setQuery('')
        router.push(`/admin/dashboard?tab=${result.tab}`)
    }

    return (
        <>
            <Button
                variant="outline"
                className={cn(
                    "relative w-full md:w-56 lg:w-64 h-8 justify-start text-xs text-muted-foreground bg-slate-100/60 dark:bg-zinc-900/60 border border-border/40 shadow-none hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-foreground rounded-md",
                    className
                )}
                onClick={() => setOpen(true)}
            >
                <Search className="w-3.5 h-3.5 mr-2" />
                <span>Tìm kiếm nhanh...</span>
                <kbd className="pointer-events-none absolute right-2 hidden h-4.5 select-none items-center gap-0.5 rounded border border-border/50 bg-background px-1.5 font-mono text-[9px] font-medium opacity-100 sm:flex">
                    <span className="text-[10px]">⌘</span>K
                </kbd>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 max-w-md overflow-hidden border border-border/60 bg-popover text-popover-foreground shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] rounded-lg">
                    <div className="flex items-center border-b border-border/60 px-3 h-10 bg-secondary/20">
                        <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            placeholder="Tìm kiếm người dùng, kênh, workspace..."
                            className="border-none focus-visible:ring-0 text-xs h-full bg-transparent p-0"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : query && (
                            <button onClick={() => setQuery('')} className="p-1 hover:bg-secondary rounded-full">
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto p-1.5 bg-background">
                        {results.length > 0 ? (
                            <div className="space-y-0.5">
                                {results.map((result, idx) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSelect(result)}
                                        className={cn(
                                            "flex items-center w-full p-2 rounded transition-colors text-left gap-2",
                                            idx === selectedIndex ? "bg-secondary text-foreground font-medium" : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <div className={cn("p-1.5 rounded shrink-0", RESULT_TYPE_COLORS[result.type])}>
                                            {result.avatar ? (
                                                <img src={result.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                                            ) : (
                                                <result.icon className="w-3.5 h-3.5" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs truncate text-foreground">{result.title}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{result.subtitle}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 rounded border-border/60 shrink-0 uppercase tracking-widest font-semibold bg-background">
                                            {RESULT_TYPE_LABELS[result.type]}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        ) : query && !loading ? (
                            <div className="py-8 text-center text-xs text-muted-foreground italic">
                                Không tìm thấy kết quả cho &ldquo;{query}&rdquo;
                            </div>
                        ) : (
                            <div className="p-1 space-y-3">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-0.5">Truy cập nhanh</p>
                                <div className="grid grid-cols-1 gap-0.5">
                                    {QUICK_ACTIONS.map(item => (
                                        <button
                                            key={item.tab}
                                            onClick={() => handleSelect(item)}
                                            className="flex items-center gap-2.5 p-2 rounded hover:bg-secondary/60 transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                                        >
                                            <item.icon className="w-3.5 h-3.5 text-muted-foreground/80" />
                                            <span>{item.label}</span>
                                            <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground/40" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
