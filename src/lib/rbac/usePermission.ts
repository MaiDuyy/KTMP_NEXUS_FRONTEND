'use client';

import { useAppSelector } from '@/src/redux/hooks';
import { PERMISSION_GROUP_MAP } from './permissions';

/**
 * Check if user has a specific permission
 */
export function useHasPermission(permission: string): boolean {
  const permissions = useAppSelector((state) => state.auth.permissions);
  return permissions?.includes(permission) ?? false;
}

/**
 * Check if user has any of the specified permissions
 */
export function useHasAnyPermission(permissionList: string[]): boolean {
  const permissions = useAppSelector((state) => state.auth.permissions);
  if (!permissions) return false;
  return permissionList.some((p) => permissions.includes(p));
}

/**
 * Check if user has all of the specified permissions
 */
export function useHasAllPermissions(permissionList: string[]): boolean {
  const permissions = useAppSelector((state) => state.auth.permissions);
  if (!permissions) return false;
  return permissionList.every((p) => permissions.includes(p));
}

/**
 * Check if user has access to a permission group (for navigation visibility)
 */
export function useHasGroupAccess(group: string): boolean {
  const permissions = useAppSelector((state) => state.auth.permissions);
  if (!permissions) return false;
  
  const groupPermissions = PERMISSION_GROUP_MAP[group];
  if (!groupPermissions) return false;
  
  return groupPermissions.some((p) => permissions.includes(p));
}

/**
 * Get all permissions the user has
 */
export function usePermissions(): string[] {
  const permissions = useAppSelector((state) => state.auth.permissions);
  return permissions ?? [];
}

/**
 * Check if user has a specific role
 */
export function useHasRole(role: string): boolean {
  const roles = useAppSelector((state) => state.auth.roles);
  return roles?.includes(role) ?? false;
}

/**
 * Check if user has any of the specified roles
 */
export function useHasAnyRole(roleList: string[]): boolean {
  const roles = useAppSelector((state) => state.auth.roles);
  if (!roles) return false;
  return roleList.some((r) => roles.includes(r));
}

/**
 * Check if user can perform admin DM read (audited action)
 */
export function useCanReadOrgDM(): boolean {
  return useHasPermission('dm.read.org') || useHasAnyRole(['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OFFICER']);
}

