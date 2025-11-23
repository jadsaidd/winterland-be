import { Transaction } from '@prisma/client';

import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import { prisma } from '../utils/prisma.client';

export class TransactionRepository {
    /**
     * Find transaction by ID with all related data
     * @param id Transaction ID
     * @returns Transaction with user, wallet, and bookings
     */
    async findByIdWithDetails(id: string): Promise<Transaction | null> {
        return await prisma.transaction.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                        profileUrl: true,
                    },
                },
                wallet: {
                    select: {
                        id: true,
                        amount: true,
                        currency: true,
                        active: true,
                    },
                },
                bookings: {
                    include: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                eventSlug: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Find transaction by ID
     * @param id Transaction ID
     * @returns Transaction if found, null otherwise
     */
    async findById(id: string): Promise<Transaction | null> {
        return await prisma.transaction.findUnique({
            where: { id },
        });
    }

    /**
     * Update transaction status to completed
     * @param id Transaction ID
     * @param completedBy User ID who completed the transaction
     * @returns Updated transaction
     */
    async markAsCompleted(id: string, completedBy: string): Promise<Transaction> {
        return await prisma.transaction.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completedBy,
                completedAt: new Date(),
            },
        });
    }

    /**
     * Find all transactions by user ID
     * @param userId User ID
     * @returns Array of transactions
     */
    async findByUserId(userId: string): Promise<Transaction[]> {
        return await prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Find all transactions by user ID with pagination and status filter
     * @param userId User ID
     * @param page Page number
     * @param limit Items per page
     * @param status Optional status filter
     * @returns Paginated transactions with details
     */
    async findByUserIdPaginated(
        userId: string,
        page: number,
        limit: number,
        status?: string
    ): Promise<PaginatedResponse<Transaction>> {
        const skip = (page - 1) * limit;

        const where = {
            userId,
            ...(status && { status: status as any }),
        };

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    wallet: {
                        select: {
                            id: true,
                            amount: true,
                            currency: true,
                            active: true,
                        },
                    },
                    bookings: {
                        include: {
                            event: {
                                select: {
                                    id: true,
                                    name: true,
                                    eventSlug: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.transaction.count({ where }),
        ]);

        return createPaginatedResponse(transactions, total, page, limit);
    }

    /**
     * Create a new transaction
     * @param data Transaction data
     * @returns Created transaction
     */
    async create(data: {
        userId: string;
        amount: number;
        currency: string;
        platform: string;
        channel: string;
        action?: string;
        walletId?: string;
    }): Promise<Transaction> {
        return await prisma.transaction.create({
            data: {
                userId: data.userId,
                amount: data.amount,
                currency: data.currency,
                platform: data.platform,
                channel: data.channel,
                action: data.action as any || 'DEPOSIT',
                walletId: data.walletId,
            },
        });
    }

    /**
     * Create a top-up transaction (DEPOSIT with COMPLETED status)
     * @param data Transaction data with status
     * @returns Created transaction
     */
    async createTopUpTransaction(data: {
        userId: string;
        amount: number;
        currency: string;
        platform: string;
        channel: string;
        walletId: string;
        completedBy: string;
    }): Promise<Transaction> {
        return await prisma.transaction.create({
            data: {
                userId: data.userId,
                amount: data.amount,
                currency: data.currency,
                platform: data.platform,
                channel: data.channel,
                action: 'DEPOSIT',
                status: 'COMPLETED',
                walletId: data.walletId,
                completedBy: data.completedBy,
                completedAt: new Date(),
            },
        });
    }

    /**
     * Create a pending top-up transaction (DEPOSIT with PENDING status)
     * @param data Transaction data
     * @returns Created transaction
     */
    async createPendingTopUpTransaction(data: {
        userId: string;
        amount: number;
        currency: string;
        platform: string;
        channel: string;
        walletId: string;
    }): Promise<Transaction> {
        return await prisma.transaction.create({
            data: {
                userId: data.userId,
                amount: data.amount,
                currency: data.currency,
                platform: data.platform,
                channel: data.channel,
                action: 'DEPOSIT',
                status: 'PENDING',
                walletId: data.walletId,
            },
        });
    }

    /**
     * Create a checkout transaction (PURCHASE action)
     * @param data Transaction data
     * @returns Created transaction
     */
    async createCheckoutTransaction(data: {
        userId: string;
        amount: number;
        currency: string;
        platform: string;
        channel: string;
        status: 'PENDING' | 'COMPLETED';
        walletId?: string;
        completedBy?: string;
    }): Promise<Transaction> {
        return await prisma.transaction.create({
            data: {
                userId: data.userId,
                amount: data.amount,
                currency: data.currency,
                platform: data.platform,
                channel: data.channel,
                action: 'PURCHASE',
                status: data.status,
                walletId: data.walletId,
                completedBy: data.completedBy,
                completedAt: data.status === 'COMPLETED' ? new Date() : null,
            },
        });
    }

    /**
     * Get all transactions for a wallet with pagination
     * @param walletId Wallet ID
     * @param page Page number
     * @param limit Items per page
     * @param status Optional status filter
     * @returns Paginated transactions
     */
    async getWalletTransactions(
        walletId: string,
        page: number,
        limit: number,
        status?: string
    ): Promise<PaginatedResponse<Transaction>> {
        const skip = (page - 1) * limit;

        const where: any = { walletId };
        if (status) {
            where.status = status;
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.transaction.count({
                where,
            }),
        ]);

        return createPaginatedResponse(transactions, total, page, limit);
    }
}
