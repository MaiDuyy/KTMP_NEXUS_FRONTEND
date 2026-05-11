'use client';

import { ReactNode } from 'react';
import { useHasPermission, useHasAnyPermission } from '@/src/lib/rbac/usePermission';
import { PermissionDenied } from '@/components/enterprise/PermissionDenied';
import { useAppSelector } from '@/src/redux/hooks';

interface RequirePermissionProps {
    /** Single permission to check */
    permission?: string;
    /** Multiple permissions - user needs at least one */
    anyOf?: string[];
    /** Multiple permissions - user needs all */
    allOf?: string[];
    /** Required role */
    role?: string;
    /** Multiple roles - user needs at least one */
    anyRole?: string[];
    /** Content to render when user has permission */
    children: ReactNode;
    /** Custom fallback when permission denied (default: PermissionDenied component) */
    fallback?: ReactNode;
    /** If true, renders nothing when no permission (instead of fallback) */
    silent?: boolean;
}

/**
 * Guard component that renders children only if user has required permission(s)
 * 
 * @example
 * // Single permission
 * <RequirePermission permission="audit.view">
 *   <AuditLogs />
 * </RequirePermission>
 * 
 * @example
 * // Any of multiple permissions
 * <RequirePermission anyOf={['chat.read', 'chat.write']}>
 *   <ChatModule />
 * </RequirePermission>
 * 
 * @example
 * // Silent mode - render nothing if no permission
 * <RequirePermission permission="admin.users" silent>
 *   <AdminLink />
 * </RequirePermission>
 */
export function RequirePermission({
    permission,
    anyOf,
    allOf,
    role,
    anyRole,
    children,
    fallback,
    silent = false,
}: RequirePermissionProps) {
    // Check single permission
    const hasSinglePermission = permission ? useHasPermission(permission) : true;

    // Check anyOf permissions
    const hasAnyOfPermission = anyOf ? useHasAnyPermission(anyOf) : true;

    // Check allOf permissions - implemented inline since we may not need all
    const hasAllOfPermission = allOf
        ? allOf.every((p) => useHasPermission(p))
        : true;

    // Check roles
    const roles = useAppSelector((state) => state.auth.roles);
    const hasRoleCheck = role ? roles?.includes(role) : true;
    const hasAnyRoleCheck = anyRole ? anyRole.some(r => roles?.includes(r)) : true;

    const hasAccess = hasSinglePermission && hasAnyOfPermission && hasAllOfPermission && hasRoleCheck && hasAnyRoleCheck;

    if (hasAccess) {
        return <>{children}</>;
    }

    if (silent) {
        return null;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return <PermissionDenied />;
}

/**
 * HOC version for wrapping entire components/pages
 */
export function withPermission<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    permission: string,
) {
    return function WithPermissionComponent(props: P) {
        return (
            <RequirePermission permission={permission}>
                <WrappedComponent {...props} />
            </RequirePermission>
        );
    };
}
