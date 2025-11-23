import { NextFunction, Request, Response } from 'express';

import { PermissionService } from '../../services/permission.service';

const permissionService = new PermissionService();

export class DashboardPermissionController {
  /**
   * Create a new permission
   * @route POST /permissions
   */
  async createPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.createPermission(req.body);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permission by ID
   * @route GET /permissions/:id
   */
  async getPermissionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await permissionService.getPermissionById(id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a permission
   * @route PUT /permissions/:id
   */
  async updatePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await permissionService.updatePermission(id, req.body);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all permissions
   * @route GET /permissions
   */
  async getAllPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await permissionService.getAllPermissions(page, limit);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a permission
   * @route DELETE /permissions/:id
   */
  async deletePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await permissionService.deletePermission(id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign permission to role
   * @route POST /permissions/:permissionId/roles/:roleId
   */
  async assignPermissionToRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissionId, roleId } = req.params;
      const result = await permissionService.assignPermissionToRole({ permissionId, roleId });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke permission from role
   * @route DELETE /permissions/:permissionId/roles/:roleId
   */
  async revokePermissionFromRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissionId, roleId } = req.params;
      const result = await permissionService.revokePermissionFromRole({ permissionId, roleId });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role permissions
   * @route GET /permissions/role/:roleId
   */
  async getRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { roleId } = req.params;
      const result = await permissionService.getRolePermissions(roleId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
