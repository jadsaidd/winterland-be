import { Router } from 'express';

import dashboardCategoryController from '../../controllers/dashboard/category.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    categoryIdentifierParamSchema,
    createCategorySchema,
    getCategoriesQuerySchema,
    toggleCategoryActiveSchema,
    updateCategorySchema,
} from '../../schemas/category.schema';

const router = Router();

/**
 * Get categories statistics
 * GET /api/v1/dashboard/categories/stats
 */
router.get(
    '/stats',
    authMiddleware,
    permissionMiddleware(['categories:read']),
    dashboardCategoryController.getCategoriesStats.bind(dashboardCategoryController)
);

/**
 * Create a new category
 * POST /api/v1/dashboard/categories
 */
router.post(
    '/',
    authMiddleware,
    permissionMiddleware(['categories:create']),
    validate(createCategorySchema),
    dashboardCategoryController.createCategory.bind(dashboardCategoryController)
);

/**
 * Get all categories with pagination
 * GET /api/v1/dashboard/categories
 */
router.get(
    '/',
    authMiddleware,
    permissionMiddleware(['categories:read']),
    paginationMiddleware(10, 100),
    validate(getCategoriesQuerySchema, 'query'),
    dashboardCategoryController.getAllCategories.bind(dashboardCategoryController)
);

/**
 * Get category by ID or slug
 * GET /api/v1/dashboard/categories/:identifier
 */
router.get(
    '/:identifier',
    authMiddleware,
    permissionMiddleware(['categories:read']),
    validate(categoryIdentifierParamSchema, 'params'),
    dashboardCategoryController.getCategoryById.bind(dashboardCategoryController)
);

/**
 * Update category
 * PUT /api/v1/dashboard/categories/:identifier
 */
router.put(
    '/:identifier',
    authMiddleware,
    permissionMiddleware(['categories:update']),
    validate(categoryIdentifierParamSchema, 'params'),
    validate(updateCategorySchema),
    dashboardCategoryController.updateCategory.bind(dashboardCategoryController)
);

/**
 * Toggle category active status
 * PATCH /api/v1/dashboard/categories/:identifier/toggle-active
 */
router.patch(
    '/:identifier/toggle-active',
    authMiddleware,
    permissionMiddleware(['categories:toggle-active']),
    validate(categoryIdentifierParamSchema, 'params'),
    validate(toggleCategoryActiveSchema),
    dashboardCategoryController.toggleCategoryActive.bind(dashboardCategoryController)
);

/**
 * Delete category
 * DELETE /api/v1/dashboard/categories/:identifier
 */
router.delete(
    '/:identifier',
    authMiddleware,
    permissionMiddleware(['categories:delete']),
    validate(categoryIdentifierParamSchema, 'params'),
    dashboardCategoryController.deleteCategory.bind(dashboardCategoryController)
);

export default router;
