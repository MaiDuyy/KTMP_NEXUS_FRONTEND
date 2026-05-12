'use client';

import { useState, useMemo } from 'react';
import {
    useGetAllPermissionsQuery,
    useAssignPermissionsToRoleMutation,
    useRemovePermissionsFromRoleMutation,
    Permission,
} from '@/src/redux/feature/rbacApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, Loader2, Shield, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionPickerProps {
    roleId: string;
    roleName: string;
    currentPermissions: string[];
    onSave?: () => void;
}

export function PermissionPicker({
    roleId,
    roleName,
    currentPermissions,
    onSave
}: PermissionPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
        new Set(currentPermissions)
    );
    const [hasChanges, setHasChanges] = useState(false);

    const { data: permissionsData, isLoading } = useGetAllPermissionsQuery();
    const [assignPermissions, { isLoading: isAssigning }] = useAssignPermissionsToRoleMutation();
    const [removePermissions, { isLoading: isRemoving }] = useRemovePermissionsFromRoleMutation();

    const permissions = (permissionsData as any)?.permissions || permissionsData || [];

    // Group permissions by resource
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        permissions.forEach((perm: any) => {
            if (!groups[perm.resource]) {
                groups[perm.resource] = [];
            }
            groups[perm.resource].push(perm);
        });
        return groups;
    }, [permissions]);

    // Filter by search
    const filteredGroups = useMemo(() => {
        if (!searchQuery) return groupedPermissions;

        const filtered: Record<string, Permission[]> = {};
        Object.entries(groupedPermissions).forEach(([resource, perms]) => {
            const matchingPerms = perms.filter(
                p => p.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (matchingPerms.length > 0) {
                filtered[resource] = matchingPerms;
            }
        });
        return filtered;
    }, [groupedPermissions, searchQuery]);

    const handleTogglePermission = (permissionId: string) => {
        const newSelected = new Set(selectedPermissions);
        if (newSelected.has(permissionId)) {
            newSelected.delete(permissionId);
        } else {
            newSelected.add(permissionId);
        }
        setSelectedPermissions(newSelected);
        setHasChanges(true);
    };

    const handleToggleResource = (resource: string) => {
        const resourcePerms = groupedPermissions[resource] || [];
        const allSelected = resourcePerms.every(p => selectedPermissions.has(p.id));

        const newSelected = new Set(selectedPermissions);
        resourcePerms.forEach(p => {
            if (allSelected) {
                newSelected.delete(p.id);
            } else {
                newSelected.add(p.id);
            }
        });
        setSelectedPermissions(newSelected);
        setHasChanges(true);
    };

    const handleSave = async () => {
        const currentSet = new Set(currentPermissions);
        const toAdd = [...selectedPermissions].filter(id => !currentSet.has(id));
        const toRemove = [...currentSet].filter(id => !selectedPermissions.has(id));

        try {
            if (toAdd.length > 0) {
                await assignPermissions({ roleId, data: { permissionIds: toAdd } }).unwrap();
            }
            if (toRemove.length > 0) {
                await removePermissions({ roleId, data: { permissionIds: toRemove } }).unwrap();
            }
            setHasChanges(false);
            onSave?.();
        } catch (error) {
            console.error('Failed to update permissions:', error);
        }
    };

    const isResourceFullySelected = (resource: string) => {
        const resourcePerms = groupedPermissions[resource] || [];
        return resourcePerms.every(p => selectedPermissions.has(p.id));
    };

    const isResourcePartiallySelected = (resource: string) => {
        const resourcePerms = groupedPermissions[resource] || [];
        const selected = resourcePerms.filter(p => selectedPermissions.has(p.id));
        return selected.length > 0 && selected.length < resourcePerms.length;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Permissions for {roleName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {selectedPermissions.size} permissions selected
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || isAssigning || isRemoving}
                >
                    {(isAssigning || isRemoving) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Permission Groups */}
            <Accordion type="multiple" className="w-full">
                {Object.entries(filteredGroups).map(([resource, perms]) => (
                    <AccordionItem key={resource} value={resource}>
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={isResourceFullySelected(resource)}
                                    ref={(el) => {
                                        if (el) {
                                            (el as any).indeterminate = isResourcePartiallySelected(resource);
                                        }
                                    }}
                                    onCheckedChange={() => handleToggleResource(resource)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <span className="font-medium capitalize">{resource}</span>
                                <Badge variant="secondary" className="text-xs">
                                    {perms.filter(p => selectedPermissions.has(p.id)).length}/{perms.length}
                                </Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 pl-8">
                                {perms.map((perm) => (
                                    <label
                                        key={perm.id}
                                        className={cn(
                                            "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                            selectedPermissions.has(perm.id)
                                                ? "bg-primary/5 border border-primary/20"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <Checkbox
                                            checked={selectedPermissions.has(perm.id)}
                                            onCheckedChange={() => handleTogglePermission(perm.id)}
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium text-sm">{perm.action}</span>
                                            {perm.description && (
                                                <p className="text-xs text-muted-foreground">{perm.description}</p>
                                            )}
                                        </div>
                                        {selectedPermissions.has(perm.id) && (
                                            <Check className="w-4 h-4 text-primary" />
                                        )}
                                    </label>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {Object.keys(filteredGroups).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No permissions found matching "{searchQuery}"
                </div>
            )}
        </div>
    );
}
