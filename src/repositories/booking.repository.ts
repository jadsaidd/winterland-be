import { Booking, BookingStatus } from '@prisma/client';

import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import { prisma } from '../utils/prisma.client';

export class BookingRepository {
    /**
     * Generate unique booking number with format: WL-YYYYMMDD-XXXX
     * @returns Unique booking number
     */
    async generateBookingNumber(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

        // Find the latest booking for today
        const prefix = `WL-${dateStr}-`;
        const latestBooking = await prisma.booking.findFirst({
            where: {
                bookingNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                bookingNumber: 'desc',
            },
            select: {
                bookingNumber: true,
            },
        });

        let sequence = 1;
        if (latestBooking) {
            // Extract sequence number from the last booking
            const lastSequence = latestBooking.bookingNumber.split('-')[2];
            sequence = parseInt(lastSequence, 10) + 1;
        }

        // Format sequence with leading zeros (0001, 0002, etc.)
        const sequenceStr = sequence.toString().padStart(4, '0');

        return `${prefix}${sequenceStr}`;
    }

    /**
     * Create a new booking
     */
    async create(data: {
        bookingNumber: string;
        userId: string;
        eventId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        currency: string;
        status: BookingStatus;
        transactionId?: string;
        paymentMethodId?: string;
        cartId?: string;
        cartItemId?: string;
    }): Promise<Booking> {
        return await prisma.booking.create({
            data,
        });
    }

    /**
     * Find booking by ID with all details
     */
    async findByIdWithDetails(bookingId: string) {
        return await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                event: {
                    select: {
                        id: true,
                        name: true,
                        eventSlug: true,
                        description: true,
                        originalPrice: true,
                        discountedPrice: true,
                        startAt: true,
                        endAt: true,
                        active: true,
                        eventMedias: {
                            include: {
                                media: true,
                            },
                            orderBy: {
                                sortOrder: 'asc',
                            },
                        },
                        eventCategories: {
                            include: {
                                category: {
                                    select: {
                                        id: true,
                                        title: true,
                                        categorySlug: true,
                                    },
                                },
                            },
                        },
                        eventLocations: {
                            include: {
                                location: {
                                    select: {
                                        id: true,
                                        name: true,
                                        locationSlug: true,
                                        type: true,
                                    },
                                },
                            },
                        },
                    },
                },
                transaction: {
                    select: {
                        id: true,
                        amount: true,
                        currency: true,
                        platform: true,
                        channel: true,
                        action: true,
                        status: true,
                        completedBy: true,
                        completedAt: true,
                        createdAt: true,
                    },
                },
                paymentMethod: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                    },
                },
            },
        });
    }

    /**
     * Find booking by ID
     */
    async findById(bookingId: string): Promise<Booking | null> {
        return await prisma.booking.findUnique({
            where: { id: bookingId },
        });
    }

    /**
     * Find user bookings with filters and pagination
     */
    async findByUserId(
        userId: string,
        page: number,
        limit: number,
        filters?: {
            status?: BookingStatus;
            eventId?: string;
            startDate?: Date;
            endDate?: Date;
        }
    ): Promise<PaginatedResponse<any>> {
        const skip = (page - 1) * limit;

        const where: any = {
            userId,
            isActive: true,
        };

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.eventId) {
            where.eventId = filters.eventId;
        }

        // Date range filter (by booking creation date)
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};

            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }

            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    event: {
                        select: {
                            id: true,
                            name: true,
                            eventSlug: true,
                            description: true,
                            originalPrice: true,
                            discountedPrice: true,
                            startAt: true,
                            endAt: true,
                            active: true,
                            eventMedias: {
                                include: {
                                    media: true,
                                },
                                orderBy: {
                                    sortOrder: 'asc',
                                },
                                take: 1, // Just get the first image for list view
                            },
                        },
                    },
                    paymentMethod: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            prisma.booking.count({ where }),
        ]);

        return createPaginatedResponse(bookings, total, page, limit);
    }

    /**
     * Update booking used quantity
     */
    async updateUsedQuantity(
        bookingId: string,
        usedQuantity: number,
        status?: BookingStatus
    ): Promise<Booking> {
        return await prisma.booking.update({
            where: { id: bookingId },
            data: {
                usedQuantity,
                ...(status && { status }),
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Update booking status
     */
    async updateStatus(
        bookingId: string,
        status: BookingStatus,
        additionalData?: {
            cancelledAt?: Date;
            cancelReason?: string;
        }
    ): Promise<Booking> {
        return await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status,
                ...additionalData,
            },
        });
    }

    /**
     * Mark cart items as converted to booking
     */
    async markCartItemsAsConverted(cartItemIds: string[]): Promise<void> {
        await prisma.cartItem.updateMany({
            where: {
                id: {
                    in: cartItemIds,
                },
            },
            data: {
                convertedToBooking: true,
            },
        });
    }

    /**
     * Update cart status to CHECKED_OUT
     */
    async markCartAsCheckedOut(cartId: string): Promise<void> {
        await prisma.cart.update({
            where: { id: cartId },
            data: {
                status: 'CHECKED_OUT',
                checkedOutAt: new Date(),
            },
        });
    }
}

export default new BookingRepository();
