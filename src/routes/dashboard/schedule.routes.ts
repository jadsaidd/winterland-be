import { Router } from 'express';

import { dashboardScheduleController } from '../../controllers/dashboard/schedule.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    createScheduleSchema,
    getAllSchedulesSchema,
    scheduleIdParamSchema,
    updateScheduleSchema,
} from '../../schemas/schedule.schema';

const router = Router();

/**
 * @route   POST /api/v1/dashboard/schedules
 * @desc    Create a new schedule
 * @access  Protected (schedules:create)
 */
router.post(
    '/',
    authMiddleware,
    permissionMiddleware(['schedules:create']),
    validate(createScheduleSchema),
    dashboardScheduleController.createSchedule
);

/**
 * @route   GET /api/v1/dashboard/schedules
 * @desc    Get all schedules with filters and pagination
 * @access  Protected (schedules:read)
 */
router.get(
    '/',
    authMiddleware,
    permissionMiddleware(['schedules:read']),
    paginationMiddleware(10, 100),
    validate(getAllSchedulesSchema, 'query'),
    dashboardScheduleController.getAllSchedules
);

/**
 * @route   GET /api/v1/dashboard/schedules/statistics
 * @desc    Get schedules statistics
 * @access  Protected (schedules:read)
 */
router.get(
    '/statistics',
    authMiddleware,
    permissionMiddleware(['schedules:read']),
    dashboardScheduleController.getStatistics
);

/**
 * @route   GET /api/v1/dashboard/schedules/event/:eventId
 * @desc    Get schedules by event ID
 * @access  Protected (schedules:read)
 */
router.get(
    '/event/:eventId',
    authMiddleware,
    permissionMiddleware(['schedules:read']),
    dashboardScheduleController.getSchedulesByEventId
);

/**
 * @route   GET /api/v1/dashboard/schedules/:id
 * @desc    Get schedule by ID
 * @access  Protected (schedules:read)
 */
router.get(
    '/:id',
    authMiddleware,
    permissionMiddleware(['schedules:read']),
    validate(scheduleIdParamSchema, 'params'),
    dashboardScheduleController.getScheduleById
);

/**
 * @route   PUT /api/v1/dashboard/schedules/:id
 * @desc    Update schedule
 * @access  Protected (schedules:update)
 */
router.put(
    '/:id',
    authMiddleware,
    permissionMiddleware(['schedules:update']),
    validate(scheduleIdParamSchema, 'params'),
    validate(updateScheduleSchema),
    dashboardScheduleController.updateSchedule
);

/**
 * @route   DELETE /api/v1/dashboard/schedules/:id
 * @desc    Delete schedule
 * @access  Protected (schedules:delete)
 */
router.delete(
    '/:id',
    authMiddleware,
    permissionMiddleware(['schedules:delete']),
    validate(scheduleIdParamSchema, 'params'),
    dashboardScheduleController.deleteSchedule
);

export default router;
