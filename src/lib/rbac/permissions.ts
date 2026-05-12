/**
 * RBAC Permissions Constants
 * AUTO-GENERATED from backend seed.ts format
 * Format: resource.action (converted from backend resource:action:scope)
 */

// =============================================================================
// PERMISSION GROUPS
// =============================================================================

export const PERMISSION_GROUPS = {
  USER: 'user',
  CHAT: 'chat',
  KNOWLEDGE: 'knowledge',
  AI: 'ai',
  AUDIT: 'audit',
  ROLE: 'role',
} as const;

// =============================================================================
// USER PERMISSIONS
// Backend: user:read:own, user:read:org, user:write:own, etc.
// =============================================================================

export const USER_PERMISSIONS = {
  // Read
  READ_OWN: 'user.read',           // user:read:own - View own profile
  READ_ORG: 'user.read',           // user:read:org - View users in org
  READ_SYSTEM: 'user.read',        // user:read:system - View all users
  // Write
  WRITE_OWN: 'user.write',         // user:write:own - Update own profile
  WRITE_ORG: 'user.write',         // user:write:org - Update users in org
  WRITE_SYSTEM: 'user.write',      // user:write:system - Update any user
  // Delete
  DELETE_ORG: 'user.delete',       // user:delete:org - Delete users in org
  DELETE_SYSTEM: 'user.delete',    // user:delete:system - Delete any user
  // Admin
  ADMIN_ORG: 'user.admin',         // user:admin:org - Manage org users
  ADMIN_SYSTEM: 'user.admin',      // user:admin:system - Manage all users
} as const;

// =============================================================================
// CHAT PERMISSIONS
// Backend: chat.channel:read:member, chat.dm:read:own, etc.
// =============================================================================

export const CHAT_PERMISSIONS = {
  // Channel
  CHANNEL_READ: 'chat.channel.read',     // chat.channel:read:member - Read channels as member
  CHANNEL_READ_ORG: 'chat.channel.read', // chat.channel:read:org - Read all org channels
  CHANNEL_WRITE: 'chat.channel.write',   // chat.channel:write:member - Send messages
  CHANNEL_ADMIN_WS: 'chat.channel.admin', // chat.channel:admin:workspace - Manage workspace channels
  CHANNEL_ADMIN_ORG: 'chat.channel.admin', // chat.channel:admin:org - Manage all org channels
  // DM
  DM_READ: 'chat.dm.read',         // chat.dm:read:own - Read own DMs
  DM_READ_ORG: 'chat.dm.read',     // chat.dm:read:org - Read all DMs (admin audit)
  DM_WRITE: 'chat.dm.write',       // chat.dm:write:own - Send DMs
  // Aliases for simpler usage
  READ: 'chat.channel.read',       // Alias for RequirePermission
  WRITE: 'chat.channel.write',     // Alias for RequirePermission
} as const;

// =============================================================================
// KNOWLEDGE PERMISSIONS
// Backend: knowledge:read:acl, knowledge:write:own, etc.
// =============================================================================

export const KNOWLEDGE_PERMISSIONS = {
  READ_ACL: 'knowledge.read',      // knowledge:read:acl - Read docs by ACL
  READ_SYSTEM: 'knowledge.read',   // knowledge:read:system - Read all docs
  WRITE_OWN: 'knowledge.write',    // knowledge:write:own - Upload own docs
  WRITE_COLLECTION: 'knowledge.write', // knowledge:write:collection - Manage collection docs
  ADMIN_SYSTEM: 'knowledge.admin', // knowledge:admin:system - Manage all knowledge
  // Aliases
  READ: 'knowledge.read',
  WRITE: 'knowledge.write',
  ADMIN: 'knowledge.admin',
} as const;

// =============================================================================
// AI PERMISSIONS
// Backend: ai:execute:own, ai:admin:system
// =============================================================================

export const AI_PERMISSIONS = {
  EXECUTE: 'ai.execute',           // ai:execute:own - Use AI assistant
  ADMIN: 'ai.admin',               // ai:admin:system - Configure AI settings
  // Aliases
  ASK: 'ai.execute',               // Alias for common usage
  CONFIG: 'ai.admin',
} as const;

// =============================================================================
// AUDIT PERMISSIONS
// Backend: audit:read:own, audit:read:org, audit:export:system
// =============================================================================

export const AUDIT_PERMISSIONS = {
  READ_OWN: 'audit.read',          // audit:read:own - View own audit logs
  READ_ORG: 'audit.read',          // audit:read:org - View org audit logs
  READ_SYSTEM: 'audit.read',       // audit:read:system - View all audit logs
  EXPORT: 'audit.export',          // audit:export:system - Export audit logs
  // Aliases
  VIEW: 'audit.read',
} as const;

