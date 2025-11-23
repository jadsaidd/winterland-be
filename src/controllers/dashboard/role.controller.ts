import { NextFunction, Request, Response } from 'express';

import { RoleService } from '../../services/role.service';

const roleService = new RoleService();

export class DashboardRoleController {
  /**
   * Create a new role
   * @route POST /roles
   */
  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.createRole(req.body);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role by ID
   * @route GET /roles/:id
   */
  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await roleService.getRoleById(id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a role
   * @route PUT /roles/:id
   */
  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await roleService.updateRole(id, req.body);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all roles
   * @route GET /roles
   */
  async getAllRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const roleType = req.query.type as 'WORKER' | 'CUSTOMER' | undefined;

      const result = await roleService.getAllRoles(page, limit, search, roleType);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a role
   * @route DELETE /roles/:id
   */
  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await roleService.deleteRole(id);

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
   * @route POST /roles/assign
   */
  async assignRoleToUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.assignRoleToUser(req.body);

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
   * @route POST /roles/revoke
   */
  async revokeRoleFromUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.revokeRoleFromUser(req.body);

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
   * @route GET /roles/user/:userId
   */
  async getUserRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await roleService.getUserRoles(userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
