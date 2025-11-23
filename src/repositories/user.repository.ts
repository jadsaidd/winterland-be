import { User, UserApplicationData } from '@prisma/client';

import { logger } from '../config';
import { RegisterUserDto } from '../dtos/request/auth.request.dto';
import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import prisma from '../utils/prisma.client';

export class UserRepository {
  /**
   * Create a new user
   * @param userData User data to create
   * @returns Created user
   */
  async createUser(userData: RegisterUserDto): Promise<User> {
    try {
      return await prisma.user.create({
        data: userData,
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by phone number
   * @param phoneNumber User phone number
   * @returns User if found, null otherwise
   */
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        phoneNumber,
      },
      include: {
        countryCode: true,
      },
    });
  }

  /**
   * Find user by ID

  /**
   * Find user by ID
   * @param id User ID
   * @returns User if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Error finding user by id:', error);
      throw error;
    }
  }

  /**
   * Find user by device ID
   * @param deviceId Device ID from UserApplicationData
   * @returns User if found, null otherwise
   */
  async findByDeviceId(deviceId: string): Promise<any | null> {
    try {
      const userApplicationData = await prisma.userApplicationData.findFirst({
        where: { deviceId },
        include: { user: true },
      });

      if (!userApplicationData) {
        return null;
      }

      // Return user with application data attached
      return {
        ...userApplicationData.user,
        userApplicationData,
      };
    } catch (error) {
      logger.error('Error finding user by device id:', error);
      throw error;
    }
  }

