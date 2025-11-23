import { Router } from 'express';

import mobileCategoryController from '../../controllers/mobile/category.controller';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    categoryIdentifierParamSchema,
    getCategoriesQuerySchema,
} from '../../schemas/category.schema';

const router = Router();

/**
 * Get all active categories with pagination and i18n
 * GET /api/v1/mobile/categories
 * 
 * Public endpoint - no authentication required
 * Supports lang header for i18n (en/ar)
 */
router.get(
    '/',
    paginationMiddleware(10, 100),
    validate(getCategoriesQuerySchema, 'query'),
    mobileCategoryController.getAllCategories.bind(mobileCategoryController)
);

/**
 * Get category by ID or slug with i18n
 * GET /api/v1/mobile/categories/:identifier
 * 
 * Public endpoint - no authentication required
 * Supports lang header for i18n (en/ar)
 * Only returns active categories
 */
router.get(
    '/:identifier',
    validate(categoryIdentifierParamSchema, 'params'),
    mobileCategoryController.getCategoryById.bind(mobileCategoryController)
);

export default router;
