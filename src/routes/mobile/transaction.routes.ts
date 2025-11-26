import { Router } from 'express';

import { MobileTransactionController } from '../../controllers/mobile/transaction.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import { transactionIdParamSchema, transactionStatusQuerySchema } from '../../schemas/transaction.schema';

const router = Router();
const transactionController = new MobileTransactionController();

/**
 * @route   GET /mobile/transactions
 * @desc    Get all transactions for authenticated user
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    paginationMiddleware(10, 100),
    validate(transactionStatusQuerySchema, 'query'),
    transactionController.getUserTransactions
);

/**
 * @route   GET /mobile/transactions/:id
 * @desc    Get transaction by ID with all details
 * @access  Private
 */
router.get(
    '/:id',
    authMiddleware,
    validate(transactionIdParamSchema, 'params'),
    transactionController.getTransactionById
);

/**
 * @route   PATCH /mobile/transactions/:id/complete
 * @desc    Mark cash transaction as completed
 * @access  Private
 */
router.patch(
    '/:id/complete',
    authMiddleware,
    validate(transactionIdParamSchema, 'params'),
    transactionController.markAsCompleted
);

/**
 * @route   PATCH /mobile/transactions/:id/cancel
 * @desc    Cancel a pending transaction
 * @access  Private
 */
router.patch(
    '/:id/cancel',
    authMiddleware,
    validate(transactionIdParamSchema, 'params'),
    transactionController.cancelTransaction
);

export default router;
