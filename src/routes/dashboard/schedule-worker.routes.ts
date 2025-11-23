import { Router } from 'express';

import { dashboardScheduleWorkerController } from '../../controllers/dashboard/schedule-worker.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    createScheduleWorkerSchema,
    getAllScheduleWorkersSchema,
    getWorkersByScheduleSchema,
    removeWorkerFromScheduleSchema,
    scheduleWorkerIdParamSchema,
} from '../../schemas/schedule-worker.schema';

const router = Router();

/**
 * @route   POST /api/v1/dashboard/schedule-workers
 * @desc    Assign a worker to a schedule
 * @access  Protected (schedule-workers:create)
 */
router.post(
    '/',
    authMiddleware,
    permissionMiddleware(['schedule-workers:create']),
    validate(createScheduleWorkerSchema.shape.body, 'body'),
    dashboardScheduleWorkerController.assignWorkerToSchedule
);

/**
 * @route   GET /api/v1/dashboard/schedule-workers
 * @desc    Get all schedule workers with filters and pagination
 * @access  Protected (schedule-workers:read)
 */
router.get(
    '/',
    authMiddleware,
    permissionMiddleware(['schedule-workers:read']),
    paginationMiddleware(10, 100),
    validate(getAllScheduleWorkersSchema.shape.query, 'query'),
    dashboardScheduleWorkerController.getAllScheduleWorkers
);

/**
 * @route   GET /api/v1/dashboard/schedule-workers/statistics
 * @desc    Get schedule workers statistics
 * @access  Protected (schedule-workers:read)
 */
router.get(
    '/statistics',
    authMiddleware,
    permissionMiddleware(['schedule-workers:read']),
    dashboardScheduleWorkerController.getStatistics
);

/**
 * @route   GET /api/v1/dashboard/schedule-workers/:id
 * @desc    Get schedule worker by ID
 * @access  Protected (schedule-workers:read)
 */
router.get(
    '/:id',
    authMiddleware,
    permissionMiddleware(['schedule-workers:read']),
    validate(scheduleWorkerIdParamSchema.shape.params, 'params'),
    dashboardScheduleWorkerController.getScheduleWorkerById
);

/**
 * @route   DELETE /api/v1/dashboard/schedule-workers/:id
 * @desc    Remove worker from schedule by assignment ID
 * @access  Protected (schedule-workers:delete)
 */
router.delete(
    '/:id',
    authMiddleware,
    permissionMiddleware(['schedule-workers:delete']),
    validate(scheduleWorkerIdParamSchema.shape.params, 'params'),
    dashboardScheduleWorkerController.removeWorkerFromSchedule
);

/**
 * Nested routes under schedules
 */

/**
 * @route   GET /api/v1/dashboard/schedules/:scheduleId/workers
 * @desc    Get workers by schedule ID
 * @access  Protected (schedule-workers:read)
 */
router.get(
    '/schedule/:scheduleId',
    authMiddleware,
    permissionMiddleware(['schedule-workers:read']),
    validate(getWorkersByScheduleSchema.shape.params, 'params'),
    dashboardScheduleWorkerController.getWorkersByScheduleId
);

/**
 * @route   DELETE /api/v1/dashboard/schedules/:scheduleId/workers/:userId
 * @desc    Remove worker from schedule by scheduleId and userId
 * @access  Protected (schedule-workers:delete)
 */
router.delete(
    '/schedule/:scheduleId/user/:userId',
    authMiddleware,
    permissionMiddleware(['schedule-workers:delete']),
    validate(removeWorkerFromScheduleSchema.shape.params, 'params'),
    dashboardScheduleWorkerController.removeWorkerByScheduleAndUser
);

export default router;
