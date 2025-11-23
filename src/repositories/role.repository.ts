import { Role } from '@prisma/client';

import { logger } from '../config';
import { CreateRoleDto, UpdateRoleDto } from '../dtos/request/role.request.dto';
import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import prisma from '../utils/prisma.client';

export class RoleRepository {
  /**
   * Create a new role
   * @param roleData Role data
   * @returns Created role
   */
  async createRole(roleData: CreateRoleDto): Promise<Role> {
    try {
      return await prisma.role.create({
        data: roleData,
      });
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Find role by ID
   * @param id Role ID
   * @returns Role if found, null otherwise
   */
  async findById(id: string): Promise<Role | null> {
    try {
      return await prisma.role.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Error finding role by id:', error);
      throw error;
    }
  }

  /**
   * Find role by name
   * @param name Role name
   * @returns Role if found, null otherwise
   */
  async findByName(name: string): Promise<Role | null> {
    try {
      return await prisma.role.findUnique({
        where: { name },
      });
    } catch (error) {
      logger.error('Error finding role by name:', error);
      throw error;
    }
  }

  /**
   * Find role by ID with permissions
   * @param id Role ID
   * @returns Role with permissions if found, null otherwise
   */
  async findByIdWithPermissions(id: string): Promise<any | null> {
    try {
      return await prisma.role.findUnique({
        where: { id },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error finding role with permissions:', error);
      throw error;
    }
  }

  /**
   * Update a role
   * @param id Role ID
   * @param roleData Role data
   * @returns Updated role
   */
  async updateRole(id: string, roleData: UpdateRoleDto): Promise<Role> {
    try {
      return await prisma.role.update({
        where: { id },
        data: roleData,
      });
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Get all roles
   * @param page Page number
   * @param limit Items per page
   * @param search Search query for name and description
   * @param roleType Filter by role type (WORKER or CUSTOMER)
   * @returns Paginated list of roles
   */
  async getAllRoles(
    page: number = 1,
    limit: number = 10,
    search?: string,
    roleType?: 'WORKER' | 'CUSTOMER'
  ): Promise<PaginatedResponse<Role>> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      // Add search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Add role type filter
      if (roleType) {
        where.roleType = roleType;
      }

      const [roles, total] = await Promise.all([
        prisma.role.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.role.count({ where }),
      ]);

      return createPaginatedResponse(roles, total, page, limit);
    } catch (error) {
      logger.error('Error getting all roles:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   * @param userId User ID
   * @param roleId Role ID
   * @returns Created user role
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<any> {
    try {
      return await prisma.userRole.create({
        data: {
          userId,
          roleId,
        },
      });
    } catch (error) {
      logger.error('Error assigning role to user:', error);
      throw error;
    }
  }

  /**
   * Revoke role from user
   * @param userId User ID
   * @param roleId Role ID
   * @returns True if successful
   */
  async revokeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    try {
      await prisma.userRole.deleteMany({
        where: {
          userId,
          roleId,
        },
      });
      return true;
    } catch (error) {
      logger.error('Error revoking role from user:', error);
      throw error;
    }
  }

  /**
   * Delete a role
   * @param id Role ID
   * @returns True if successful
   */
  async deleteRole(id: string): Promise<boolean> {
    try {
      await prisma.role.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Get user roles
   * @param userId User ID
   * @returns Roles assigned to user
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: true,
        },
      });

      return userRoles.map((ur: { role: Role }) => ur.role);
    } catch (error) {
      logger.error('Error getting user roles:', error);
      throw error;
    }
  }

  /**
   * Find roles by role type
   * @param roleType Role type (WORKER or CUSTOMER)
   * @returns Roles with the specified type
   */
  async findByRoleType(roleType: 'WORKER' | 'CUSTOMER'): Promise<Role[]> {
    try {
      return await prisma.role.findMany({
        where: { roleType },
      });
    } catch (error) {
      logger.error('Error finding roles by type:', error);
      throw error;
    }
  }
}
