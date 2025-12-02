import { Booking, BookingStatus, SectionPosition, ZoneType } from '@prisma/client';

import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import { prisma } from '../utils/prisma.client';

export class BookingRepository {
    /**
     * Generate random alphanumeric code
     * Uses uppercase letters (excluding O, I, L) and numbers (excluding 0, 1) for readability
     * @param length Length of the code to generate
     * @returns Random alphanumeric string
     */
    private generateRandomCode(length: number): string {
        // Characters that are easy to read and distinguish
        // Excludes: O (looks like 0), I (looks like 1), L (looks like 1), 0 (looks like O), 1 (looks like I/L)
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate unique booking number with format: WL-XXXXXX
     * Uses random 6-character alphanumeric code for uniqueness
     * @returns Unique booking number
     */
    async generateBookingNumber(): Promise<string> {
        const prefix = 'WL-';
        let bookingNumber: string;
        let attempts = 0;
        const maxAttempts = 10;

        // Generate random booking number and check for uniqueness
        do {
            const randomCode = this.generateRandomCode(6);
            bookingNumber = `${prefix}${randomCode}`;

            const existing = await prisma.booking.findFirst({
                where: {
                    bookingNumber,
                },
                select: {
                    id: true,
                },
            });

            if (!existing) {
                return bookingNumber;
            }

            attempts++;
        } while (attempts < maxAttempts);

        // Fallback: use timestamp + random for guaranteed uniqueness
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomSuffix = this.generateRandomCode(3);
        return `${prefix}${timestamp}${randomSuffix}`;
    }

    /**
     * Generate multiple unique booking numbers with format: WL-XXXXXX
     * Used for bulk booking creation to avoid duplicate numbers
     * @param count Number of booking numbers to generate
     * @returns Array of unique booking numbers
     */
    async generateBulkBookingNumbers(count: number): Promise<string[]> {
        const prefix = 'WL-';
        const bookingNumbers: string[] = [];
        const generatedCodes = new Set<string>();

        // Get all existing booking numbers to check against
        const existingBookings = await prisma.booking.findMany({
            select: {
                bookingNumber: true,
            },
        });
        const existingNumbers = new Set(existingBookings.map((b: { bookingNumber: string }) => b.bookingNumber));

        let attempts = 0;
        const maxAttemptsPerNumber = 10;

        while (bookingNumbers.length < count) {
            const randomCode = this.generateRandomCode(6);
            const bookingNumber = `${prefix}${randomCode}`;

            // Check if this number is unique (not in DB and not already generated in this batch)
            if (!existingNumbers.has(bookingNumber) && !generatedCodes.has(bookingNumber)) {
                bookingNumbers.push(bookingNumber);
                generatedCodes.add(bookingNumber);
                attempts = 0; // Reset attempts counter for next number
            } else {
                attempts++;
                if (attempts >= maxAttemptsPerNumber) {
                    // Fallback: use timestamp + random for guaranteed uniqueness
                    const timestamp = Date.now().toString(36).toUpperCase();
                    const randomSuffix = this.generateRandomCode(3);
                    const fallbackNumber = `${prefix}${timestamp}${randomSuffix}`;
                    bookingNumbers.push(fallbackNumber);
                    generatedCodes.add(fallbackNumber);
                    attempts = 0;
                }
            }
        }

        return bookingNumbers;
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
            isPreReserved?: boolean;
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

        if (filters?.isPreReserved !== undefined) {
            where.isPreReserved = filters.isPreReserved;
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

    // ==================== PRE-RESERVED BOOKING METHODS ====================

    /**
     * Create pre-reserved booking for non-seated event (single booking)
     */
    async createPreReservedBooking(data: {
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
        isPreReserved: boolean;
    }): Promise<Booking> {
        return await prisma.booking.create({
            data,
        });
    }

    /**
     * Create bulk pre-reserved bookings for non-seated event (transaction)
     * Creates multiple bookings each with quantity 1
     */
    async createBulkPreReservedBookings(
        bookingsData: Array<{
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
            isPreReserved: boolean;
        }>
    ): Promise<Booking[]> {
        return await prisma.$transaction(async (tx: any) => {
            const bookings: Booking[] = [];
            for (const data of bookingsData) {
                const booking = await tx.booking.create({ data });
                bookings.push(booking);
            }
            return bookings;
        });
    }

    /**
     * Create pre-reserved booking with single seat reservation (transaction)
     */
    async createPreReservedBookingWithSeat(data: {
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
        isPreReserved: boolean;
        seat: {
            seatId: string;
            zoneType: ZoneType;
            sectionPosition: SectionPosition;
            rowNumber: number;
            seatNumber: number;
        };
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
                    isPreReserved: data.isPreReserved,
                },
            });

            // Create booking seat
            await tx.bookingSeat.create({
                data: {
                    seatId: data.seat.seatId,
                    scheduleId: data.scheduleId,
                    userId: data.userId,
                    bookingId: booking.id,
                    isAdminLocked: true,
                    isReserved: true,
                    zoneType: data.seat.zoneType,
                    sectionPosition: data.seat.sectionPosition,
                    rowNumberSnapshot: data.seat.rowNumber,
                    seatNumberSnapshot: data.seat.seatNumber,
                },
            });

            return booking;
        });
    }

    /**
     * Assign booking to a user (transfer from guest user)
     * Returns the previous guest user ID for cleanup
     */
    async assignBookingToUser(
        bookingId: string,
        newUserId: string
    ): Promise<{ booking: Booking; previousUserId: string }> {
        return await prisma.$transaction(async (tx: any) => {
            // Get current booking
            const currentBooking = await tx.booking.findUnique({
                where: { id: bookingId },
                select: { userId: true },
            });

            if (!currentBooking) {
                throw new Error('Booking not found');
            }

            const previousUserId = currentBooking.userId;

            // Update booking with new user
            const booking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    userId: newUserId,
                    isPreReserved: false, // No longer pre-reserved after assignment
                },
            });

            // Update booking seats if any
            await tx.bookingSeat.updateMany({
                where: { bookingId },
                data: { userId: newUserId },
            });

            return { booking, previousUserId };
        });
    }

    /**
     * Delete a guest user (used after booking reassignment)
     * Only deletes if user is a guest and has no other bookings
     */
    async deleteGuestUserIfUnused(userId: string): Promise<boolean> {
        // Check if user is a guest user and has no other bookings
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                userApplicationData: {
                    select: { isGuestUser: true },
                },
                bookings: {
                    select: { id: true },
                    take: 1,
                },
            },
        });

        if (!user) return false;

        // Only delete if it's a guest user with no bookings
        const isGuestUser = user.userApplicationData?.isGuestUser ?? false;
        const hasNoBookings = user.bookings.length === 0;

        if (isGuestUser && hasNoBookings) {
            await prisma.user.delete({
                where: { id: userId },
            });
            return true;
        }

        return false;
    }

    /**
     * Find pre-reserved booking by ID
     */
    async findPreReservedById(bookingId: string): Promise<Booking | null> {
        return await prisma.booking.findFirst({
            where: {
                id: bookingId,
                isPreReserved: true,
                isActive: true,
            },
        });
    }

    /**
     * Update booking user name (for guest user name update)
     */
    async updateBookingUserName(userId: string, name: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { name },
        });
    }
}

export default new BookingRepository();
