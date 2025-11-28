import { Router } from 'express';

import { dashboardLocationController } from '../../controllers/dashboard/location.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    createLocationSchema,
    getLocationsQuerySchema,
    getLocationZonesQuerySchema,
    locationIdentifierParamSchema,
    setZonePricingSchema,
    toggleLocationActiveSchema,
    updateLocationSchema,
} from '../../schemas/location.schema';

const router = Router();

/**
 * Get locations statistics
 * GET /api/v1/dashboard/locations/stats
 */
router.get(
    '/stats',
    authMiddleware,
    permissionMiddleware(['locations:read']),
    dashboardLocationController.getLocationsStats.bind(dashboardLocationController)
);

/**
 * Create a new location
 * POST /api/v1/dashboard/locations
 */
router.post(
    '/',
    authMiddleware,
    permissionMiddleware(['locations:create']),
    validate(createLocationSchema.shape.body as import('zod').ZodTypeAny),
    dashboardLocationController.createLocation.bind(dashboardLocationController)
);

/**
 * Get all locations with pagination
 * GET /api/v1/dashboard/locations
 */
router.get(
    '/',
    authMiddleware,
    permissionMiddleware(['locations:read']),
    paginationMiddleware(10, 100),
    validate(getLocationsQuerySchema.shape.query as import('zod').ZodTypeAny, 'query'),
    dashboardLocationController.getAllLocations.bind(dashboardLocationController)
);

/**
 * Get location by ID or slug
 * GET /api/v1/dashboard/locations/:identifier
 */
router.get(
    '/:identifier',
    authMiddleware,
    permissionMiddleware(['locations:read']),
    validate(locationIdentifierParamSchema.shape.params as import('zod').ZodTypeAny, 'params'),
    dashboardLocationController.getLocationById.bind(dashboardLocationController)
);

/**
 * Get location template by location ID or slug
 * GET /api/v1/dashboard/locations/:identifier/template
 */
router.get(
    '/:identifier/template',
    validate(locationIdentifierParamSchema.shape.params as import('zod').ZodTypeAny, 'params'),
    dashboardLocationController.getLocationTemplate.bind(dashboardLocationController)
);

/**
 * Get location zones with details and optional pricing info
 * GET /api/v1/dashboard/locations/:identifier/zones
 * 
 * Query params:
 * - scheduleId: Filter pricing by specific schedule
 * - eventId: Filter pricing by specific event
 */
router.get(
    '/:identifier/zones',
    // authMiddleware,
    // permissionMiddleware(['locations:read']),
    validate(locationIdentifierParamSchema.shape.params as import('zod').ZodTypeAny, 'params'),
    validate(getLocationZonesQuerySchema.shape.query as import('zod').ZodTypeAny, 'query'),
    dashboardLocationController.getLocationZones.bind(dashboardLocationController)
);

/**
 * Set zone pricing for a location
 * POST /api/v1/dashboard/locations/:identifier/zone-pricing
 * 
 * Creates or updates zone pricing. Uses scheduleId to determine event context.
 */
router.post(
    '/:identifier/zone-pricing',
    authMiddleware,
    // permissionMiddleware(['locations:set-zone-pricing']),
    validate(locationIdentifierParamSchema.shape.params as import('zod').ZodTypeAny, 'params'),
    validate(setZonePricingSchema.shape.body as import('zod').ZodTypeAny),
    dashboardLocationController.setZonePricing.bind(dashboardLocationController)
);

/**
 * Update location
 * PUT /api/v1/dashboard/locations/:identifier
 */
router.put(
    '/:identifier',
    authMiddleware,
    permissionMiddleware(['locations:update']),
    validate(updateLocationSchema.shape.body as import('zod').ZodTypeAny),
    dashboardLocationController.updateLocation.bind(dashboardLocationController)
);

/**
 * Toggle location active status
 * PATCH /api/v1/dashboard/locations/:identifier/toggle-active
 */
router.patch(
    '/:identifier/toggle-active',
    authMiddleware,
    permissionMiddleware(['locations:toggle-active']),
    validate(toggleLocationActiveSchema.shape.body as import('zod').ZodTypeAny),
    dashboardLocationController.toggleLocationActive.bind(dashboardLocationController)
);

/**
 * Delete location
 * DELETE /api/v1/dashboard/locations/:identifier
 */
router.delete(
    '/:identifier',
    authMiddleware,
    permissionMiddleware(['locations:delete']),
    validate(locationIdentifierParamSchema.shape.params as import('zod').ZodTypeAny, 'params'),
    dashboardLocationController.deleteLocation.bind(dashboardLocationController)
);

export default router;
