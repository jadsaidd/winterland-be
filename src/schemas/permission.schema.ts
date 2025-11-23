import { z } from 'zod';

// Permission schemas
export const createPermissionSchema = z.object({
  name: z.string().trim().min(1, 'Permission name is required'),
  resource: z.string().trim().min(1, 'Resource is required'),
  action: z.string().trim().min(1, 'Action is required'),
});

export const updatePermissionSchema = z.object({
  name: z.string().trim().min(1, 'Permission name cannot be empty').optional(),
  resource: z.string().trim().min(1, 'Resource cannot be empty').optional(),
  action: z.string().trim().min(1, 'Action cannot be empty').optional(),
});

export const assignPermissionSchema = z.object({
  permissionId: z.cuid('Invalid permission ID'),
  roleId: z.cuid('Invalid role ID'),
});

export const revokePermissionSchema = z.object({
  permissionId: z.cuid('Invalid permission ID'),
  roleId: z.cuid('Invalid role ID'),
});

// Parameter schemas
export const permissionIdParamSchema = z.object({
  id: z.cuid('Invalid permission ID'),
});

export const roleIdParamSchema = z.object({
  roleId: z.cuid('Invalid role ID'),
});

// Export types from schemas
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type AssignPermissionInput = z.infer<typeof assignPermissionSchema>;
export type RevokePermissionInput = z.infer<typeof revokePermissionSchema>;
export type PermissionIdParam = z.infer<typeof permissionIdParamSchema>;
export type RoleIdParam = z.infer<typeof roleIdParamSchema>;
