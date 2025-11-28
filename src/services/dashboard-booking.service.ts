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
    GuestUserInfo,
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

        if (userInfo.email) {
            existingUser = await prisma.user.findUnique({
                where: { email: userInfo.email },
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
                email: userInfo.email || undefined,
                phoneNumber: userInfo.phoneNumber || undefined,
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
}

export default new DashboardBookingService();
