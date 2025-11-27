import { Router } from 'express';

import { sharedSupportTicketController } from '../../controllers/shared/support-ticket.controller';
import { validate } from '../../middleware/validation.middleware';
import { createSupportTicketSchema } from '../../schemas/support-ticket.schema';

const router = Router();

/**
 * POST /api/v1/shared/support-tickets
 * Create a new support ticket (public endpoint)
 */
router.post(
    '/',
    validate(createSupportTicketSchema),
    sharedSupportTicketController.create
);

export default router;
