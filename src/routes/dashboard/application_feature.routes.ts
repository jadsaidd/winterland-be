import { Router } from 'express';

import { DashboardApplicationFeatureController } from '../../controllers/dashboard/application_feature.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import { applicationFeatureIdParamSchema, createApplicationFeatureSchema, updateApplicationFeatureSchema } from '../../schemas/application_feature.schema';

const router = Router();
const controller = new DashboardApplicationFeatureController();

// Get all application features (with pagination and optional status filter)
router.get(
    '/',
    authMiddleware,
    permissionMiddleware(['application-features:read']),
    paginationMiddleware(10, 100),
    controller.getAll
);

// Get application feature by ID
router.get(
    '/:id',
    authMiddleware,
    permissionMiddleware(['application-features:read']),
    validate(applicationFeatureIdParamSchema, 'params'),
    controller.getById
);

// Create a new application feature
router.post(
    '/',
    authMiddleware,
    permissionMiddleware(['application-features:create']),
    validate(createApplicationFeatureSchema),
    controller.create
);

// Update an application feature
router.put(
    '/:id',
    authMiddleware,
    permissionMiddleware(['application-features:update']),
    validate(applicationFeatureIdParamSchema, 'params'),
    validate(updateApplicationFeatureSchema),
    controller.update
);

// Delete an application feature
router.delete(
    '/:id',
    authMiddleware,
    permissionMiddleware(['application-features:delete']),
    validate(applicationFeatureIdParamSchema, 'params'),
    controller.delete
);

export default router;
