import { NextFunction, Request, Response } from 'express';

import { TransactionService } from '../../services/transaction.service';

const transactionService = new TransactionService();

export class MobileTransactionController {
    /**
     * Get transaction by ID
     * @route GET /mobile/transactions/:id
     */
    async getTransactionById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const result = await transactionService.getTransactionById(id);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark transaction as completed (cash transactions only)
     * @route PATCH /mobile/transactions/:id/complete
     */
    async markAsCompleted(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            const result = await transactionService.markTransactionAsCompleted(id, userId);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all transactions for authenticated user
     * @route GET /mobile/transactions
     */
    async getUserTransactions(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const { page, limit } = (req as any).pagination;
            const { status } = req.query;

            const result = await transactionService.getUserTransactions(
                userId,
                page,
                limit,
                status as string | undefined
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
