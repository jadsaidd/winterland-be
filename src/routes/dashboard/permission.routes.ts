import { Router } from 'express';

import { DashboardPermissionController } from '../../controllers/dashboard/permission.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { assignPermissionSchema, createPermissionSchema, permissionIdParamSchema, revokePermissionSchema, updatePermissionSchema } from '../../schemas/permission.schema';

const router = Router();
const permissionController = new DashboardPermissionController();

router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['permissions:create']),
  validate(createPermissionSchema),
  permissionController.createPermission
);

router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['permissions:read']),
  permissionController.getAllPermissions
);

router.get(
  '/:id',
  authMiddleware,
  permissionMiddleware(['permissions:read']),
  validate(permissionIdParamSchema, 'params'),
  permissionController.getPermissionById
);

router.put(
  '/:id',
  authMiddleware,
  permissionMiddleware(['permissions:update']),
  validate(permissionIdParamSchema, 'params'),
  validate(updatePermissionSchema),
  permissionController.updatePermission
);

router.delete(
  '/:id',
  authMiddleware,
  permissionMiddleware(['permissions:delete']),
  validate(permissionIdParamSchema, 'params'),
  permissionController.deletePermission
);

router.post(
  '/:permissionId/roles/:roleId',
  authMiddleware,
  permissionMiddleware(['permissions:assign']),
  validate(assignPermissionSchema, 'params'),
  permissionController.assignPermissionToRole
);

router.delete(
  '/:permissionId/roles/:roleId',
  authMiddleware,
  permissionMiddleware(['permissions:revoke']),
  validate(revokePermissionSchema, 'params'),
  permissionController.revokePermissionFromRole
);

export default router;
