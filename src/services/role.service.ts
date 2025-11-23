import { logger } from '../config';
import { AssignRoleDto, CreateRoleDto, RevokeRoleDto, UpdateRoleDto } from '../dtos/request/role.request.dto';
import { BadRequestException, ConflictException, NotFoundException } from '../exceptions/http.exception';
import { RoleRepository } from '../repositories/role.repository';

const roleRepository = new RoleRepository();

export class RoleService {
  /**
   * Create a new role
   * @param roleData Role data
   * @returns Created role
   */
  async createRole(roleData: CreateRoleDto) {
    try {
      // Check if role with the same name already exists
      const existingRole = await roleRepository.findByName(roleData.name);
      if (existingRole) {
        throw new ConflictException(`Role with name ${roleData.name} already exists`);
      }

      // Create role
      return await roleRepository.createRole(roleData);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      logger.error('Error creating role:', error);
      throw new BadRequestException('Failed to create role');
    }
  }

  /**
   * Get role by ID
   * @param id Role ID
   * @returns Role with permissions
   */
  async getRoleById(id: string) {
    try {
      const role = await roleRepository.findByIdWithPermissions(id);
      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      // Format permissions for response
      return {
        ...role,
        permissions: role.rolePermissions.map((rp: any) => rp.permission),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error getting role by ID:', error);
      throw new BadRequestException('Failed to get role');
    }
  }

  /**
   * Update a role
   * @param id Role ID
   * @param roleData Role data
   * @returns Updated role
   */
  async updateRole(id: string, roleData: UpdateRoleDto) {
    try {
      // Check if role exists
      const existingRole = await roleRepository.findById(id);
      if (!existingRole) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      // Check if name is being updated and if it conflicts
      if (roleData.name && roleData.name !== existingRole.name) {
        const roleWithSameName = await roleRepository.findByName(roleData.name);
        if (roleWithSameName) {
          throw new ConflictException(`Role with name ${roleData.name} already exists`);
        }
      }

      // Update role
      return await roleRepository.updateRole(id, roleData);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      logger.error('Error updating role:', error);
      throw new BadRequestException('Failed to update role');
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
  ) {
    try {
      return await roleRepository.getAllRoles(page, limit, search, roleType);
    } catch (error) {
      logger.error('Error getting all roles:', error);
      throw new BadRequestException('Failed to get roles');
    }
  }

  /**
   * Assign role to user
   * @param assignRoleData Role assignment data
   * @returns Assignment result
   */
  async assignRoleToUser(assignRoleData: AssignRoleDto) {
    try {
      const { userId, roleId } = assignRoleData;

      // Check if role exists
      const role = await roleRepository.findById(roleId);
      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      // Assign role
      await roleRepository.assignRoleToUser(userId, roleId);

      return { success: true, message: 'Role assigned successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error assigning role to user:', error);
      throw new BadRequestException('Failed to assign role to user');
    }
  }

  /**
   * Revoke role from user
   * @param revokeRoleData Role revocation data
   * @returns Revocation result
   */
  async revokeRoleFromUser(revokeRoleData: RevokeRoleDto) {
    try {
      const { userId, roleId } = revokeRoleData;

      // Revoke role
      await roleRepository.revokeRoleFromUser(userId, roleId);

      return { success: true, message: 'Role revoked successfully' };
    } catch (error) {
      logger.error('Error revoking role from user:', error);
      throw new BadRequestException('Failed to revoke role from user');
    }
  }

  /**
   * Delete a role
   * @param id Role ID
   * @returns Deletion result
   */
  async deleteRole(id: string) {
    try {
      // Check if role exists
      const existingRole = await roleRepository.findById(id);
      if (!existingRole) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      // Delete role
      await roleRepository.deleteRole(id);

      return { success: true, message: 'Role deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error deleting role:', error);
      throw new BadRequestException('Failed to delete role');
    }
  }

  /**
   * Get user roles
   * @param userId User ID
   * @returns List of roles assigned to user
   */
  async getUserRoles(userId: string) {
    try {
      return await roleRepository.getUserRoles(userId);
    } catch (error) {
      logger.error('Error getting user roles:', error);
      throw new BadRequestException('Failed to get user roles');
    }
  }
}
