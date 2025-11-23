import { Router } from 'express';

import mobileEventController from '../../controllers/mobile/event.controller';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    eventIdentifierParamSchema,
    getAllEventsQuerySchema,
} from '../../schemas/event.schema';

const router = Router();

/**
 * @route   GET /api/v1/mobile/events
 * @desc    Get all active events with pagination and filters
 * @access  Public
 */
router.get(
    '/',
    paginationMiddleware(10, 100),
    validate(getAllEventsQuerySchema, 'query'),
    mobileEventController.getAll
);

/**
 * @route   GET /api/v1/mobile/events/:identifier
 * @desc    Get event by ID or slug with all details
 * @access  Public
 */
router.get(
    '/:identifier',
    validate(eventIdentifierParamSchema, 'params'),
    mobileEventController.getByIdOrSlug
);

export default router;
