import { Router } from 'express';

import dashboardEventController from '../../controllers/dashboard/event.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    createEventSchema,
    eventIdentifierParamSchema,
    eventIdParamSchema,
    getAllEventsQuerySchema,
    manageEventCategoriesSchema,
    manageEventLocationsSchema,
    toggleEventActiveSchema,
    updateEventSchema,
} from '../../schemas/event.schema';

const router = Router();

/**
 * @route   POST /api/v1/dashboard/events
 * @desc    Create a new event
 * @access  Private (requires events:create permission)
 */
router.post(
    '/',
    authMiddleware,
    permissionMiddleware(['events:create']),
    validate(createEventSchema),
    dashboardEventController.create
);

/**
 * @route   GET /api/v1/dashboard/events
 * @desc    Get all events with pagination and filters
 * @access  Private (requires events:read permission)
 */
router.get(
    '/',
    authMiddleware,
    permissionMiddleware(['events:read']),
    paginationMiddleware(10, 100),
    validate(getAllEventsQuerySchema, 'query'),
    dashboardEventController.getAll
);

/**
 * @route   GET /api/v1/dashboard/events/statistics/summary
 * @desc    Get event statistics
 * @access  Private (requires events:read permission)
 */
router.get(
    '/statistics/summary',
    authMiddleware,
    permissionMiddleware(['events:read']),
    dashboardEventController.getStatistics
);

/**
 * @route   GET /api/v1/dashboard/events/:identifier
 * @desc    Get event by ID or slug
 * @access  Private (requires events:read permission)
 */
router.get(
    '/:identifier',
    authMiddleware,
    permissionMiddleware(['events:read']),
    validate(eventIdentifierParamSchema, 'params'),
    dashboardEventController.getByIdOrSlug
);

/**
 * @route   PUT /api/v1/dashboard/events/:id
 * @desc    Update event
 * @access  Private (requires events:update permission)
 */
router.put(
    '/:id',
    authMiddleware,
    permissionMiddleware(['events:update']),
    validate(eventIdParamSchema, 'params'),
    validate(updateEventSchema),
    dashboardEventController.update
);

/**
 * @route   PATCH /api/v1/dashboard/events/:id/toggle-active
 * @desc    Toggle event active status
 * @access  Private (requires events:toggle-active permission)
 */
router.patch(
    '/:id/toggle-active',
    authMiddleware,
    permissionMiddleware(['events:toggle-active']),
    validate(eventIdParamSchema, 'params'),
    validate(toggleEventActiveSchema),
    dashboardEventController.toggleActive
);

/**
 * @route   DELETE /api/v1/dashboard/events/:id
 * @desc    Delete event
 * @access  Private (requires events:delete permission)
 */
router.delete(
    '/:id',
    authMiddleware,
    permissionMiddleware(['events:delete']),
    validate(eventIdParamSchema, 'params'),
    dashboardEventController.delete
);

/**
 * @route   POST /api/v1/dashboard/events/:id/categories
 * @desc    Add categories to event
 * @access  Private (requires events:update permission)
 */
router.post(
    '/:id/categories',
    authMiddleware,
    permissionMiddleware(['events:update']),
    validate(eventIdParamSchema, 'params'),
    validate(manageEventCategoriesSchema),
    dashboardEventController.addCategories
);

/**
 * @route   DELETE /api/v1/dashboard/events/:id/categories
 * @desc    Remove categories from event
 * @access  Private (requires events:update permission)
 */
router.delete(
    '/:id/categories',
    authMiddleware,
    permissionMiddleware(['events:update']),
    validate(eventIdParamSchema, 'params'),
    validate(manageEventCategoriesSchema),
    dashboardEventController.removeCategories
);

/**
 * @route   POST /api/v1/dashboard/events/:id/locations
 * @desc    Add locations to event
 * @access  Private (requires events:update permission)
 */
router.post(
    '/:id/locations',
    authMiddleware,
    permissionMiddleware(['events:update']),
    validate(eventIdParamSchema, 'params'),
    validate(manageEventLocationsSchema),
    dashboardEventController.addLocations
);

/**
 * @route   DELETE /api/v1/dashboard/events/:id/locations
 * @desc    Remove locations from event
 * @access  Private (requires events:update permission)
 */
router.delete(
    '/:id/locations',
    authMiddleware,
    permissionMiddleware(['events:update']),
    validate(eventIdParamSchema, 'params'),
    validate(manageEventLocationsSchema),
    dashboardEventController.removeLocations
);

export default router;
