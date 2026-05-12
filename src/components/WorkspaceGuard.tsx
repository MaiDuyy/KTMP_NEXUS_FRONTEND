import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import { useGetUserWorkspacesQuery } from '@/src/redux/feature/workspaceApi';

type WorkspaceRole = 'WORKSPACE_OWNER' | 'WORKSPACE_ADMIN' | 'WORKSPACE_MEMBER' | 'WORKSPACE_GUEST';

interface WorkspaceGuardProps {
  children: React.ReactNode;
  allowedRoles?: WorkspaceRole[];
  fallback?: React.ReactNode;
}

/**
 * Component giúp ẩn/hiện UI dựa trên Role của User trong Workspace hiện tại.
 * Cách dùng:
 * <WorkspaceGuard allowedRoles={['OWNER', 'ADMIN']}>
 *    <button>Xóa Workspace</button>
 * </WorkspaceGuard>
 */
export const WorkspaceGuard: React.FC<WorkspaceGuardProps> = ({
  children,
  allowedRoles = ['WORKSPACE_OWNER', 'WORKSPACE_ADMIN', 'WORKSPACE_MEMBER'],
  fallback = null
}) => {
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const { data: workspaces } = useGetUserWorkspacesQuery();

  // Nếu không có Workspace được chọn, coi như không có quyền đặc thù
  if (!currentWorkspaceId) return <>{fallback}</>;

  const currentWorkspace = workspaces?.find(ws => ws.id === currentWorkspaceId);
  const userRole = currentWorkspace?.myRole as WorkspaceRole;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
