import { NextFunction, Request, Response } from 'express';

import { WalletTopUpInput } from '../../schemas/transaction.schema';
import { WalletService } from '../../services/wallet.service';

const walletService = new WalletService();

export class MobileWalletController {
    /**
     * Get user's wallet
     * @route GET /mobile/wallet
     */
    async getWallet(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const { currency } = req.query;

            const result = await walletService.getUserWallet(
                userId,
                currency as string || 'AED'
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all user wallets
     * @route GET /mobile/wallet/all
     */
    async getAllWallets(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;

            const result = await walletService.getAllUserWallets(userId);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Top-up wallet
     * @route POST /mobile/wallet/top-up
     */
    async topUpWallet(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const topUpData: WalletTopUpInput = req.body;

            const result = await walletService.topUpWallet(userId, topUpData);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get wallet transactions
     * @route GET /mobile/wallet/:walletId/transactions
     */
    async getWalletTransactions(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const { walletId } = req.params;
            const { page, limit } = (req as any).pagination;
            const { status } = req.query;

            const result = await walletService.getWalletTransactions(
                userId,
                walletId,
                page,
                limit,
                status as string | undefined
            );

            res.status(200).json({
                success: true,
                message: 'Wallet transactions retrieved successfully',
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }
}
