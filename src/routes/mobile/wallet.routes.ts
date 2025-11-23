import { Router } from 'express';

import { MobileWalletController } from '../../controllers/mobile/wallet.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import { transactionStatusQuerySchema, walletIdParamSchema, walletTopUpSchema } from '../../schemas/transaction.schema';

const router = Router();
const walletController = new MobileWalletController();

/**
 * @route   GET /mobile/wallet
 * @desc    Get user's wallet
 * @access  Private
 */
router.get(
    '/',
    authMiddleware,
    walletController.getWallet
);

/**
 * @route   GET /mobile/wallet/all
 * @desc    Get all user wallets
 * @access  Private
 */
router.get(
    '/all',
    authMiddleware,
    walletController.getAllWallets
);

/**
 * @route   POST /mobile/wallet/top-up
 * @desc    Top-up user wallet
 * @access  Private
 */
router.post(
    '/top-up',
    authMiddleware,
    validate(walletTopUpSchema),
    walletController.topUpWallet
);

/**
 * @route   GET /mobile/wallet/:walletId/transactions
 * @desc    Get all transactions for a wallet
 * @access  Private
 */
router.get(
    '/:walletId/transactions',
    authMiddleware,
    validate(walletIdParamSchema, 'params'),
    validate(transactionStatusQuerySchema, 'query'),
    paginationMiddleware(10, 100),
    walletController.getWalletTransactions
);

export default router;
