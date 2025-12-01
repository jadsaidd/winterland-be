import { Booking, BookingStatus, SectionPosition, ZoneType } from '@prisma/client';

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

    // ==================== ADMIN BOOKING METHODS ====================

    /**
     * Create admin booking for non-seated events
     */
    async createAdminBooking(data: {
        bookingNumber: string;
        userId: string;
        eventId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        currency: string;
        status: BookingStatus;
        isAdminBooking: boolean;
        bookedByAdminId: string;
        scheduleId?: string;
    }): Promise<Booking> {
        return await prisma.booking.create({
            data,
        });
    }

    /**
     * Create admin booking with seat reservations (transaction)
     */
    async createAdminBookingWithSeats(data: {
        bookingNumber: string;
        userId: string;
        eventId: string;
        scheduleId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        currency: string;
        status: BookingStatus;
        isAdminBooking: boolean;
        bookedByAdminId: string;
        seats: Array<{
            seatId: string;
            zoneType: ZoneType;
            sectionPosition: SectionPosition;
            rowNumber: number;
            seatNumber: number;
        }>;
    }): Promise<Booking> {
        return await prisma.$transaction(async (tx: any) => {
            // Create booking
            const booking = await tx.booking.create({
                data: {
                    bookingNumber: data.bookingNumber,
                    userId: data.userId,
                    eventId: data.eventId,
                    scheduleId: data.scheduleId,
                    quantity: data.quantity,
                    unitPrice: data.unitPrice,
                    totalPrice: data.totalPrice,
                    currency: data.currency,
                    status: data.status,
                    isAdminBooking: data.isAdminBooking,
                    bookedByAdminId: data.bookedByAdminId,
                },
            });

            // Create booking seats
            await tx.bookingSeat.createMany({
                data: data.seats.map((seat) => ({
                    seatId: seat.seatId,
                    scheduleId: data.scheduleId,
                    userId: data.userId,
                    bookingId: booking.id,
                    isAdminLocked: true,
                    isReserved: true,
                    zoneType: seat.zoneType,
                    sectionPosition: seat.sectionPosition,
                    rowNumberSnapshot: seat.rowNumber,
                    seatNumberSnapshot: seat.seatNumber,
                })),
            });

            return booking;
        });
    }

    /**
     * Check if seats are already reserved for a schedule
     */
    async checkSeatsAvailability(
        seatIds: string[],
        scheduleId: string
    ): Promise<{ available: boolean; reservedSeats: string[] }> {
        const reservedSeats = await prisma.bookingSeat.findMany({
            where: {
                seatId: { in: seatIds },
                scheduleId,
                isReserved: true,
            },
            select: {
                seatId: true,
                seat: {
                    select: {
                        seatLabel: true,
                    },
                },
            },
        });

        return {
            available: reservedSeats.length === 0,
            reservedSeats: reservedSeats.map((s: any) => s.seat.seatLabel),
        };
    }

    /**
     * Get seat details with zone/section/row info
     */
    async getSeatDetails(seatIds: string[]): Promise<
        Array<{
            id: string;
            seatNumber: number;
            seatLabel: string;
            row: {
                id: string;
                rowNumber: number;
                section: {
                    id: string;
                    position: SectionPosition;
                    locationZone: {
                        id: string;
                        zone: {
                            id: string;
                            type: ZoneType;
                        };
                    };
                };
            };
        }>
    > {
        return await prisma.locationSeat.findMany({
            where: {
                id: { in: seatIds },
            },
            select: {
                id: true,
                seatNumber: true,
                seatLabel: true,
                row: {
                    select: {
                        id: true,
                        rowNumber: true,
                        section: {
                            select: {
                                id: true,
                                position: true,
                                locationZone: {
                                    select: {
                                        id: true,
                                        zone: {
                                            select: {
                                                id: true,
                                                type: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Get zone pricing for specific zone, event, and schedule
     */
    async getZonePricing(
        locationZoneId: string,
        eventId: string,
        scheduleId: string
    ): Promise<{
        id: string;
        originalPrice: number;
        discountedPrice: number | null;
    } | null> {
        return await prisma.zonePricing.findUnique({
            where: {
                locationZoneId_eventId_scheduleId: {
                    locationZoneId,
                    eventId,
                    scheduleId,
                },
            },
            select: {
                id: true,
                originalPrice: true,
                discountedPrice: true,
            },
        });
    }

    /**
     * Find all bookings with filters and pagination (dashboard)
     */
    async findAllWithFilters(
        page: number,
        limit: number,
        filters?: {
            status?: BookingStatus;
            eventId?: string;
            scheduleId?: string;
            userId?: string;
            isAdminBooking?: boolean;
            startDate?: Date;
            endDate?: Date;
            search?: string;
        }
    ): Promise<PaginatedResponse<any>> {
        const skip = (page - 1) * limit;

        const where: any = {
            isActive: true,
        };

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.eventId) {
            where.eventId = filters.eventId;
        }

        if (filters?.scheduleId) {
            where.scheduleId = filters.scheduleId;
        }

        if (filters?.userId) {
            where.userId = filters.userId;
        }

        if (filters?.isAdminBooking !== undefined) {
            where.isAdminBooking = filters.isAdminBooking;
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

        // Search filter (booking number or user name)
        if (filters?.search) {
            where.OR = [
                { bookingNumber: { contains: filters.search, mode: 'insensitive' } },
                { user: { name: { contains: filters.search, mode: 'insensitive' } } },
                { user: { email: { contains: filters.search, mode: 'insensitive' } } },
                { user: { phoneNumber: { contains: filters.search, mode: 'insensitive' } } },
            ];
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
                            haveSeats: true,
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
                                take: 1,
                            },
                        },
                    },
                    schedule: {
                        select: {
                            id: true,
                            startAt: true,
                            endAt: true,
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
                    bookingSeats: {
                        select: {
                            id: true,
                            zoneType: true,
                            sectionPosition: true,
                            rowNumberSnapshot: true,
                            seatNumberSnapshot: true,
                            seat: {
                                select: {
                                    id: true,
                                    seatLabel: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.booking.count({ where }),
        ]);

        return createPaginatedResponse(bookings, total, page, limit);
    }

    /**
     * Find booking by ID with full details (dashboard version)
     */
    async findByIdWithFullDetails(bookingId: string) {
        const booking = await prisma.booking.findUnique({
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
                        haveSeats: true,
                        startAt: true,
                        endAt: true,
                        active: true,
                        location: {
                            select: {
                                id: true,
                                name: true,
                                locationSlug: true,
                                type: true,
                            },
                        },
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
                    },
                },
                schedule: {
                    select: {
                        id: true,
                        startAt: true,
                        endAt: true,
                        details: true,
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
                        countryCode: {
                            select: {
                                id: true,
                                country: true,
                                code: true,
                                isoCode: true,
                                flagUrl: true,
                            },
                        },
                        userApplicationData: {
                            select: {
                                isGuestUser: true,
                            },
                        },
                    },
                },
                bookingSeats: {
                    select: {
                        id: true,
                        zoneType: true,
                        sectionPosition: true,
                        rowNumberSnapshot: true,
                        seatNumberSnapshot: true,
                        isAdminLocked: true,
                        seat: {
                            select: {
                                id: true,
                                seatLabel: true,
                                seatNumber: true,
                            },
                        },
                    },
                },
            },
        });

        // If booking exists and was created by admin, fetch admin details
        if (booking && booking.bookedByAdminId) {
            const bookedByAdmin = await prisma.user.findUnique({
                where: { id: booking.bookedByAdminId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                },
            });

            return {
                ...booking,
                bookedByAdmin,
            };
        }

        return booking ? { ...booking, bookedByAdmin: null } : null;
    }

    /**
     * Cancel booking and release seats
     */
    async cancelBookingWithSeats(
        bookingId: string,
        cancelReason: string
    ): Promise<Booking> {
        return await prisma.$transaction(async (tx: any) => {
            // Update booking status
            const booking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancelReason,
                },
            });

            // Release all seats associated with this booking
            await tx.bookingSeat.deleteMany({
                where: { bookingId },
            });

            return booking;
        });
    }
}

export default new BookingRepository();
