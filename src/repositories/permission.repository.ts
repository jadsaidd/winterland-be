import { Permission } from '@prisma/client';

import { logger } from '../config';
import { CreatePermissionDto, UpdatePermissionDto } from '../dtos/request/permission.request.dto';
import { createPaginatedResponse,PaginatedResponse } from '../utils/pagination.util';
import prisma from '../utils/prisma.client';

export class PermissionRepository {
  /**
   * Create a new permission
   * @param permissionData Permission data
   * @returns Created permission
   */
  async createPermission(permissionData: CreatePermissionDto): Promise<Permission> {
    try {
      return await prisma.permission.create({
        data: permissionData,
      });
    } catch (error) {
      logger.error('Error creating permission:', error);
      throw error;
    }
  }

  /**
   * Find permission by ID
   * @param id Permission ID
   * @returns Permission if found, null otherwise
   */
  async findById(id: string): Promise<Permission | null> {
    try {
      return await prisma.permission.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Error finding permission by id:', error);
      throw error;
    }
  }

  /**
   * Find permission by name
   * @param name Permission name
   * @returns Permission if found, null otherwise
   */
  async findByName(name: string): Promise<Permission | null> {
    try {
      return await prisma.permission.findUnique({
        where: { name },
      });
    } catch (error) {
      logger.error('Error finding permission by name:', error);
      throw error;
    }
  }

  /**
   * Update a permission
   * @param id Permission ID
   * @param permissionData Permission data
   * @returns Updated permission
   */
  async updatePermission(id: string, permissionData: UpdatePermissionDto): Promise<Permission> {
    try {
      return await prisma.permission.update({
        where: { id },
        data: permissionData,
      });
    } catch (error) {
      logger.error('Error updating permission:', error);
      throw error;
    }
  }

  /**
   * Get all permissions
   * @param page Page number
   * @param limit Items per page
   * @returns Paginated list of permissions
   */
  async getAllPermissions(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Permission>> {
    try {
      const skip = (page - 1) * limit;
      const [permissions, total] = await Promise.all([
        prisma.permission.findMany({
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.permission.count(),
      ]);

      return createPaginatedResponse(permissions, total, page, limit);
    } catch (error) {
      logger.error('Error getting all permissions:', error);
      throw error;
    }
  }

  /**
   * Assign permission to role
   * @param roleId Role ID
   * @param permissionId Permission ID
   * @returns Created role permission
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<any> {
    try {
      return await prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
        },
      });
    } catch (error) {
      logger.error('Error assigning permission to role:', error);
      throw error;
    }
  }

  /**
   * Revoke permission from role
   * @param roleId Role ID
   * @param permissionId Permission ID
   * @returns True if successful
   */
  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    try {
      await prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId,
        },
      });
      return true;
    } catch (error) {
      logger.error('Error revoking permission from role:', error);
      throw error;
    }
  }

  /**
   * Delete a permission
   * @param id Permission ID
   * @returns True if successful
   */
  async deletePermission(id: string): Promise<boolean> {
    try {
      await prisma.permission.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      logger.error('Error deleting permission:', error);
      throw error;
    }
  }

  /**
   * Get role permissions
   * @param roleId Role ID
   * @returns Permissions assigned to role
   */
  async getRolePermissions(roleId: string): Promise<any[]> {
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId },
        include: {
          permission: true,
        },
      });

      return rolePermissions.map((rp: { permission: Permission }) => rp.permission);
    } catch (error) {
      logger.error('Error getting role permissions:', error);
      throw error;
    }
  }
}