// =============================================================================
// ROLE/RBAC PERMISSIONS
// Backend: role:read:system, role:write:system, role:assign:org
// =============================================================================

export const ROLE_PERMISSIONS = {
  READ: 'role.read',               // role:read:system - View roles
  WRITE: 'role.write',             // role:write:system - Create/update roles
  ASSIGN_ORG: 'role.assign',       // role:assign:org - Assign roles in org
  ASSIGN_SYSTEM: 'role.assign',    // role:assign:system - Assign any role
} as const;

// Legacy aliases for backward compatibility
export const SECURITY_PERMISSIONS = {
  AUDIT_VIEW: AUDIT_PERMISSIONS.VIEW,
  AUDIT_EXPORT: AUDIT_PERMISSIONS.EXPORT,
} as const;

export const ADMIN_PERMISSIONS = {
  USER_MANAGE: USER_PERMISSIONS.ADMIN_ORG,
  ROLE_MANAGE: ROLE_PERMISSIONS.WRITE,
} as const;

// =============================================================================
// ALL PERMISSIONS FLATTENED
// =============================================================================

export const PERMISSIONS = {
  ...USER_PERMISSIONS,
  ...CHAT_PERMISSIONS,
  ...KNOWLEDGE_PERMISSIONS,
  ...AI_PERMISSIONS,
  ...AUDIT_PERMISSIONS,
  ...ROLE_PERMISSIONS,
} as const;

// Permission type
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// =============================================================================
// PERMISSION GROUP MAP (for navigation visibility)
// =============================================================================

export const PERMISSION_GROUP_MAP: Record<string, string[]> = {
  [PERMISSION_GROUPS.USER]: [
    USER_PERMISSIONS.READ_OWN,
  ],
  [PERMISSION_GROUPS.CHAT]: [
    CHAT_PERMISSIONS.READ,
    CHAT_PERMISSIONS.WRITE,
  ],
  [PERMISSION_GROUPS.KNOWLEDGE]: [
    KNOWLEDGE_PERMISSIONS.READ,
  ],
  [PERMISSION_GROUPS.AI]: [
    AI_PERMISSIONS.EXECUTE,
  ],
  [PERMISSION_GROUPS.AUDIT]: [
    AUDIT_PERMISSIONS.VIEW,
  ],
  [PERMISSION_GROUPS.ROLE]: [
    ROLE_PERMISSIONS.READ,
  ],
};

// =============================================================================
// ROLE HIERARCHY (matches backend seed.ts)
// Lower level = higher privilege
// =============================================================================

export const ROLE_LEVELS = {
  SUPER_ADMIN: 0,
  ADMIN: 1,
  WORKSPACE_MANAGER: 2,
  WORKSPACE_OWNER: 3,
  WORKSPACE_ADMIN: 4,
  EMPLOYEE: 5,
  WORKSPACE_MEMBER: 6,
  WORKSPACE_GUEST: 7,
} as const;

export type RoleName = keyof typeof ROLE_LEVELS;

// =============================================================================
// ROLE-PERMISSION MAPPING (mirrors backend seed.ts for reference)
// This is for documentation - actual permissions come from RBAC API
// =============================================================================

export const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // All permissions
  ADMIN: [
    'user.read', 'user.write', 'user.delete', 'user.admin',
    'chat.channel.read', 'chat.channel.admin',
    'chat.dm.read',
    'knowledge.read',
    'ai.execute',
    'audit.read',
    'role.read', 'role.assign',
  ],
  WORKSPACE_MANAGER: [
    'user.read', 'user.write',
    'chat.channel.read', 'chat.channel.admin',
    'knowledge.read',
    'ai.execute',
    'role.read', 'role.assign',
  ],
  WORKSPACE_OWNER: [
    'user.read',
    'chat.dm.read',
    'audit.read', 'audit.export',
    'role.read',
    'knowledge.read',
  ],
  WORKSPACE_ADMIN: [
    'user.read',
    'chat.channel.read', 'chat.channel.admin',
    'chat.dm.read', 'chat.dm.write',
    'knowledge.read',
    'ai.execute',
  ],
  EMPLOYEE: [
    'user.read', 'user.write',
    'chat.channel.read', 'chat.channel.write',
    'chat.dm.read', 'chat.dm.write',
    'knowledge.read',
    'ai.execute',
    'audit.read',
  ],
  WORKSPACE_MEMBER: [
    'user.read', 'user.write',
    'chat.channel.read', 'chat.channel.write',
    'chat.dm.read', 'chat.dm.write',
    'knowledge.read',
  ],
  WORKSPACE_GUEST: [
    'user.read',
    'chat.channel.read',
  ],
};
