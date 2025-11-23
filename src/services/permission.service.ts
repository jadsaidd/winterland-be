import { logger } from '../config';
import { AssignPermissionDto, CreatePermissionDto, RevokePermissionDto,UpdatePermissionDto } from '../dtos/request/permission.request.dto';
import { BadRequestException, ConflictException,NotFoundException } from '../exceptions/http.exception';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';

const permissionRepository = new PermissionRepository();
const roleRepository = new RoleRepository();

export class PermissionService {
  /**
   * Create a new permission
   * @param permissionData Permission data
   * @returns Created permission
   */
  async createPermission(permissionData: CreatePermissionDto) {
    try {
      // Check if permission with the same name already exists
      const existingPermission = await permissionRepository.findByName(permissionData.name);
      if (existingPermission) {
        throw new ConflictException(`Permission with name ${permissionData.name} already exists`);
      }

      // Create permission
      return await permissionRepository.createPermission(permissionData);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      logger.error('Error creating permission:', error);
      throw new BadRequestException('Failed to create permission');
    }
  }

  /**
   * Get permission by ID
   * @param id Permission ID
   * @returns Permission
   */
  async getPermissionById(id: string) {
    try {
      const permission = await permissionRepository.findById(id);
      if (!permission) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      return permission;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error getting permission by ID:', error);
      throw new BadRequestException('Failed to get permission');
    }
  }

  /**
   * Update a permission
   * @param id Permission ID
   * @param permissionData Permission data
   * @returns Updated permission
   */
  async updatePermission(id: string, permissionData: UpdatePermissionDto) {
    try {
      // Check if permission exists
      const existingPermission = await permissionRepository.findById(id);
      if (!existingPermission) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      // Check if name is being updated and if it conflicts
      if (permissionData.name && permissionData.name !== existingPermission.name) {
        const permissionWithSameName = await permissionRepository.findByName(permissionData.name);
        if (permissionWithSameName) {
          throw new ConflictException(`Permission with name ${permissionData.name} already exists`);
        }
      }

      // Update permission
      return await permissionRepository.updatePermission(id, permissionData);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      logger.error('Error updating permission:', error);
      throw new BadRequestException('Failed to update permission');
    }
  }

  /**
   * Get all permissions
   * @param page Page number
   * @param limit Items per page
   * @returns Paginated list of permissions
   */
  async getAllPermissions(page: number = 1, limit: number = 10) {
    try {
      return await permissionRepository.getAllPermissions(page, limit);
    } catch (error) {
      logger.error('Error getting all permissions:', error);
      throw new BadRequestException('Failed to get permissions');
    }
  }

  /**
   * Assign permission to role
   * @param assignPermissionData Permission assignment data
   * @returns Assignment result
   */
  async assignPermissionToRole(assignPermissionData: AssignPermissionDto) {
    try {
      const { permissionId, roleId } = assignPermissionData;

      // Check if role exists
      const role = await roleRepository.findById(roleId);
      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      // Check if permission exists
      const permission = await permissionRepository.findById(permissionId);
      if (!permission) {
        throw new NotFoundException(`Permission with ID ${permissionId} not found`);
      }

      // Assign permission
      await permissionRepository.assignPermissionToRole(roleId, permissionId);

      return { success: true, message: 'Permission assigned successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error assigning permission to role:', error);
      throw new BadRequestException('Failed to assign permission to role');
    }
  }

  /**
   * Revoke permission from role
   * @param revokePermissionData Permission revocation data
   * @returns Revocation result
   */
  async revokePermissionFromRole(revokePermissionData: RevokePermissionDto) {
    try {
      const { permissionId, roleId } = revokePermissionData;

      // Revoke permission
      await permissionRepository.revokePermissionFromRole(roleId, permissionId);

      return { success: true, message: 'Permission revoked successfully' };
    } catch (error) {
      logger.error('Error revoking permission from role:', error);
      throw new BadRequestException('Failed to revoke permission from role');
    }
  }

  /**
   * Delete a permission
   * @param id Permission ID
   * @returns Deletion result
   */
  async deletePermission(id: string) {
    try {
      // Check if permission exists
      const existingPermission = await permissionRepository.findById(id);
      if (!existingPermission) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      // Delete permission
      await permissionRepository.deletePermission(id);

      return { success: true, message: 'Permission deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error deleting permission:', error);
      throw new BadRequestException('Failed to delete permission');
    }
  }

  /**
   * Get role permissions
   * @param roleId Role ID
   * @returns List of permissions assigned to role
   */
  async getRolePermissions(roleId: string) {
    try {
      return await permissionRepository.getRolePermissions(roleId);
    } catch (error) {
      logger.error('Error getting role permissions:', error);
      throw new BadRequestException('Failed to get role permissions');
    }
  }
}
