import { NextFunction, Request, Response } from 'express';

import { UserService } from '../../services/user.service';

const userService = new UserService();

export class DashboardUserController {
  /**
   * Get current authenticated user profile
   * @route GET /dashboard/users/me
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      // User ID comes from authMiddleware (JWT token)
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await userService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * @route GET /users/:id
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users
   * @route GET /users
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as 'ACTIVE' | 'SUSPENDED' | 'DELETED' | undefined;
      const isVerified = req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined;
      const search = req.query.search as string | undefined;
      const guest = req.query.guest === 'true' ? true : req.query.guest === 'false' ? false : undefined;
      const platform = req.query.platform as 'Mobile' | 'Dashboard' | undefined;

      const result = await userService.getAllUsers(page, limit, status, isVerified, search, guest, platform);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user status
   * @route PATCH /users/:id/status
   */
  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await userService.updateUserStatus(id, status);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user activity logs
   * @route GET /users/:id/activity
   */
  async getUserActivityLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await userService.getUserActivityLogs(id, page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new user
   * @route POST /users
   */
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.createUser(req.body);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a user
   * @route PUT /users/:id
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await userService.updateUser(id, req.body);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a user
   * @route DELETE /users/:id
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign role to user
   * @route POST /users/:userId/roles/:roleId
   */
  async assignRoleToUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, roleId } = req.params;
      const result = await userService.assignRoleToUser(userId, roleId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke role from user
   * @route DELETE /users/:userId/roles/:roleId
   */
  async revokeRoleFromUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, roleId } = req.params;
      const result = await userService.revokeRoleFromUser(userId, roleId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user roles
   * @route GET /users/:userId/roles
   */
  async getUserRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await userService.getUserRoles(userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user permissions
   * @route GET /users/:userId/permissions
   */
  async getUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await userService.getUserPermissions(userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comprehensive user statistics
   * @route GET /users/stats
   */
  async getUsersStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.getUsersStats();

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
