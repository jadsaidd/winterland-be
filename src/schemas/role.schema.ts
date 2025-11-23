import { z } from 'zod';

// Role schemas
export const createRoleSchema = z.object({
  name: z.string().trim().min(1, 'Role name is required'),
  roleType: z.enum(['WORKER', 'CUSTOMER'], {
    message: 'Role type must be either WORKER or CUSTOMER',
  }).optional(),
  description: z.string().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1, 'Role name is required').optional(),
  roleType: z.enum(['WORKER', 'CUSTOMER'], {
    message: 'Role type must be either WORKER or CUSTOMER',
  }).optional(),
  description: z.string().optional(),
});

export const assignRoleSchema = z.object({
  userId: z.cuid('Invalid user ID'),
  roleId: z.cuid('Invalid role ID'),
});

export const revokeRoleSchema = z.object({
  userId: z.cuid('Invalid user ID'),
  roleId: z.cuid('Invalid role ID'),
});

// Parameter schemas
export const roleIdParamSchema = z.object({
  id: z.cuid('Invalid role ID'),
});

export const userIdParamSchema = z.object({
  userId: z.cuid('Invalid user ID'),
});

// Query schemas
export const getRolesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  type: z.enum(['WORKER', 'CUSTOMER'], {
    message: 'Type must be either WORKER or CUSTOMER',
  }).optional(),
});

// Export types from schemas
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type RevokeRoleInput = z.infer<typeof revokeRoleSchema>;
export type RoleIdParam = z.infer<typeof roleIdParamSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type GetRolesQuery = z.infer<typeof getRolesQuerySchema>;
