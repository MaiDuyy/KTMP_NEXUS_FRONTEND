'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditFilters {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
}

interface AuditFiltersBarProps {
    filters: AuditFilters;
    onFiltersChange: (filters: AuditFilters) => void;
    className?: string;
}

const COMMON_ACTIONS = [
    'LOGIN',
    'LOGOUT',
    'READ_DM',
    'CREATE_USER',
    'DELETE_USER',
    'ROLE_ASSIGN',
    'ACL_CHANGE',
    'DOCUMENT_UPLOAD',
    'DOCUMENT_DELETE',
    'AI_ASK',
];

const COMMON_RESOURCES = [
    'user',
    'chat',
    'dm',
    'document',
    'collection',
    'role',
    'permission',
];

/**
 * Filter controls for audit log table
 */
export function AuditFiltersBar({
    filters,
    onFiltersChange,
    className,
}: AuditFiltersBarProps) {
    const [userSearch, setUserSearch] = useState(filters.userId || '');

    const handleUserSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFiltersChange({ ...filters, userId: userSearch || undefined });
    };

    const handleChange = (key: keyof AuditFilters, value: string | undefined) => {
        onFiltersChange({ ...filters, [key]: value || undefined });
    };

    const clearFilters = () => {
        setUserSearch('');
        onFiltersChange({});
    };

    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <div className={cn('flex flex-wrap gap-3 items-center', className)}>
            {/* User search */}
            <form onSubmit={handleUserSearchSubmit} className="flex gap-2">
                <Input
                    placeholder="User ID or name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-[180px]"
                />
            </form>

            {/* Action filter */}
            <Select
                value={filters.action || ''}
                onValueChange={(v) => handleChange('action', v)}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All Actions</SelectItem>
                    {COMMON_ACTIONS.map((action) => (
                        <SelectItem key={action} value={action}>
                            {action}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Resource filter */}
            <Select
                value={filters.resource || ''}
                onValueChange={(v) => handleChange('resource', v)}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All Resources</SelectItem>
                    {COMMON_RESOURCES.map((resource) => (
                        <SelectItem key={resource} value={resource}>
                            {resource}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Date range */}
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    className="w-[140px]"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    className="w-[140px]"
                />
            </div>

            {/* Clear filters */}
            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                </Button>
            )}
        </div>
    );
}
