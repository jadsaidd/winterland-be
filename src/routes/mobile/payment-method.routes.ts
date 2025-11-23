import { Router } from 'express';

import mobilePaymentMethodController from '../../controllers/mobile/payment-method.controller';
import { validate } from '../../middleware/validation.middleware';
import { getMobilePaymentMethodsQuerySchema } from '../../schemas/payment-method.schema';

const router = Router();

/**
 * Get all active payment methods with i18n (no pagination)
 * GET /api/v1/mobile/payment-methods
 * 
 * Public endpoint - no authentication required
 * Supports lang header for i18n (en/ar)
 * Query params:
 *   - includeWallet: 'true' | 'false' (optional, defaults to true)
 * Returns only active payment methods
 */
router.get(
    '/',
    validate(getMobilePaymentMethodsQuerySchema, 'query'),
    mobilePaymentMethodController.getAllPaymentMethods.bind(mobilePaymentMethodController)
);

export default router;