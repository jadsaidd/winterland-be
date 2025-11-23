import { Router } from 'express';

import { DashboardRoleController } from '../../controllers/dashboard/role.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createRoleSchema, getRolesQuerySchema, roleIdParamSchema, updateRoleSchema } from '../../schemas/role.schema';

const router = Router();
const roleController = new DashboardRoleController();

router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['roles:create']),
  validate(createRoleSchema),
  roleController.createRole
);

router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['roles:read']),
  validate(getRolesQuerySchema, 'query'),
  roleController.getAllRoles
);

router.get(
  '/:id',
  authMiddleware,
  permissionMiddleware(['roles:read']),
  validate(roleIdParamSchema, 'params'),
  roleController.getRoleById
);

router.put(
  '/:id',
  authMiddleware,
  permissionMiddleware(['roles:update']),
  validate(roleIdParamSchema, 'params'),
  validate(updateRoleSchema),
  roleController.updateRole
);

router.delete(
  '/:id',
  authMiddleware,
  permissionMiddleware(['roles:delete']),
  validate(roleIdParamSchema, 'params'),
  roleController.deleteRole
);

export default router;
