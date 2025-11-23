import { Router } from 'express';

import { DashboardUserController } from '../../controllers/dashboard/user.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createUserSchema, getUsersQuerySchema, updateUserSchema, updateUserStatusSchema, userIdParamSchema, userIdParamSchemaUserId, userRoleParamsSchema } from '../../schemas/user.schema';

const router = Router();
const userController = new DashboardUserController();

router.get(
  '/me',
  authMiddleware,
  userController.getCurrentUser
);

router.get(
  '/stats',
  authMiddleware,
  permissionMiddleware(['users:read']),
  userController.getUsersStats
);

router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['users:read']),
  validate(getUsersQuerySchema, 'query'),
  userController.getAllUsers
);

router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['users:create']),
  validate(createUserSchema),
  userController.createUser
);

router.get(
  '/:id',
  authMiddleware,
  permissionMiddleware(['users:read']),
  validate(userIdParamSchema, 'params'),
  userController.getUserById
);

router.put(
  '/:id',
  authMiddleware,
  permissionMiddleware(['users:update']),
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  userController.updateUser
);

router.delete(
  '/:id',
  authMiddleware,
  permissionMiddleware(['users:delete']),
  validate(userIdParamSchema, 'params'),
  userController.deleteUser
);

router.patch(
  '/:id/status',
  authMiddleware,
  permissionMiddleware(['users:update']),
  validate(userIdParamSchema, 'params'),
  validate(updateUserStatusSchema),
  userController.updateUserStatus
);

router.post(
  '/:userId/roles/:roleId',
  authMiddleware,
  permissionMiddleware(['users:update', 'roles:assign']),
  validate(userRoleParamsSchema, 'params'),
  userController.assignRoleToUser
);

router.delete(
  '/:userId/roles/:roleId',
  authMiddleware,
  permissionMiddleware(['users:update', 'roles:revoke']),
  validate(userRoleParamsSchema, 'params'),
  userController.revokeRoleFromUser
);

router.get(
  '/:userId/roles',
  authMiddleware,
  permissionMiddleware(['users:read']),
  validate(userIdParamSchemaUserId, 'params'),
  userController.getUserRoles
);

router.get(
  '/:userId/permissions',
  authMiddleware,
  permissionMiddleware(['users:read']),
  validate(userIdParamSchemaUserId, 'params'),
  userController.getUserPermissions
);

router.get(
  '/:id/activity',
  authMiddleware,
  permissionMiddleware(['activity_logs:read']),
  validate(userIdParamSchema, 'params'),
  userController.getUserActivityLogs
);

export default router;