  /**
   * Find user by ID with roles and permissions
   * @param id User ID
   * @returns User with roles and permissions if found, null otherwise
   */
  async findByIdWithRolesAndPermissions(id: string): Promise<any | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          countryCode: true,
          userApplicationData: true,
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error finding user with roles and permissions:', error);
      throw error;
    }
  }

  /**
   * Update a user
   * @param id User ID
   * @param userData User data to update
   * @returns Updated user
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: userData,
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
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
  ): Promise<PaginatedResponse<User>> {
    try {
      const skip = (page - 1) * limit;
      let whereClause: any = {};

      // Apply optional filters
      if (status) {
        whereClause.status = status;
      }
      if (isVerified !== undefined) {
        whereClause.isVerified = isVerified;
      }

      // Apply search filter
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          where: whereClause,
          include: {
            countryCode: true,
          },
        }),
        prisma.user.count({
          where: whereClause,
        }),
      ]);

      return createPaginatedResponse(users, total, page, limit);
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Record failed login attempt
   * @param userId User ID
   * @returns Updated user
   */
  async recordFailedLoginAttempt(userId: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      logger.error('Error recording failed login attempt:', error);
      throw error;
    }
  }

  /**
   * Lock user account
   * @param userId User ID
   * @param lockUntil Date until account is locked
   * @returns Updated user
   */
  async lockAccount(userId: string, lockUntil: Date): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: lockUntil,
        },
      });
    } catch (error) {
      logger.error('Error locking user account:', error);
      throw error;
    }
  }

  /**
   * Reset failed login attempts
   * @param userId User ID
   * @returns Updated user
   */
  async resetFailedLoginAttempts(userId: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    } catch (error) {
      logger.error('Error resetting failed login attempts:', error);
      throw error;
    }
  }

  /**
   * Record successful login
   * @param userId User ID
   * @returns Updated user
   */
  async recordSuccessfulLogin(userId: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          lastLogin: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    } catch (error) {
      logger.error('Error recording successful login:', error);
      throw error;
    }
  }

  /**
   * Set user status
   * @param userId User ID
   * @param status User status (ACTIVE, SUSPENDED, DELETED)
   * @returns Updated user
   */
  async setUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          status,
        },
      });
    } catch (error) {
      logger.error('Error setting user status:', error);
      throw error;
    }
  }

  /**
   * Get user activity logs with pagination
   * @param userId User ID
   * @param page Page number
   * @param limit Items per page
   * @returns Paginated list of activity logs
   */
  async getUserActivityLogs(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<any>> {
    try {
      const skip = (page - 1) * limit;

      const [activityLogs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.activityLog.count({
          where: { userId },
        }),
      ]);

      return createPaginatedResponse(activityLogs, total, page, limit);
    } catch (error) {
      logger.error('Error getting user activity logs:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param email User email
   * @returns User if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by Google ID
   * @param googleId Google ID
   * @returns User if found, null otherwise
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { googleId },
      });
    } catch (error) {
      logger.error('Error finding user by Google ID:', error);
      throw error;
    }
  }

  /**
   * Find user by Apple ID
   * @param appleId Apple ID
   * @returns User if found, null otherwise
   */
  async findByAppleId(appleId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { appleId },
      });
    } catch (error) {
      logger.error('Error finding user by Apple ID:', error);
      throw error;
    }
  }

  /**
   * Get UserApplicationData by userId
   * @param userId User ID
   * @returns UserApplicationData if found, null otherwise
   */
  async getUserApplicationData(userId: string): Promise<UserApplicationData | null> {
    return prisma.userApplicationData.findUnique({
      where: { userId },
    });
  }

  /**
   * Upsert UserApplicationData for a user
   * @param userId User ID
   * @param data Partial application data fields to update
   * @returns Upserted UserApplicationData
   */
  async upsertUserApplicationData(
    userId: string,
    data: Partial<UserApplicationData>
  ): Promise<UserApplicationData> {
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );

    return prisma.userApplicationData.upsert({
      where: { userId },
      update: {
        ...(updateData as any),
      },
      create: {
        userId,
        ...(updateData as any),
      },
    });
  }

  /**
   * Validate phone number length against country code
   * @param phoneNumber Phone number
   * @param countryCodeId Country code ID
   * @returns True if valid, false otherwise
   */
  async validatePhoneNumberLength(phoneNumber: string, countryCodeId: string): Promise<boolean> {
    try {
      const countryCode = await prisma.countryCode.findUnique({
        where: { id: countryCodeId },
      });

      if (!countryCode) {
        return false;
      }

      // Remove any non-digit characters for validation
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      return digitsOnly.length === countryCode.digits;
    } catch (error) {
      logger.error('Error validating phone number length:', error);
      throw error;
    }
  }

  /**
   * Get country code by ID
   * @param id Country code ID
   * @returns Country code if found, null otherwise
   */
  async getCountryCodeById(id: string): Promise<any | null> {
    try {
      return await prisma.countryCode.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Error getting country code:', error);
      throw error;
    }
  }

  /**
   * Log user activity
   * @param userId User ID
   * @param action Action performed
   * @param description Description of the action
   * @param ipAddress IP address of the user
   * @param userAgent User agent of the user
   * @returns Created activity log
   */
  async logActivity(
    userId: string,
    action: string,
    description: string,
    ipAddress?: string,
    userAgent?: string,
    resourceType?: string,
    resourceId?: string
  ) {
    try {
      return await prisma.activityLog.create({
        data: {
          userId,
          action,
          description,
          ipAddress,
          userAgent,
          resourceType,
          resourceId,
        },
      });
    } catch (error) {
      logger.error('Error logging activity:', error);
      // Don't throw error for logging failures to avoid disrupting main functionality
      return null;
    }
  }

  /**
   * Get comprehensive user statistics
   * @returns Detailed user statistics including counts, distributions, and time-series data
   */
  async getUsersStatistics(): Promise<{
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
      // Get current date and date ranges for trends
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Basic counts
      const [
        total,
        active,
        suspended,
        deleted,
        verified,
        unverified,
        withEmail,
        withPhone,
        withBoth,
        googleUsers,
        appleUsers,
        bothSocial,
        activeIn24Hours,
        activeIn7Days,
        activeIn30Days,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { status: 'SUSPENDED' } }),
        prisma.user.count({ where: { status: 'DELETED' } }),
        prisma.user.count({ where: { isVerified: true } }),
        prisma.user.count({ where: { isVerified: false } }),
        prisma.user.count({ where: { email: { not: null } } }),
        prisma.user.count({ where: { phoneNumber: { not: null } } }),
        prisma.user.count({ where: { AND: [{ email: { not: null } }, { phoneNumber: { not: null } }] } }),
        prisma.user.count({ where: { googleId: { not: null } } }),
        prisma.user.count({ where: { appleId: { not: null } } }),
        prisma.user.count({ where: { AND: [{ googleId: { not: null } }, { appleId: { not: null } }] } }),
        prisma.user.count({ where: { lastLogin: { gte: last24Hours } } }),
        prisma.user.count({ where: { lastLogin: { gte: last7Days } } }),
        prisma.user.count({ where: { lastLogin: { gte: last30Days } } }),
      ]);

      // Platform distribution
      const platformCounts = await prisma.user.groupBy({
        by: ['platform'],
        _count: true,
      });
      const byPlatform: Record<string, number> = {};
      platformCounts.forEach((item: { platform: string | null; _count: number }) => {
        byPlatform[item.platform || 'Unknown'] = item._count;
      });

      // Status distribution
      const statusCounts = await prisma.user.groupBy({
        by: ['status'],
        _count: true,
      });
      const byStatus: Record<string, number> = {};
      statusCounts.forEach((item: { status: string; _count: number }) => {
        byStatus[item.status] = item._count;
      });

      // Verification status breakdown
      const [fullyVerified, emailOnly, phoneOnly, notVerified] = await Promise.all([
        prisma.user.count({ where: { AND: [{ isEmailVerified: true }, { isPhoneVerified: true }] } }),
        prisma.user.count({ where: { AND: [{ isEmailVerified: true }, { isPhoneVerified: false }] } }),
        prisma.user.count({ where: { AND: [{ isEmailVerified: false }, { isPhoneVerified: true }] } }),
        prisma.user.count({ where: { AND: [{ isEmailVerified: false }, { isPhoneVerified: false }] } }),
      ]);

      // Social login stats
      const noSocialLogins = total - googleUsers - appleUsers + bothSocial;

      // User distribution by status and verification
      const [
        activeVerified,
        activeUnverified,
        suspendedVerified,
        suspendedUnverified,
        deletedVerified,
        deletedUnverified,
      ] = await Promise.all([
        prisma.user.count({ where: { status: 'ACTIVE', isVerified: true } }),
        prisma.user.count({ where: { status: 'ACTIVE', isVerified: false } }),
        prisma.user.count({ where: { status: 'SUSPENDED', isVerified: true } }),
        prisma.user.count({ where: { status: 'SUSPENDED', isVerified: false } }),
        prisma.user.count({ where: { status: 'DELETED', isVerified: true } }),
        prisma.user.count({ where: { status: 'DELETED', isVerified: false } }),
      ]);

      // Registration trend for last 90 days (daily)
      const registrations = await prisma.$queryRaw<
        Array<{ date: string; count: bigint; verified: bigint; unverified: bigint }>
      >`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE "isVerified" = true) as verified,
          COUNT(*) FILTER (WHERE "isVerified" = false) as unverified
        FROM users
        WHERE "createdAt" >= ${last90Days}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      `;

      const registrationTrend = registrations.map((item: { date: string; count: bigint; verified: bigint; unverified: bigint }) => ({
        date: item.date,
        count: Number(item.count),
        verified: Number(item.verified),
        unverified: Number(item.unverified),
      }));

      // Login trend for last 90 days (daily)
      const logins = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT 
          DATE("lastLogin") as date,
          COUNT(DISTINCT id) as count
        FROM users
        WHERE "lastLogin" >= ${last90Days}
          AND "lastLogin" IS NOT NULL
        GROUP BY DATE("lastLogin")
        ORDER BY date DESC
      `;

      const loginTrend = logins.map((item: { date: string; count: bigint }) => ({
        date: item.date,
        count: Number(item.count),
      }));

      // Top country codes
      const topCountries = await prisma.countryCode.findMany({
        select: {
          id: true,
          country: true,
          code: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        where: {
          users: {
            some: {},
          },
        },
        orderBy: {
          users: {
            _count: 'desc',
          },
        },
        take: 10,
      });

      const topCountryCodes = topCountries.map((country: { id: string; country: string; code: string; _count: { users: number } }) => ({
        id: country.id,
        country: country.country,
        code: country.code,
        userCount: country._count.users,
      }));

      // Recent users (last 10)
      const recentUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          status: true,
          isVerified: true,
          platform: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      return {
        total,
        active,
        suspended,
        deleted,
        verified,
        unverified,
        withEmail,
        withPhone,
        withBoth,
        byPlatform,
        byStatus,
        byVerificationStatus: {
          fullyVerified,
          emailOnly,
          phoneOnly,
          notVerified,
        },
        socialLogins: {
          google: googleUsers,
          apple: appleUsers,
          both: bothSocial,
          none: noSocialLogins,
        },
        activeUsers: {
          last24Hours: activeIn24Hours,
          last7Days: activeIn7Days,
          last30Days: activeIn30Days,
        },
        registrationTrend,
        loginTrend,
        topCountryCodes,
        recentUsers,
        userDistribution: {
          activeVerified,
          activeUnverified,
          suspendedVerified,
          suspendedUnverified,
          deletedVerified,
          deletedUnverified,
        },
      };
    } catch (error) {
      logger.error('Error getting user statistics:', error);
      throw error;
    }
  }
}
