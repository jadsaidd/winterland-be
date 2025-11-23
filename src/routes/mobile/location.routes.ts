import { Router } from 'express';

import { mobileLocationController } from '../../controllers/mobile/location.controller';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    getLocationsQuerySchema,
    locationIdentifierParamSchema,
} from '../../schemas/location.schema';

const router = Router();

/**
 * Get all active locations with pagination and i18n
 * GET /api/v1/mobile/locations
 * 
 * Public endpoint - no authentication required
 * Supports lang header for i18n (en/ar)
 * Query params: type (filter by location type), search (search in name/description)
 */

router.get(
    '/',
    paginationMiddleware(10, 100),
    validate(getLocationsQuerySchema.shape.query as import('zod').ZodTypeAny, 'query'),
    mobileLocationController.getAllLocations.bind(mobileLocationController)
);

/**
 * Get location by ID or slug with i18n
 * GET /api/v1/mobile/locations/:identifier
 * 
 * Public endpoint - no authentication required
 * Supports lang header for i18n (en/ar)
 * Only returns active locations
 */

router.get(
    '/:identifier',
    validate(locationIdentifierParamSchema.shape.params as import('zod').ZodTypeAny, 'params'),
    mobileLocationController.getLocationById.bind(mobileLocationController)
);

export default router;
