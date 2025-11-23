import { logger } from '../config';
import {
    BadRequestException,
    HttpException,
    NotFoundException,
} from '../exceptions/http.exception';
import { TransactionRepository } from '../repositories/transaction.repository';
import { WalletRepository } from '../repositories/wallet.repository';

const transactionRepository = new TransactionRepository();
const walletRepository = new WalletRepository();

export class TransactionService {
    /**
     * Get transaction by ID with all details
     * @param transactionId Transaction ID
     * @param userId User ID (for authorization)
     * @returns Transaction with details
     */
    async getTransactionById(transactionId: string) {
        try {
            if (!transactionId) {
                throw new BadRequestException('Transaction ID is required');
            }

            const transaction = await transactionRepository.findByIdWithDetails(transactionId);

            if (!transaction) {
                throw new NotFoundException('Transaction not found');
            }

            return {
                success: true,
                message: 'Transaction retrieved successfully',
                data: {
                    transaction,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Get transaction error:', error);
            throw new BadRequestException('Failed to retrieve transaction');
        }
    }

    /**
     * Update transaction status to completed (for cash channel only)
     * @param transactionId Transaction ID
     * @param userId User ID (authenticated user who is completing the transaction)
     * @returns Updated transaction
     */
    async markTransactionAsCompleted(transactionId: string, userId: string) {
        try {
            if (!transactionId) {
                throw new BadRequestException('Transaction ID is required');
            }

            const transaction = await transactionRepository.findById(transactionId);

            if (!transaction) {
                throw new NotFoundException('Transaction not found');
            }

            // Validate that transaction is pending
            if (transaction.status !== 'PENDING') {
                throw new BadRequestException(`Cannot complete transaction with status: ${transaction.status}. Only PENDING transactions can be completed.`);
            }

            // Validate that transaction channel is cash
            if (transaction.channel.toLowerCase() !== 'cash') {
                throw new BadRequestException(`Cannot complete transaction with channel: ${transaction.channel}. Only cash transactions can be manually completed.`);
            }

            // Mark transaction as completed
            const updatedTransaction = await transactionRepository.markAsCompleted(
                transactionId,
                userId
            );

            // Update wallet balance if transaction has a wallet association
            let updatedWallet;
            if (transaction.walletId) {
                // Validate wallet exists
                const wallet = await walletRepository.findById(transaction.walletId);
                if (!wallet) {
                    throw new NotFoundException('Wallet not found');
                }

                // Update wallet balance based on transaction action
                if (transaction.action === 'DEPOSIT') {
                    // Add amount to wallet for deposits
                    updatedWallet = await walletRepository.addAmount(transaction.walletId, transaction.amount);
                    logger.info(`Wallet ${transaction.walletId} credited: ${wallet.amount} -> ${updatedWallet.amount}`);
                } else if (transaction.action === 'PURCHASE') {
                    // Subtract amount from wallet for purchases
                    updatedWallet = await walletRepository.subtractAmount(transaction.walletId, transaction.amount);
                    logger.info(`Wallet ${transaction.walletId} debited: ${wallet.amount} -> ${updatedWallet.amount}`);
                }
            }

            logger.info(`Transaction ${transactionId} marked as completed by user ${userId}`);

            return {
                success: true,
                message: updatedWallet
                    ? 'Transaction completed successfully. Wallet updated.'
                    : 'Transaction completed successfully.',
                data: {
                    transaction: updatedTransaction,
                    wallet: updatedWallet ? {
                        id: updatedWallet.id,
                        amount: updatedWallet.amount,
                        previousAmount: updatedWallet.previousAmount,
                        currency: updatedWallet.currency,
                        active: updatedWallet.active,
                        updatedAt: updatedWallet.updatedAt,
                    } : undefined,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Update transaction error:', error);
            throw new BadRequestException('Failed to update transaction');
        }
    }

    /**
     * Get all transactions for a user with pagination and status filter
     * @param userId User ID
     * @param page Page number
     * @param limit Items per page
     * @param status Optional status filter
     * @returns Paginated transactions
     */
    async getUserTransactions(
        userId: string,
        page: number,
        limit: number,
        status?: string
    ) {
        try {
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }

            const filterStatus = status;

            const result = await transactionRepository.findByUserIdPaginated(
                userId,
                page,
                limit,
                filterStatus
            );

            return {
                success: true,
                message: 'Transactions retrieved successfully',
                data: result.data,
                pagination: result.pagination,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Get user transactions error:', error);
            throw new BadRequestException('Failed to retrieve transactions');
        }
    }
}
