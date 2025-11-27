import { Router } from 'express';

import { dashboardSupportTicketController } from '../../controllers/dashboard/support-ticket.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    supportTicketIdParamSchema,
    supportTicketQuerySchema,
    updateSupportTicketStatusSchema,
} from '../../schemas/support-ticket.schema';

const router = Router();

/**
 * GET /api/v1/dashboard/support-tickets
 * Get all support tickets with pagination and filters
 */
router.get(
    '/',
    authMiddleware,
    permissionMiddleware(['support-tickets:read']),
    paginationMiddleware(10, 100),
    validate(supportTicketQuerySchema, 'query'),
    dashboardSupportTicketController.getAll
);

/**
 * GET /api/v1/dashboard/support-tickets/:id
 * Get a single support ticket by ID
 */
router.get(
    '/:id',
    authMiddleware,
    permissionMiddleware(['support-tickets:read']),
    validate(supportTicketIdParamSchema, 'params'),
    dashboardSupportTicketController.getById
);

/**
 * PATCH /api/v1/dashboard/support-tickets/:id/status
 * Update support ticket status
 */
router.patch(
    '/:id/status',
    authMiddleware,
    permissionMiddleware(['support-tickets:update']),
    validate(supportTicketIdParamSchema, 'params'),
    validate(updateSupportTicketStatusSchema),
    dashboardSupportTicketController.updateStatus
);

/**
 * DELETE /api/v1/dashboard/support-tickets/:id
 * Delete a support ticket
 */
router.delete(
    '/:id',
    authMiddleware,
    permissionMiddleware(['support-tickets:delete']),
    validate(supportTicketIdParamSchema, 'params'),
    dashboardSupportTicketController.delete
);

export default router;
