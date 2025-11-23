import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config, logger } from '../config';
import { ForbiddenException, UnauthorizedException } from '../exceptions/http.exception';
import { ITokenPayload } from '../interfaces/user.interface';
import prisma from '../utils/prisma.client';

// Extend Express Request interface to include user and permissions
declare global {
  namespace Express {
    interface Request {
      user?: any;
      permissions?: string[];
    }
  }
}

/**
 * Middleware to authenticate users based on JWT token
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedException('No token provided'));
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify the token
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as ITokenPayload;

      // Find the user
      const user = await (prisma.user as any).findUnique({
        where: { id: decoded.userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              },
            }
          },
        }
      });

      if (!user) {
        return next(new UnauthorizedException('User not found'));
      }

      if (user.status !== 'ACTIVE') {
        return next(new UnauthorizedException('User account is inactive'));
      }

      // Check if account is suspended or deleted
      if (user.status === 'SUSPENDED') {
        return next(new UnauthorizedException('Your account has been suspended. Please contact support.'));
      }

      if (user.status === 'DELETED') {
        return next(new UnauthorizedException('Your account has been deleted.'));
      }

      // Extract permissions from user roles
      const permissions = user.userRoles.flatMap((userRole: any) =>
        userRole.role.rolePermissions.map((rolePermission: any) =>
          `${rolePermission.permission.resource}:${rolePermission.permission.action}`
        )
      );

      req.user = {
        id: user.id,
        phoneNumber: user.phone,
        email: user.email,
        roles: user.userRoles.map((ur: any) => ({
          id: ur.role.id,
          name: ur.role.name
        })),
      };
      req.permissions = permissions;

      // Log user activity
      await (prisma.activityLog as any).create({
        data: {
          userId: user.id,
          action: 'API_ACCESS',
          description: `User accessed ${req.method} ${req.path}`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || 'unknown',
          resourceType: req.path.split('/')[1],
        }
      });

      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return next(new UnauthorizedException('Invalid or expired token'));
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return next(new UnauthorizedException('Authentication failed'));
  }
};

/**
 * Middleware to check if user has required permissions
 * @param requiredPermissions Array of required permissions in format "resource:action"
 */
export const permissionMiddleware = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists in request (should be set by authMiddleware)
      if (!req.user) {
        return next(new UnauthorizedException('User not authenticated'));
      }

      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some(permission =>
        req.permissions?.includes(permission)
      );

      if (!hasPermission) {
        // Log unauthorized access attempt
        (prisma.activityLog as any).create({
          data: {
            userId: req.user.id,
            action: 'UNAUTHORIZED_ACCESS',
            description: `User attempted to access resource without permission: ${requiredPermissions.join(', ')}`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || 'unknown',
            resourceType: req.path.split('/')[1],
          }
        }).catch((err: any) => logger.error('Error logging unauthorized access:', err));

        return next(new ForbiddenException('You do not have permission to access this resource'));
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return next(new ForbiddenException('Permission check failed'));
    }
  };
};

/**
 * Middleware to check if user has specific role
 * @param roles Array of required roles
 */
export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists in request (should be set by authMiddleware)
      if (!req.user) {
        return next(new UnauthorizedException('User not authenticated'));
      }

      // Check if user has at least one of the required roles
      const hasRole = req.user.roles.some((role: { name: string }) =>
        roles.includes(role.name)
      );

      if (!hasRole) {
        // Log unauthorized access attempt
        (prisma.activityLog as any).create({
          data: {
            userId: req.user.id,
            action: 'UNAUTHORIZED_ROLE_ACCESS',
            description: `User attempted to access resource without required role: ${roles.join(', ')}`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || 'unknown',
            resourceType: req.path.split('/')[1],
          }
        }).catch((err: any) => logger.error('Error logging unauthorized role access:', err));

        return next(new ForbiddenException('You do not have the required role to access this resource'));
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      return next(new ForbiddenException('Role check failed'));
    }
  };
};
