import { BookingStatus } from '@prisma/client';

import { logger } from '../config';
import {
    BadRequestException,
    ConflictException,
    HttpException,
    NotFoundException,
} from '../exceptions/http.exception';
import bookingRepository from '../repositories/booking.repository';
import eventRepository from '../repositories/event.repository';
import {
    AdminBookingInput,
    AdminNonSeatedBookingInput,
    AdminSeatedBookingInput,
    AssignBookingInput,
    AssignBulkBookingsInput,
    GuestUserInfo,
    PreReserveBookingInput,
    PreReserveNonSeatedInput,
    PreReserveSeatedInput,
} from '../schemas/dashboard-booking.schema';
import { prisma } from '../utils/prisma.client';

const DEFAULT_CURRENCY = 'AED';

export class DashboardBookingService {
    /**
     * Create or find guest user for admin booking
     * If user with email/phone exists, return existing user
     * Otherwise create new guest user
     */
    private async getOrCreateGuestUser(userInfo: GuestUserInfo): Promise<{
        userId: string;
        isNewUser: boolean;
    }> {
        // Check if user already exists by email or phone
        let existingUser = null;

        // Normalize email to lowercase for case-insensitive matching
        const normalizedEmail = userInfo.email?.toLowerCase().trim();

        if (normalizedEmail) {
            existingUser = await prisma.user.findFirst({
                where: {
                    email: {
                        equals: normalizedEmail,
                        mode: 'insensitive',
                    },
                },
                select: { id: true },
            });
        }

        if (!existingUser && userInfo.phoneNumber) {
            existingUser = await prisma.user.findUnique({
                where: { phoneNumber: userInfo.phoneNumber },
                select: { id: true },
            });
        }

        if (existingUser) {
            return { userId: existingUser.id, isNewUser: false };
        }

        // Create new guest user
        const newUser = await prisma.user.create({
            data: {
                name: userInfo.name,
                email: normalizedEmail || undefined,
                phoneNumber: userInfo.phoneNumber || undefined,
                countryCodeId: userInfo.countryCodeId || undefined,
                platform: 'Mobile', // Guest users are created for mobile customers
                isVerified: false,
                userApplicationData: {
                    create: {
                        isGuestUser: true,
                    },
                },
            },
        });

        logger.info(`Created guest user: ${newUser.id} for admin booking`);

        return { userId: newUser.id, isNewUser: true };
    }

    /**
     * Validate event exists and is active
     */
    private async validateEvent(eventId: string) {
        const event = await eventRepository.findById(eventId, true);

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if (!event.active) {
            throw new BadRequestException('Event is not active');
        }

        return event;
    }

