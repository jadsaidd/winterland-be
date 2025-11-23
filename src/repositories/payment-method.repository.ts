import { Prisma } from '@prisma/client';

import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import prisma from '../utils/prisma.client';

/**
 * PaymentMethod with its relations
 */
export interface PaymentMethodWithRelations {
    id: string;
    name: any;
    description: any;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    paymentMethodMedias: Array<{
        id: string;
        sortOrder: number | null;
        mediaId: string;
        media: {
            id: string;
            url: string;
            type: string;
            context: string | null;
            meta: any;
        };
    }>;
}

/**
 * PaymentMethod Repository
 * Handles all database operations for payment methods
 */
export class PaymentMethodRepository {
    /**
     * Create a new payment method
     */
    async create(data: {
        name: any;
        description?: any;
        isActive?: boolean;
    }): Promise<PaymentMethodWithRelations> {
        return await prisma.paymentMethod.create({
            data,
            include: {
                paymentMethodMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
        }) as PaymentMethodWithRelations;
    }

    /**
     * Find payment method by ID
     */
    async findById(id: string): Promise<PaymentMethodWithRelations | null> {
        return await prisma.paymentMethod.findUnique({
            where: { id },
            include: {
                paymentMethodMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
        }) as PaymentMethodWithRelations | null;
    }

    /**
     * Get all payment methods with pagination and filters
     */
    async findAll(
        page: number,
        limit: number,
        filters?: {
            isActive?: boolean;
            search?: string;
        }
    ): Promise<PaginatedResponse<PaymentMethodWithRelations>> {
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.PaymentMethodWhereInput = {};

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters?.search) {
            where.OR = [
                {
                    name: {
                        path: ['en'],
                        string_contains: filters.search,
                    },
                },
                {
                    name: {
                        path: ['ar'],
                        string_contains: filters.search,
                    },
                },
                {
                    description: {
                        path: ['en'],
                        string_contains: filters.search,
                    },
                },
                {
                    description: {
                        path: ['ar'],
                        string_contains: filters.search,
                    },
                },
            ];
        }

        // Fetch payment methods and total count in parallel
        const [paymentMethods, total] = await Promise.all([
            prisma.paymentMethod.findMany({
                where,
                skip,
                take: limit,
                include: {
                    paymentMethodMedias: {
                        include: {
                            media: true,
                        },
                        orderBy: {
                            sortOrder: 'asc',
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.paymentMethod.count({ where }),
        ]);

        return createPaginatedResponse(
            paymentMethods as PaymentMethodWithRelations[],
            total,
            page,
            limit
        );
    }

    /**
     * Get all active payment methods (no pagination)
     */
    async findAllActive(): Promise<PaymentMethodWithRelations[]> {
        return await prisma.paymentMethod.findMany({
            where: { isActive: true },
            include: {
                paymentMethodMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        }) as PaymentMethodWithRelations[];
    }

    /**
     * Update payment method
     */
    async update(
        id: string,
        data: {
            name?: any;
            description?: any;
            isActive?: boolean;
        }
    ): Promise<PaymentMethodWithRelations> {
        return await prisma.paymentMethod.update({
            where: { id },
            data,
            include: {
                paymentMethodMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
        }) as PaymentMethodWithRelations;
    }

    /**
     * Delete payment method
     */
    async delete(id: string): Promise<void> {
        await prisma.paymentMethod.delete({
            where: { id },
        });
    }

    /**
     * Remove all media links from payment method
     */
    async removeAllMedia(paymentMethodId: string): Promise<void> {
        await prisma.paymentMethodMedia.deleteMany({
            where: { paymentMethodId },
        });
    }

    /**
     * Create media record and link to payment method
     */
    async createAndLinkMedia(
        paymentMethodId: string,
        url: string,
        sortOrder: number,
        uploadedBy?: string
    ): Promise<void> {
        await prisma.paymentMethodMedia.create({
            data: {
                sortOrder,
                paymentMethod: {
                    connect: { id: paymentMethodId },
                },
                media: {
                    create: {
                        url,
                        type: 'IMAGE',
                        context: 'payment_method',
                        uploadedBy,
                    },
                },
            },
        });
    }

    /**
     * Count payment methods by active status
     */
    async countByStatus(isActive?: boolean): Promise<number> {
        const where: Prisma.PaymentMethodWhereInput = {};

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        return await prisma.paymentMethod.count({ where });
    }
}

export default new PaymentMethodRepository();
