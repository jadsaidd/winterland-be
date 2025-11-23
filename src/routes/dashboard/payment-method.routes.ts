import { Router } from 'express';

import dashboardPaymentMethodController from '../../controllers/dashboard/payment-method.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    createPaymentMethodSchema,
    getPaymentMethodsQuerySchema,
    paymentMethodIdParamSchema,
    togglePaymentMethodActiveSchema,
    updatePaymentMethodSchema,
} from '../../schemas/payment-method.schema';

const router = Router();

/**
 * Create a new payment method
 * POST /api/v1/dashboard/payment-methods
 */
router.post(
    '/',
    authMiddleware,
    permissionMiddleware(['payment-methods:create']),
    validate(createPaymentMethodSchema),
    dashboardPaymentMethodController.createPaymentMethod.bind(dashboardPaymentMethodController)
);

/**
 * Get all payment methods with pagination
 * GET /api/v1/dashboard/payment-methods
 */
router.get(
    '/',
    authMiddleware,
    permissionMiddleware(['payment-methods:read']),
    paginationMiddleware(10, 100),
    validate(getPaymentMethodsQuerySchema, 'query'),
    dashboardPaymentMethodController.getAllPaymentMethods.bind(dashboardPaymentMethodController)
);

/**
 * Get payment method by ID
 * GET /api/v1/dashboard/payment-methods/:id
 */
router.get(
    '/:id',
    authMiddleware,
    permissionMiddleware(['payment-methods:read']),
    validate(paymentMethodIdParamSchema, 'params'),
    dashboardPaymentMethodController.getPaymentMethodById.bind(dashboardPaymentMethodController)
);

/**
 * Update payment method
 * PUT /api/v1/dashboard/payment-methods/:id
 */
router.put(
    '/:id',
    authMiddleware,
    permissionMiddleware(['payment-methods:update']),
    validate(paymentMethodIdParamSchema, 'params'),
    validate(updatePaymentMethodSchema),
    dashboardPaymentMethodController.updatePaymentMethod.bind(dashboardPaymentMethodController)
);

/**
 * Toggle payment method active status
 * PATCH /api/v1/dashboard/payment-methods/:id/toggle-active
 */
router.patch(
    '/:id/toggle-active',
    authMiddleware,
    permissionMiddleware(['payment-methods:toggle-active']),
    validate(paymentMethodIdParamSchema, 'params'),
    validate(togglePaymentMethodActiveSchema),
    dashboardPaymentMethodController.togglePaymentMethodActive.bind(dashboardPaymentMethodController)
);

/**
 * Delete payment method
 * DELETE /api/v1/dashboard/payment-methods/:id
 */
router.delete(
    '/:id',
    authMiddleware,
    permissionMiddleware(['payment-methods:delete']),
    validate(paymentMethodIdParamSchema, 'params'),
    dashboardPaymentMethodController.deletePaymentMethod.bind(dashboardPaymentMethodController)
);

export default router;