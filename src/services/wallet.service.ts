import { logger } from "../config";
import { WalletTopUpResponse } from '../dtos/response/wallet.response.dto';
import { BadRequestException, ForbiddenException, HttpException, NotFoundException } from "../exceptions/http.exception";
import { PaymentMethodRepository } from '../repositories/payment-method.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { WalletTopUpInput } from '../schemas/transaction.schema';
import { PaginatedResponse } from '../utils/pagination.util';

const walletRepository = new WalletRepository();
const transactionRepository = new TransactionRepository();
const paymentMethodRepository = new PaymentMethodRepository();

export class WalletService {
    /**
     * Get user's wallet
     * @param userId User ID
     * @param currency Currency code (optional, defaults to AED)
     * @returns Wallet info
     */
    async getUserWallet(userId: string, currency: string = 'AED') {
        try {
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }

            const wallet = await walletRepository.getUserWallet(userId, currency);

            if (!wallet) {
                throw new NotFoundException(`Wallet not found for currency ${currency}`);
            }

            return {
                success: true,
                message: 'Wallet retrieved successfully',
                data: {
                    wallet: {
                        id: wallet.id,
                        amount: wallet.amount,
                        previousAmount: wallet.previousAmount,
                        currency: wallet.currency,
                        active: wallet.active,
                        createdAt: wallet.createdAt,
                        updatedAt: wallet.updatedAt,
                    },
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error("Get wallet error:", error);
            throw new BadRequestException("Failed to retrieve wallet");
        }
    }

    /**
     * Get all user wallets
     * @param userId User ID
     * @returns All user wallets
     */
    async getAllUserWallets(userId: string) {
        try {
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }

            const wallets = await walletRepository.getAllUserWallets(userId);

            return {
                success: true,
                message: 'Wallets retrieved successfully',
                data: {
                    wallets: wallets.map(wallet => ({
                        id: wallet.id,
                        amount: wallet.amount,
                        previousAmount: wallet.previousAmount,
                        currency: wallet.currency,
                        active: wallet.active,
                        createdAt: wallet.createdAt,
                        updatedAt: wallet.updatedAt,
                    })),
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error("Get wallets error:", error);
            throw new BadRequestException("Failed to retrieve wallets");
        }
    }

    /**
     * Create wallet for user (internal use)
     * @param userId User ID
     * @param currency Currency code
     * @returns Created wallet
     */
    async createWalletForUser(userId: string, currency: string = 'AED') {
        try {
            // Check if wallet already exists
            const existingWallet = await walletRepository.findByUserIdAndCurrency(userId, currency);
            if (existingWallet) {
                return existingWallet;
            }

            const wallet = await walletRepository.createWallet(userId, currency);
            logger.info(`Wallet created for user ${userId} with currency ${currency}`);

            return wallet;
        } catch (error) {
            logger.error("Create wallet error:", error);
            throw new BadRequestException("Failed to create wallet");
        }
    }

    /**
     * Top-up user wallet
     * @param userId User ID
     * @param topUpData Top-up request data
     * @returns Updated wallet and transaction details
     */
    async topUpWallet(userId: string, topUpData: WalletTopUpInput): Promise<WalletTopUpResponse> {
        try {
            const { walletId, amount, paymentMethodId } = topUpData;

            // Validate user ID
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }

            // 1. Validate wallet exists and belongs to user
            const wallet = await walletRepository.findById(walletId);
            if (!wallet) {
                throw new NotFoundException('Wallet not found');
            }

            if (wallet.userId !== userId) {
                throw new BadRequestException('Wallet does not belong to user');
            }

            if (!wallet.active) {
                throw new BadRequestException('Wallet is not active');
            }

            // 2. Validate payment method exists and is active
            const paymentMethod = await paymentMethodRepository.findById(paymentMethodId);
            if (!paymentMethod) {
                throw new NotFoundException('Payment method not found');
            }

            if (!paymentMethod.isActive) {
                throw new BadRequestException('Payment method is not active');
            }

            // 3. Extract payment channel from payment method name
            const paymentChannel = typeof paymentMethod.name === 'object'
                ? (paymentMethod.name as any).en || 'Unknown'
                : String(paymentMethod.name);

            const isCashPayment = paymentChannel.toLowerCase() === 'cash';

            logger.info(`Processing top-up: User ${userId}, Amount ${amount}, Payment Method: ${paymentChannel}, Is Cash: ${isCashPayment}`);

            // 4. Create transaction based on payment method
            let transaction;
            let updatedWallet = wallet;

            if (isCashPayment) {
                // For cash payments: Create PENDING transaction, do NOT update wallet
                transaction = await transactionRepository.createPendingTopUpTransaction({
                    userId,
                    amount,
                    currency: wallet.currency,
                    platform: 'mobile',
                    channel: paymentChannel,
                    walletId: wallet.id,
                });

                logger.info(`Pending cash transaction created: ${transaction.id}. Wallet will be updated after completion.`);

                return {
                    success: true,
                    message: 'Cash top-up transaction created. Please complete the payment to add funds to your wallet.',
                    data: {
                        wallet: {
                            id: wallet.id,
                            amount: wallet.amount,
                            previousAmount: wallet.previousAmount,
                            currency: wallet.currency,
                            active: wallet.active,
                            createdAt: wallet.createdAt,
                            updatedAt: wallet.updatedAt,
                        },
                        transaction: {
                            id: transaction.id,
                            amount: transaction.amount,
                            currency: transaction.currency,
                            platform: transaction.platform,
                            channel: transaction.channel,
                            action: transaction.action,
                            status: transaction.status,
                            completedBy: transaction.completedBy || undefined,
                            completedAt: transaction.completedAt || undefined,
                            createdAt: transaction.createdAt,
                            updatedAt: transaction.updatedAt,
                        },
                    },
                };
            } else {
                // TODO: For other payment methods, implement payment gateway integration
                // - Initialize payment with selected payment method (Apple Pay, Google Pay, Ziina, etc.)
                // - Get payment gateway URL/session
                // - Return payment URL to frontend for user to complete payment
                // - Implement webhook/callback to handle payment confirmation
                // - Only proceed with wallet update and transaction after successful payment

                // For now, simulating successful payment for non-cash methods
                logger.info(`[SIMULATION] Processing non-cash top-up: ${paymentChannel}`);

                transaction = await transactionRepository.createTopUpTransaction({
                    userId,
                    amount,
                    currency: wallet.currency,
                    platform: 'mobile',
                    channel: paymentChannel,
                    walletId: wallet.id,
                    completedBy: userId, // In production, this might be payment gateway ID
                });

                logger.info(`Transaction created: ${transaction.id} - Status: ${transaction.status}`);

                // Update wallet balance (simulated immediate update)
                updatedWallet = await walletRepository.addAmount(walletId, amount);

                logger.info(`Wallet ${walletId} updated: ${wallet.amount} -> ${updatedWallet.amount}`);
            }

            return {
                success: true,
                message: 'Wallet topped up successfully',
                data: {
                    wallet: {
                        id: updatedWallet.id,
                        amount: updatedWallet.amount,
                        previousAmount: updatedWallet.previousAmount,
                        currency: updatedWallet.currency,
                        active: updatedWallet.active,
                        createdAt: updatedWallet.createdAt,
                        updatedAt: updatedWallet.updatedAt,
                    },
                    transaction: {
                        id: transaction.id,
                        amount: transaction.amount,
                        currency: transaction.currency,
                        platform: transaction.platform,
                        channel: transaction.channel,
                        action: transaction.action,
                        status: transaction.status,
                        completedBy: transaction.completedBy || undefined,
                        completedAt: transaction.completedAt || undefined,
                        createdAt: transaction.createdAt,
                        updatedAt: transaction.updatedAt,
                    },
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error("Top-up wallet error:", error);
            throw new BadRequestException("Failed to top up wallet");
        }
    }

    /**
     * Get all transactions for a specific wallet
     * @param userId User ID
     * @param walletId Wallet ID
     * @param page Page number
     * @param limit Items per page
     * @param status Optional transaction status filter
     * @returns Paginated transactions
     */
    async getWalletTransactions(
        userId: string,
        walletId: string,
        page: number,
        limit: number,
        status?: string
    ): Promise<PaginatedResponse<any>> {
        try {
            // Validate user ID
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }

            // Validate wallet exists and belongs to user
            const wallet = await walletRepository.findById(walletId);
            if (!wallet) {
                throw new NotFoundException('Wallet not found');
            }

            if (wallet.userId !== userId) {
                throw new ForbiddenException('You do not have access to this wallet');
            }

            // 3. Get paginated transactions with optional status filter
            const paginatedResult = await transactionRepository.getWalletTransactions(
                walletId,
                page,
                limit,
                status
            );

            // Transform transaction data for response
            const transformedData = paginatedResult.data.map(transaction => ({
                id: transaction.id,
                amount: transaction.amount,
                currency: transaction.currency,
                platform: transaction.platform,
                channel: transaction.channel,
                action: transaction.action,
                status: transaction.status,
                completedBy: transaction.completedBy,
                completedAt: transaction.completedAt,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt,
            }));

            return {
                ...paginatedResult,
                data: transformedData,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Get wallet transactions error:', error);
            throw new BadRequestException('Failed to retrieve wallet transactions');
        }
    }
}