    /**
     * Validate schedule exists and belongs to event
     */
    private async validateSchedule(scheduleId: string, eventId: string) {
        const schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId },
            select: {
                id: true,
                eventId: true,
                startAt: true,
                endAt: true,
            },
        });

        if (!schedule) {
            throw new NotFoundException('Schedule not found');
        }

        if (schedule.eventId !== eventId) {
            throw new BadRequestException('Schedule does not belong to the specified event');
        }

        return schedule;
    }

    /**
     * Get price for non-seated event
     * Priority: custom price -> discounted price -> original price
     */
    private getEventPrice(event: any, customPrice?: number): number {
        if (customPrice !== undefined) {
            return customPrice;
        }

        return event.discountedPrice ?? event.originalPrice ?? 0;
    }

    /**
     * Admin booking for non-seated events (haveSeats: false)
     */
    async createNonSeatedBooking(
        adminId: string,
        input: AdminNonSeatedBookingInput
    ) {
        try {
            // 1. Validate event
            const event = await this.validateEvent(input.eventId);

            // 2. Verify event is non-seated
            if (event.haveSeats) {
                throw new BadRequestException(
                    'This event requires seat selection. Please use seated booking endpoint with schedule and seats.'
                );
            }

            // 3. Get or create guest user
            const { userId, isNewUser } = await this.getOrCreateGuestUser(input.userInfo);

            // 4. Calculate pricing
            const unitPrice = this.getEventPrice(event, input.unitPrice);
            const totalPrice = unitPrice * input.quantity;

            // 5. Generate booking number
            const bookingNumber = await bookingRepository.generateBookingNumber();

            // 6. Create booking
            const booking = await bookingRepository.createAdminBooking({
                bookingNumber,
                userId,
                eventId: input.eventId,
                quantity: input.quantity,
                unitPrice,
                totalPrice,
                currency: DEFAULT_CURRENCY,
                status: 'CONFIRMED', // Admin bookings are immediately confirmed
                isAdminBooking: true,
                bookedByAdminId: adminId,
            });

            logger.info(
                `Admin booking created: ${booking.bookingNumber} by admin ${adminId} for user ${userId}`
            );

            // 7. Get booking with full details
            const bookingWithDetails = await bookingRepository.findByIdWithFullDetails(booking.id);

            return {
                success: true,
                message: 'Admin booking created successfully',
                data: {
                    booking: bookingWithDetails,
                    isNewUser,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Admin non-seated booking error:', error);
            throw new BadRequestException('Failed to create admin booking');
        }
    }

    /**
     * Admin booking for seated events (haveSeats: true)
     */
    async createSeatedBooking(
        adminId: string,
        input: AdminSeatedBookingInput
    ) {
        try {
            // 1. Validate event
            const event = await this.validateEvent(input.eventId);

            // 2. Verify event is seated
            if (!event.haveSeats) {
                throw new BadRequestException(
                    'This event does not require seat selection. Please use non-seated booking endpoint.'
                );
            }

            // 3. Validate schedule
            await this.validateSchedule(input.scheduleId, input.eventId);

            // 4. Get seat IDs
            const seatIds = input.seats.map((s) => s.seatId);

            // 5. Check seat availability
            const availability = await bookingRepository.checkSeatsAvailability(
                seatIds,
                input.scheduleId
            );

            if (!availability.available) {
                throw new ConflictException(
                    `The following seats are already reserved for this schedule: ${availability.reservedSeats.join(', ')}`
                );
            }

            // 6. Get seat details (for zone pricing and snapshots)
            const seatDetails = await bookingRepository.getSeatDetails(seatIds);

            if (seatDetails.length !== seatIds.length) {
                const foundIds = seatDetails.map((s) => s.id);
                const missingIds = seatIds.filter((id) => !foundIds.includes(id));
                throw new NotFoundException(`Seats not found: ${missingIds.join(', ')}`);
            }

            // 7. Calculate pricing
            let unitPrice: number;

            if (input.unitPrice !== undefined) {
                // Use custom price if provided
                unitPrice = input.unitPrice;
            } else {
                // Get zone pricing - all seats must have the same zone for bulk pricing
                // For mixed zones, we would need different pricing per seat
                // For simplicity, we use the first seat's zone pricing
                const firstSeat = seatDetails[0];
                const locationZoneId = firstSeat.row.section.locationZone.id;

                const zonePricing = await bookingRepository.getZonePricing(
                    locationZoneId,
                    input.eventId,
                    input.scheduleId
                );

                if (!zonePricing) {
                    throw new BadRequestException(
                        `Zone pricing not configured for this event schedule. Please configure zone pricing or provide a custom price.`
                    );
                }

                unitPrice = zonePricing.discountedPrice ?? zonePricing.originalPrice;
            }

            const quantity = seatIds.length;
            const totalPrice = unitPrice * quantity;

            // 8. Get or create guest user
            const { userId, isNewUser } = await this.getOrCreateGuestUser(input.userInfo);

            // 9. Generate booking number
            const bookingNumber = await bookingRepository.generateBookingNumber();

            // 10. Prepare seat data with snapshots
            const seatsData = seatDetails.map((seat) => ({
                seatId: seat.id,
                zoneType: seat.row.section.locationZone.zone.type,
                sectionPosition: seat.row.section.position,
                rowNumber: seat.row.rowNumber,
                seatNumber: seat.seatNumber,
            }));

            // 11. Create booking with seat reservations (atomic transaction)
            const booking = await bookingRepository.createAdminBookingWithSeats({
                bookingNumber,
                userId,
                eventId: input.eventId,
                scheduleId: input.scheduleId,
                quantity,
                unitPrice,
                totalPrice,
                currency: DEFAULT_CURRENCY,
                status: 'CONFIRMED', // Admin bookings are immediately confirmed
                isAdminBooking: true,
                bookedByAdminId: adminId,
                seats: seatsData,
            });

            logger.info(
                `Admin seated booking created: ${booking.bookingNumber} with ${quantity} seats by admin ${adminId}`
            );

            // 12. Get booking with full details
            const bookingWithDetails = await bookingRepository.findByIdWithFullDetails(booking.id);

            return {
                success: true,
                message: 'Admin seated booking created successfully',
                data: {
                    booking: bookingWithDetails,
                    isNewUser,
                    seatsBooked: seatDetails.map((s) => s.seatLabel),
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Admin seated booking error:', error);
            throw new BadRequestException('Failed to create admin seated booking');
        }
    }

    /**
     * Main admin checkout method
     * Automatically determines booking type based on event's haveSeats property
     */
    async adminCheckout(adminId: string, input: AdminBookingInput) {
        // Validate event first to determine type
        const event = await this.validateEvent(input.eventId);

        if (event.haveSeats) {
            // Seated event - requires scheduleId and seats
            if (!('scheduleId' in input) || !('seats' in input)) {
                throw new BadRequestException(
                    'This event requires seat selection. Please provide scheduleId and seats array.'
                );
            }
            return await this.createSeatedBooking(adminId, input as AdminSeatedBookingInput);
        } else {
            // Non-seated event - requires quantity
            if (!('quantity' in input)) {
                throw new BadRequestException(
                    'This event requires quantity. Please provide quantity field.'
                );
            }
            return await this.createNonSeatedBooking(adminId, input as AdminNonSeatedBookingInput);
        }
    }

    /**
     * Get all bookings with filters and pagination (dashboard)
     */
    async getAllBookings(
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
    ) {
        try {
            const result = await bookingRepository.findAllWithFilters(page, limit, filters);

            return {
                success: true,
                message: 'Bookings retrieved successfully',
                data: result.data,
                pagination: result.pagination,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Get all bookings error:', error);
            throw new BadRequestException('Failed to retrieve bookings');
        }
    }

    /**
     * Get booking by ID with full details (dashboard)
     */
    async getBookingById(bookingId: string) {
        try {
            const booking = await bookingRepository.findByIdWithFullDetails(bookingId);

            if (!booking) {
                throw new NotFoundException('Booking not found');
            }

            return {
                success: true,
                message: 'Booking retrieved successfully',
                data: {
                    booking,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Get booking by ID error:', error);
            throw new BadRequestException('Failed to retrieve booking');
        }
    }

    /**
     * Update booking status
     */
    async updateBookingStatus(
        bookingId: string,
        status: BookingStatus,
        cancelReason?: string
    ) {
        try {
            const booking = await bookingRepository.findById(bookingId);

            if (!booking) {
                throw new NotFoundException('Booking not found');
            }

            // Validate status transitions
            const validTransitions: Record<BookingStatus, BookingStatus[]> = {
                PENDING: ['CONFIRMED', 'CANCELLED'],
                CONFIRMED: ['COMPLETED', 'CANCELLED', 'REFUNDED'],
                COMPLETED: ['REFUNDED'],
                CANCELLED: [],
                REFUNDED: [],
            };

            if (!validTransitions[booking.status].includes(status)) {
                throw new BadRequestException(
                    `Cannot transition from ${booking.status} to ${status}`
                );
            }

            if (status === 'CANCELLED') {
                // Use special method that releases seats
                await bookingRepository.cancelBookingWithSeats(
                    bookingId,
                    cancelReason || 'Cancelled by admin'
                );
            } else {
                await bookingRepository.updateStatus(bookingId, status);
            }

            logger.info(`Booking ${bookingId} status updated to ${status}`);

            // Get updated booking with details
            const bookingWithDetails = await bookingRepository.findByIdWithFullDetails(bookingId);

            return {
                success: true,
                message: `Booking status updated to ${status}`,
                data: {
                    booking: bookingWithDetails,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Update booking status error:', error);
            throw new BadRequestException('Failed to update booking status');
        }
    }

    /**
     * Cancel booking (with reason)
     */
    async cancelBooking(bookingId: string, reason: string) {
        return await this.updateBookingStatus(bookingId, 'CANCELLED', reason);
    }

    // ==================== PRE-RESERVED BOOKING METHODS ====================

    /**
     * Create a pre-reserved guest user with booking number in name
     */
    private async createPreReservedGuestUser(bookingNumber: string): Promise<string> {
        const guestName = `Guest - ${bookingNumber}`;

        const newUser = await prisma.user.create({
            data: {
                name: guestName,
                platform: 'Mobile',
                isVerified: false,
                userApplicationData: {
                    create: {
                        isGuestUser: true,
                    },
                },
            },
        });

        logger.info(`Created pre-reserved guest user: ${newUser.id} with name: ${guestName}`);
        return newUser.id;
    }

    /**
     * Pre-reserve bookings for non-seated events
     * Creates N bookings with N guest users
     */
    async preReserveNonSeatedBookings(
        adminId: string,
        input: PreReserveNonSeatedInput
    ) {
        try {
            // 1. Validate event
            const event = await this.validateEvent(input.eventId);

            // 2. Verify event is non-seated
            if (event.haveSeats) {
                throw new BadRequestException(
                    'This event requires seat selection. Please use seated pre-reserve endpoint.'
                );
            }

            // 3. Calculate pricing
            const unitPrice = this.getEventPrice(event, input.unitPrice);

            // 4. Generate all booking numbers at once to ensure uniqueness
            const bookingNumbers = await bookingRepository.generateBulkBookingNumbers(input.quantity);

            // 5. Create bookings data with unique booking numbers
            const bookingsData: Array<{
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
            }> = [];

            // Create guest users with unique booking numbers
            for (let i = 0; i < input.quantity; i++) {
                const bookingNumber = bookingNumbers[i];
                const userId = await this.createPreReservedGuestUser(bookingNumber);

                bookingsData.push({
                    bookingNumber,
                    userId,
                    eventId: input.eventId,
                    quantity: 1, // Each booking is for 1 unit
                    unitPrice,
                    totalPrice: unitPrice,
                    currency: DEFAULT_CURRENCY,
                    status: 'CONFIRMED',
                    isAdminBooking: true,
                    bookedByAdminId: adminId,
                    isPreReserved: true,
                });
            }

            // 6. Create all bookings
            const bookings = await bookingRepository.createBulkPreReservedBookings(bookingsData);

            logger.info(
                `Pre-reserved ${bookings.length} non-seated bookings for event ${input.eventId} by admin ${adminId}`
            );

            // 7. Get bookings with details
            const bookingsWithDetails = await Promise.all(
                bookings.map((b) => bookingRepository.findByIdWithFullDetails(b.id))
            );

            return {
                success: true,
                message: `Successfully pre-reserved ${bookings.length} bookings`,
                data: {
                    bookings: bookingsWithDetails,
                    totalCreated: bookings.length,
                    unitPrice,
                    totalValue: unitPrice * bookings.length,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Pre-reserve non-seated bookings error:', error);
            throw new BadRequestException('Failed to pre-reserve bookings');
        }
    }

    /**
     * Pre-reserve bookings for seated events
     * Each seat creates a separate booking with its own guest user
     */
    async preReserveSeatedBookings(
        adminId: string,
        input: PreReserveSeatedInput
    ) {
        try {
            // 1. Validate event
            const event = await this.validateEvent(input.eventId);

            // 2. Verify event is seated
            if (!event.haveSeats) {
                throw new BadRequestException(
                    'This event does not require seat selection. Please use non-seated pre-reserve endpoint.'
                );
            }

            // 3. Validate schedule
            await this.validateSchedule(input.scheduleId, input.eventId);

            // 4. Get seat IDs
            const seatIds = input.seats.map((s) => s.seatId);

            // 5. Check seat availability
            const availability = await bookingRepository.checkSeatsAvailability(
                seatIds,
                input.scheduleId
            );

            if (!availability.available) {
                throw new ConflictException(
                    `The following seats are already reserved for this schedule: ${availability.reservedSeats.join(', ')}`
                );
            }

            // 6. Get seat details
            const seatDetails = await bookingRepository.getSeatDetails(seatIds);

            if (seatDetails.length !== seatIds.length) {
                const foundIds = seatDetails.map((s) => s.id);
                const missingIds = seatIds.filter((id) => !foundIds.includes(id));
                throw new NotFoundException(`Seats not found: ${missingIds.join(', ')}`);
            }

            // 7. Calculate pricing
            let unitPrice: number;

            if (input.unitPrice !== undefined) {
                unitPrice = input.unitPrice;
            } else {
                // Get zone pricing from first seat
                const firstSeat = seatDetails[0];
                const locationZoneId = firstSeat.row.section.locationZone.id;

                const zonePricing = await bookingRepository.getZonePricing(
                    locationZoneId,
                    input.eventId,
                    input.scheduleId
                );

                if (!zonePricing) {
                    throw new BadRequestException(
                        'Zone pricing not configured for this event schedule. Please configure zone pricing or provide a custom price.'
                    );
                }

                unitPrice = zonePricing.discountedPrice ?? zonePricing.originalPrice;
            }

            // 8. Create bookings - one per seat
            const bookings = [];
            const seatsBooked: string[] = [];

            for (const seat of seatDetails) {
                const bookingNumber = await bookingRepository.generateBookingNumber();
                const userId = await this.createPreReservedGuestUser(bookingNumber);

                const booking = await bookingRepository.createPreReservedBookingWithSeat({
                    bookingNumber,
                    userId,
                    eventId: input.eventId,
                    scheduleId: input.scheduleId,
                    quantity: 1,
                    unitPrice,
                    totalPrice: unitPrice,
                    currency: DEFAULT_CURRENCY,
                    status: 'CONFIRMED',
                    isAdminBooking: true,
                    bookedByAdminId: adminId,
                    isPreReserved: true,
                    seat: {
                        seatId: seat.id,
                        zoneType: seat.row.section.locationZone.zone.type,
                        sectionPosition: seat.row.section.position,
                        rowNumber: seat.row.rowNumber,
                        seatNumber: seat.seatNumber,
                    },
                });

                bookings.push(booking);
                seatsBooked.push(seat.seatLabel);
            }

            logger.info(
                `Pre-reserved ${bookings.length} seated bookings for event ${input.eventId} by admin ${adminId}`
            );

            // 9. Get bookings with details
            const bookingsWithDetails = await Promise.all(
                bookings.map((b) => bookingRepository.findByIdWithFullDetails(b.id))
            );

            return {
                success: true,
                message: `Successfully pre-reserved ${bookings.length} seated bookings`,
                data: {
                    bookings: bookingsWithDetails,
                    totalCreated: bookings.length,
                    seatsBooked,
                    unitPrice,
                    totalValue: unitPrice * bookings.length,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Pre-reserve seated bookings error:', error);
            throw new BadRequestException('Failed to pre-reserve seated bookings');
        }
    }

    /**
     * Main pre-reserve method
     * Automatically determines booking type based on event's haveSeats property
     */
    async preReserveBookings(adminId: string, input: PreReserveBookingInput) {
        const event = await this.validateEvent(input.eventId);

        if (event.haveSeats) {
            if (!('scheduleId' in input) || !('seats' in input)) {
                throw new BadRequestException(
                    'This event requires seat selection. Please provide scheduleId and seats array.'
                );
            }
            return await this.preReserveSeatedBookings(adminId, input as PreReserveSeatedInput);
        } else {
            if (!('quantity' in input)) {
                throw new BadRequestException(
                    'This event requires quantity. Please provide quantity field.'
                );
            }
            return await this.preReserveNonSeatedBookings(adminId, input as PreReserveNonSeatedInput);
        }
    }

    /**
     * Get or create user for booking assignment
     * If user with email/phone exists, return existing user
     * Otherwise create new user
     */
    private async getOrCreateUserForAssignment(userInfo: {
        name?: string;
        email?: string | null;
        phoneNumber?: string | null;
        countryCodeId?: string | null;
    }): Promise<{ userId: string; isNewUser: boolean }> {
        let existingUser = null;

        // Normalize email to lowercase for case-insensitive matching
        const normalizedEmail = userInfo.email?.toLowerCase().trim();

        // Check by email first (case-insensitive)
        if (normalizedEmail) {
            existingUser = await prisma.user.findFirst({
                where: {
                    email: {
                        equals: normalizedEmail,
                        mode: 'insensitive',
                    },
                },
                select: { id: true, name: true },
            });

            logger.info(`Searching for user by email: ${normalizedEmail}, found: ${existingUser?.id || 'none'}`);
        }

        // Check by phone if not found by email
        if (!existingUser && userInfo.phoneNumber) {
            existingUser = await prisma.user.findUnique({
                where: { phoneNumber: userInfo.phoneNumber },
                select: { id: true, name: true },
            });

            logger.info(`Searching for user by phone: ${userInfo.phoneNumber}, found: ${existingUser?.id || 'none'}`);
        }

        if (existingUser) {
            // Optionally update name if provided and user has no name
            if (userInfo.name && !existingUser.name) {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { name: userInfo.name },
                });
            }
            logger.info(`Found existing user ${existingUser.id} for booking assignment`);
            return { userId: existingUser.id, isNewUser: false };
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                name: userInfo.name || 'Guest',
                email: normalizedEmail || undefined,
                phoneNumber: userInfo.phoneNumber || undefined,
                countryCodeId: userInfo.countryCodeId || undefined,
                platform: 'Mobile',
                isVerified: false,
                userApplicationData: {
                    create: {
                        isGuestUser: false, // Not a temporary guest user
                    },
                },
            },
        });

        logger.info(`Created new user ${newUser.id} for booking assignment`);
        return { userId: newUser.id, isNewUser: true };
    }

    /**
     * Assign a single pre-reserved booking to a user
     */
    async assignBooking(bookingId: string, input: AssignBookingInput) {
        try {
            // 1. Verify booking exists and is pre-reserved
            const booking = await bookingRepository.findPreReservedById(bookingId);

            if (!booking) {
                throw new NotFoundException('Pre-reserved booking not found or already assigned');
            }

            // 2. Get or create user
            const { userId: newUserId, isNewUser } = await this.getOrCreateUserForAssignment(
                input.userInfo
            );

            // 3. Assign booking to user
            const { previousUserId } = await bookingRepository.assignBookingToUser(
                bookingId,
                newUserId
            );

            // 4. Clean up old guest user if unused
            const wasDeleted = await bookingRepository.deleteGuestUserIfUnused(previousUserId);
            if (wasDeleted) {
                logger.info(`Deleted unused guest user: ${previousUserId}`);
            }

            logger.info(
                `Booking ${bookingId} assigned to user ${newUserId} (isNewUser: ${isNewUser})`
            );

            // 5. Get updated booking with details
            const bookingWithDetails = await bookingRepository.findByIdWithFullDetails(bookingId);

            return {
                success: true,
                message: 'Booking assigned successfully',
                data: {
                    booking: bookingWithDetails,
                    isNewUser,
                    previousGuestUserDeleted: wasDeleted,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Assign booking error:', error);
            throw new BadRequestException('Failed to assign booking');
        }
    }

    /**
     * Bulk assign pre-reserved bookings to users
     */
    async assignBulkBookings(input: AssignBulkBookingsInput) {
        try {
            const results: Array<{
                bookingId: string;
                success: boolean;
                message: string;
                isNewUser?: boolean;
                previousGuestUserDeleted?: boolean;
            }> = [];

            let successCount = 0;
            let failCount = 0;

            for (const assignment of input.assignments) {
                try {
                    // 1. Verify booking exists and is pre-reserved
                    const booking = await bookingRepository.findPreReservedById(assignment.bookingId);

                    if (!booking) {
                        results.push({
                            bookingId: assignment.bookingId,
                            success: false,
                            message: 'Pre-reserved booking not found or already assigned',
                        });
                        failCount++;
                        continue;
                    }

                    // 2. Get or create user
                    const { userId: newUserId, isNewUser } = await this.getOrCreateUserForAssignment(
                        assignment.userInfo
                    );

                    // 3. Assign booking to user
                    const { previousUserId } = await bookingRepository.assignBookingToUser(
                        assignment.bookingId,
                        newUserId
                    );

                    // 4. Clean up old guest user if unused
                    const wasDeleted = await bookingRepository.deleteGuestUserIfUnused(previousUserId);

                    results.push({
                        bookingId: assignment.bookingId,
                        success: true,
                        message: 'Booking assigned successfully',
                        isNewUser,
                        previousGuestUserDeleted: wasDeleted,
                    });
                    successCount++;

                    logger.info(
                        `Bulk assignment: Booking ${assignment.bookingId} assigned to user ${newUserId}`
                    );
                } catch (error: any) {
                    results.push({
                        bookingId: assignment.bookingId,
                        success: false,
                        message: error.message || 'Failed to assign booking',
                    });
                    failCount++;
                    logger.error(`Bulk assignment error for booking ${assignment.bookingId}:`, error);
                }
            }

            return {
                success: failCount === 0,
                message: `Bulk assignment completed: ${successCount} successful, ${failCount} failed`,
                data: {
                    results,
                    summary: {
                        total: input.assignments.length,
                        successful: successCount,
                        failed: failCount,
                    },
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Bulk assign bookings error:', error);
            throw new BadRequestException('Failed to process bulk assignment');
        }
    }
}

export default new DashboardBookingService();
