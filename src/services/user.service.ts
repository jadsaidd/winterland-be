import { UserStatus } from '@prisma/client';

import { logger } from '../config';
import { BadRequestException, ConflictException, NotFoundException } from '../exceptions/http.exception';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { UserRepository } from '../repositories/user.repository';
import prisma from '../utils/prisma.client';

const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();

export class UserService {
  /**
   * Get user by ID with full details including country code, roles and permissions
   * @param id User ID
   * @returns User with all details
   */
  async getUserById(id: string) {
    try {
      const user = await userRepository.findByIdWithRolesAndPermissions(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Format roles and permissions
      const roles = user.userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        roleType: ur.role.roleType,
        description: ur.role.description,
        permissions: ur.role.rolePermissions.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      }));

      return {
        ...user,
        roles,
        userRoles: undefined, // Remove the nested structure
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error getting user by ID:', error);
      throw new BadRequestException('Failed to get user');
    }
  }

  /**
   * Get all users with pagination and optional filters
   * @param page Page number
   * @param limit Items per page
   * @param status Optional user status filter
   * @param isVerified Optional verification status filter
   * @param search Optional search term for name, email, or phone number
   * @returns Paginated list of users
   */
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED',
    isVerified?: boolean,
    search?: string
  ) {
    try {
      const result = await userRepository.getAllUsers(page, limit, status, isVerified, search);
      return result;
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw new BadRequestException('Failed to get users');
    }
  }

  /**
   * Update user status (ACTIVE, SUSPENDED, DELETED)
   * @param id User ID
   * @param status User status
   * @returns Updated user
   */
  async updateUserStatus(id: string, status: UserStatus) {
    try {
      // Check if user exists
      const user = await userRepository.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Update user status
      const updatedUser = await userRepository.setUserStatus(id, status);

      // Log activity
      await userRepository.logActivity(
        id,
        "USER_STATUS_UPDATED",
        `User status updated to ${status}`,
        undefined,
        undefined,
        "user",
        id
      );

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error updating user status:', error);
      throw new BadRequestException('Failed to update user status');
    }
  }

  /**
   * Get user activity logs with pagination
   * @param userId User ID
   * @param page Page number
   * @param limit Items per page
   * @returns Paginated list of activity logs
   */
  async getUserActivityLogs(userId: string, page: number = 1, limit: number = 10) {
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Get paginated activity logs
      const result = await userRepository.getUserActivityLogs(userId, page, limit);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error getting user activity logs:', error);
      throw new BadRequestException('Failed to get user activity logs');
    }
  }

  /**
   * Create a new user
   * @param userData User data
   * @returns Created user
   */
  async createUser(userData: {
    email?: string;
    phoneNumber?: string;
    countryCodeId?: string;
    name?: string;
    isVerified?: boolean;
  }) {
    try {
      // Validate that at least email or phone number is provided
      if (!userData.email && !userData.phoneNumber) {
        throw new BadRequestException('Either email or phone number must be provided');
      }

      // Check if email already exists
      if (userData.email) {
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser) {
          throw new ConflictException('Email already in use');
        }
      }

      // Check if phone number already exists
      if (userData.phoneNumber) {
        if (!userData.countryCodeId) {
          throw new BadRequestException('Country code is required when phone number is provided');
        }

        // Validate country code exists
        const countryCode = await userRepository.getCountryCodeById(userData.countryCodeId);
        if (!countryCode) {
          throw new NotFoundException('Country code not found');
        }

        // Validate phone number length
        const isValidLength = await userRepository.validatePhoneNumberLength(
          userData.phoneNumber,
          userData.countryCodeId
        );
        if (!isValidLength) {
          throw new BadRequestException(
            `Phone number must be ${countryCode.digits} digits for ${countryCode.country}`
          );
        }

        // Check for existing phone number
        const existingUserByPhone = await userRepository.findByPhoneNumber(userData.phoneNumber);
        if (existingUserByPhone) {
          throw new ConflictException('Phone number already in use');
        }
      }

      // Create user
      const user = await userRepository.createUser({
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        countryCodeId: userData.countryCodeId,
        name: userData.name,
        isVerified: userData.isVerified || false,
      });

      // Assign default user role
      try {
        const defaultRole = await prisma.role.findUnique({
          where: { name: "user" },
        });

        if (defaultRole) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: defaultRole.id,
            },
          });
        }
      } catch (error) {
        logger.warn("Could not assign default role to user:", error);
      }

      // Log activity
      await userRepository.logActivity(
        user.id,
        "USER_CREATED",
        "User created by admin",
        undefined,
        undefined,
        "user",
        user.id
      );

      return user;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      logger.error('Error creating user:', error);
      throw new BadRequestException('Failed to create user');
    }
  }

  /**
   * Update a user
   * @param id User ID
   * @param userData User data to update
   * @returns Updated user
   */
  async updateUser(id: string, userData: {
    email?: string;
    phoneNumber?: string;
    countryCodeId?: string;
    name?: string;
  }) {
    try {
      // Check if user exists
      const user = await userRepository.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Check if email is being updated and if it's already in use
      if (userData.email && userData.email !== user.email) {
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser) {
          throw new ConflictException('Email already in use');
        }
      }

      // Check if phone number is being updated
      if (userData.phoneNumber) {
        if (!userData.countryCodeId) {
          throw new BadRequestException('Country code is required when phone number is provided');
        }

        // Validate country code exists
        const countryCode = await userRepository.getCountryCodeById(userData.countryCodeId);
        if (!countryCode) {
          throw new NotFoundException('Country code not found');
        }

        // Validate phone number length
        const isValidLength = await userRepository.validatePhoneNumberLength(
          userData.phoneNumber,
          userData.countryCodeId
        );
        if (!isValidLength) {
          throw new BadRequestException(
            `Phone number must be ${countryCode.digits} digits for ${countryCode.country}`
          );
        }

        // Check if phone number is already in use by another user
        if (userData.phoneNumber !== user.phoneNumber) {
          const existingUserByPhone = await userRepository.findByPhoneNumber(userData.phoneNumber);
          if (existingUserByPhone) {
            throw new ConflictException('Phone number already in use');
          }
        }
      }

      // Update user
      const updatedUser = await userRepository.updateUser(id, userData);

      // Log activity
      await userRepository.logActivity(
        id,
        "USER_UPDATED",
        "User updated by admin",
        undefined,
        undefined,
        "user",
        id
      );

      return updatedUser;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      logger.error('Error updating user:', error);
      throw new BadRequestException('Failed to update user');
    }
  }

  /**
   * Delete a user (soft delete by setting status to DELETED)
   * @param id User ID
   * @returns Deletion result
   */
  async deleteUser(id: string) {
    try {
      // Check if user exists
      const user = await userRepository.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Soft delete user by setting status to DELETED
      await userRepository.setUserStatus(id, 'DELETED');

      // Log activity
      await userRepository.logActivity(
        id,
        "USER_DELETED",
        "User deleted (soft delete)",
        undefined,
        undefined,
        "user",
        id
      );

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error deleting user:', error);
      throw new BadRequestException('Failed to delete user');
    }
  }

  /**
   * Assign role to user
   * @param userId User ID
   * @param roleId Role ID
   * @returns Assignment result
   */
  async assignRoleToUser(userId: string, roleId: string) {
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      // Check if user already has the role
      const existingUserRole = await prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });

      if (existingUserRole) {
        throw new ConflictException('User already has this role');
      }

      // Assign role to user
      await prisma.userRole.create({
        data: {
          userId,
          roleId,
        },
      });

      // Log activity
      await userRepository.logActivity(
        userId,
        "ROLE_ASSIGNED",
        `Role ${role.name} assigned to user`,
        undefined,
        undefined,
        "role",
        roleId
      );

      return { success: true, message: 'Role assigned successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      logger.error('Error assigning role to user:', error);
      throw new BadRequestException('Failed to assign role to user');
    }
  }

  /**
   * Revoke role from user
   * @param userId User ID
   * @param roleId Role ID
   * @returns Revocation result
   */
  async revokeRoleFromUser(userId: string, roleId: string) {
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      // Check if user has the role
      const userRole = await prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });

      if (!userRole) {
        throw new NotFoundException('User does not have this role');
      }

      // Revoke role from user
      await prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });

      // Log activity
      await userRepository.logActivity(
        userId,
        "ROLE_REVOKED",
        `Role ${role.name} revoked from user`,
        undefined,
        undefined,
        "role",
        roleId
      );

      return { success: true, message: 'Role revoked successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error revoking role from user:', error);
      throw new BadRequestException('Failed to revoke role from user');
    }
  }

  /**
   * Get user roles
   * @param userId User ID
   * @returns List of roles assigned to user
   */
  async getUserRoles(userId: string) {
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Get user roles with permissions
      const userWithRoles = await userRepository.findByIdWithRolesAndPermissions(userId);

      const roles = userWithRoles?.userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        roleType: ur.role.roleType,
        description: ur.role.description,
        permissions: ur.role.rolePermissions.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      })) || [];

      return roles;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error getting user roles:', error);
      throw new BadRequestException('Failed to get user roles');
    }
  }

  /**
   * Get user permissions (flattened from all roles)
   * @param userId User ID
   * @returns List of unique permissions for user
   */
  async getUserPermissions(userId: string) {
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Get user with roles and permissions
      const userWithRoles = await userRepository.findByIdWithRolesAndPermissions(userId);

      // Flatten permissions from all roles and remove duplicates
      const permissionsMap = new Map();

      userWithRoles?.userRoles.forEach((ur: any) => {
        ur.role.rolePermissions.forEach((rp: any) => {
          permissionsMap.set(rp.permission.id, {
            id: rp.permission.id,
            name: rp.permission.name,
            resource: rp.permission.resource,
            action: rp.permission.action,
          });
        });
      });

      return Array.from(permissionsMap.values());
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error getting user permissions:', error);
      throw new BadRequestException('Failed to get user permissions');
    }
  }

  /**
   * Get current authenticated user with full details (for mobile /me endpoint)
   * @param userId User ID from JWT token
   * @returns User with all details including roles and permissions
   */
  async getCurrentUser(userId: string) {
    try {
      const user = await userRepository.findByIdWithRolesAndPermissions(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user is deleted or suspended
      if (user.status === 'DELETED' || user.status === 'SUSPENDED') {
        throw new BadRequestException('User account has been deleted or suspended');
      }

      // Format roles and permissions
      const roles = user.userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        roleType: ur.role.roleType,
        description: ur.role.description,
        permissions: ur.role.rolePermissions.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      }));

      return {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        status: user.status,
        isVerified: user.isVerified,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        platform: user.platform,
        lastLogin: user.lastLogin,
        deviceToken: user.deviceToken,
        selectedLanguage: user.selectedLanguage,
        timezone: user.timezone,
        appVersion: user.appVersion,
        profilePictureUrl: user.profilePictureUrl,
        countryCode: user.countryCode,
        userApplicationData: user.userApplicationData || null,
        roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      logger.error('Error getting current user:', error);
      throw new BadRequestException('Failed to get user profile');
    }
  }

  /**
   * Soft delete user account (for mobile delete-account endpoint)
   * @param userId User ID from JWT token
   * @returns Deletion confirmation
   */
  async deleteAccount(userId: string) {
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user is deleted or suspended
      if (user.status === 'DELETED' || user.status === 'SUSPENDED') {
        throw new BadRequestException('User account has been deleted or suspended');
      }

      // Soft delete by updating status
      await userRepository.setUserStatus(userId, 'DELETED');

      // Revoke all refresh tokens
      const revokedCount = await refreshTokenRepository.revokeAllUserTokens(userId);

      logger.info(`User ${userId} deleted their account. Revoked ${revokedCount} tokens.`);

      return {
        message: 'Account deleted successfully',
        revokedTokens: revokedCount,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      logger.error('Error deleting account:', error);
      throw new BadRequestException('Failed to delete account');
    }
  }

  /**
   * Update user app settings (for mobile update endpoint)
   * @param userId User ID from JWT token
   * @param data Settings to update (deviceToken, selectedLanguage, timezone, appVersion)
   * @returns Updated user settings
   */
  async updateUserSettings(
    userId: string,
    data: {
      deviceToken?: string;
      selectedLanguage?: string;
      timezone?: string;
      appVersion?: string;
    }
  ) {
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user is deleted
      if (user.status === 'DELETED' || user.status === 'SUSPENDED') {
        throw new BadRequestException('Cannot update deleted or suspended account');
      }

      // Update only provided fields
      const updatedUser = await userRepository.updateUser(userId, data);

      return {
        id: updatedUser.id,
        selectedLanguage: updatedUser.selectedLanguage,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      logger.error('Error updating user settings:', error);
      throw new BadRequestException('Failed to update user settings');
    }
  }

  /**
   * Update UserApplicationData (mobile)
   * @param userId User ID from JWT token
   * @param data Partial user application data fields
   * @returns Updated UserApplicationData
   */
  async updateUserApplicationData(
    userId: string,
    data: {
      deviceId?: string;
      deviceModel?: string;
      osName?: string;
      osVersion?: string;
      appPlatform?: string;
      fcmToken?: string;
      timezoneName?: string;
      timezoneOffset?: number;
      appVersion?: string;
      buildNumber?: string;
      lastKnownIpAddress?: string;
      currentIpAddress?: string;
    }
  ) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.status === 'DELETED' || user.status === 'SUSPENDED') {
        throw new BadRequestException('Cannot update deleted or suspended account');
      }

      const updated = await userRepository.upsertUserApplicationData(userId, data as any);

      // Optional: log activity (non-blocking if fails)
      await userRepository.logActivity(
        userId,
        'USER_APPLICATION_DATA_UPDATED',
        'User application data updated',
      );

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      logger.error('Error updating user application data:', error);
      throw new BadRequestException('Failed to update user application data');
    }
  }

  /**
   * Get comprehensive user statistics
   * @returns Detailed user statistics including time-series data for charts
   */
  async getUsersStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    deleted: number;
    verified: number;
    unverified: number;
    withEmail: number;
    withPhone: number;
    withBoth: number;
    byPlatform: Record<string, number>;
    byStatus: Record<string, number>;
    byVerificationStatus: {
      fullyVerified: number;
      emailOnly: number;
      phoneOnly: number;
      notVerified: number;
    };
    socialLogins: {
      google: number;
      apple: number;
      both: number;
      none: number;
    };
    activeUsers: {
      last24Hours: number;
      last7Days: number;
      last30Days: number;
    };
    registrationTrend: Array<{
      date: string;
      count: number;
      verified: number;
      unverified: number;
    }>;
    loginTrend: Array<{
      date: string;
      count: number;
    }>;
    topCountryCodes: Array<{
      id: string;
      country: string;
      code: string;
      userCount: number;
    }>;
    recentUsers: Array<{
      id: string;
      name: string | null;
      email: string | null;
      phoneNumber: string | null;
      status: string;
      isVerified: boolean;
      platform: string | null;
      createdAt: Date;
    }>;
    userDistribution: {
      activeVerified: number;
      activeUnverified: number;
      suspendedVerified: number;
      suspendedUnverified: number;
      deletedVerified: number;
      deletedUnverified: number;
    };
  }> {
    try {
      return await userRepository.getUsersStatistics();
    } catch (error) {
      logger.error('Error getting user statistics:', error);
      throw new BadRequestException('Failed to get user statistics');
    }
  }

  /**
   * Update user profile (name, language, profileUrl)
   * @param userId User ID
   * @param profileData Profile data to update
   * @returns Updated user profile
   */
  async updateUserProfile(
    userId: string,
    profileData: {
      name?: string;
      selectedLanguage?: string;
      profileUrl?: string;
    }
  ) {
    try {
      logger.info(`[UserService] Updating profile for user: ${userId}`);

      // Check if user exists
      const existingUser = await userRepository.findById(userId);
      if (!existingUser) {
        logger.error(`[UserService] User not found: ${userId}`);
        throw new NotFoundException('User not found');
      }

      // Check if user is active
      if (existingUser.status !== UserStatus.ACTIVE) {
        logger.error(`[UserService] User is not active: ${userId}`);
        throw new BadRequestException('User account is not active');
      }

      // Update user profile
      const updatedUser = await userRepository.updateUser(userId, profileData);

      logger.info(`[UserService] Profile updated successfully for user: ${userId}`);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        name: updatedUser.name,
        profileUrl: updatedUser.profileUrl,
        selectedLanguage: updatedUser.selectedLanguage,
        isVerified: updatedUser.isVerified,
        status: updatedUser.status,
        platform: updatedUser.platform,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      logger.error('Error updating user profile:', error);
      throw new BadRequestException('Failed to update user profile');
    }
  }
}
