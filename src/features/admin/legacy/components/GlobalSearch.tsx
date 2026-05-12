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
    user: 'bg-blue-100 text-blue-700',
    channel: 'bg-green-100 text-green-700',
    workspace: 'bg-purple-100 text-purple-700',
    action: 'bg-gray-100 text-gray-700',
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
                    "relative w-full md:w-64 lg:w-80 justify-start text-muted-foreground bg-slate-50 dark:bg-slate-900 border-none shadow-none hover:bg-slate-100 dark:hover:bg-slate-800",
                    className
                )}
                onClick={() => setOpen(true)}
            >
                <Search className="w-4 h-4 mr-2" />
                <span className="text-sm">Tìm kiếm nhanh...</span>
                <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-white dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 max-w-lg overflow-hidden border-none shadow-2xl">
                    <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4 h-14">
                        <Search className="w-5 h-5 mr-3 text-slate-400" />
                        <Input
                            ref={inputRef}
                            placeholder="Tìm kiếm người dùng, kênh, workspace..."
                            className="border-none focus-visible:ring-0 text-base h-full bg-transparent p-0"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : query && (
                            <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-100 rounded-full">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                    </div>

                    <div className="max-h-100 overflow-y-auto p-2">
                        {results.length > 0 ? (
                            <div className="space-y-1">
                                {results.map((result, idx) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSelect(result)}
                                        className={cn(
                                            "flex items-center w-full p-3 rounded-xl transition-colors text-left",
                                            idx === selectedIndex ? "bg-primary/5 text-primary" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-lg mr-3", RESULT_TYPE_COLORS[result.type])}>
                                            {result.avatar ? (
                                                <img src={result.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                                            ) : (
                                                <result.icon className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{result.title}</p>
                                            <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider ml-2 shrink-0">
                                            {RESULT_TYPE_LABELS[result.type]}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        ) : query && !loading ? (
                            <div className="py-12 text-center text-slate-500 italic">
                                Không tìm thấy kết quả nào cho &ldquo;{query}&rdquo;
                            </div>
                        ) : (
                            <div className="p-2 space-y-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Truy cập nhanh</p>
                                <div className="grid grid-cols-1 gap-1">
                                    {QUICK_ACTIONS.map(item => (
                                        <button
                                            key={item.tab}
                                            onClick={() => handleSelect(item)}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                                        >
                                            <item.icon className="w-4 h-4 text-slate-400" />
                                            {item.label}
                                            <ChevronRight className="w-4 h-4 ml-auto text-slate-300" />
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
