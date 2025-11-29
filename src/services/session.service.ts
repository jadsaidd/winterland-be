import { SeatsSessionStatus, SectionPosition, ZoneType } from '@prisma/client';

import { config } from '../config';
import { BadRequestException, ConflictException, NotFoundException } from '../exceptions/http.exception';
import { SessionRepository } from '../repositories/session.repository';

export class SessionService {
    private sessionRepository = new SessionRepository();

    /**
     * Create a new session for seat selection
     * Only one pending session allowed per user per event+schedule
     */
    async createSession(userId: string, eventId: string, scheduleId: string) {
        // Validate that the event exists and the schedule belongs to it
        const event = await this.sessionRepository.findEventWithSchedules(eventId);
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Check if event has seats (sessions only make sense for seated events)
        if (!event.haveSeats) {
            throw new BadRequestException('Sessions are only available for seated events');
        }

        const scheduleExists = event.schedules.some((schedule: { id: string }) => schedule.id === scheduleId);
        if (!scheduleExists) {
            throw new BadRequestException('Schedule not found for this event');
        }

        // Check if user already has a pending session for this event+schedule
        const existingSession = await this.sessionRepository.findPendingSession(userId, eventId, scheduleId);
        if (existingSession) {
            // Return existing session instead of creating a new one
            return {
                session: existingSession,
                sessionUrl: `${config.CLIENT_SESSION_URL}?eventId=${eventId}&scheduleId=${scheduleId}&sessionId=${existingSession.id}`,
                isExisting: true,
            };
        }

        // Generate a unique code
        const code = await this.sessionRepository.generateUniqueCode();

        // Create the session
        const session = await this.sessionRepository.create({
            userId,
            eventId,
            scheduleId,
            code,
        });

        return {
            session: session,
            sessionUrl: `${config.CLIENT_SESSION_URL}?eventId=${eventId}&scheduleId=${scheduleId}&sessionId=${session.id}`,
            isExisting: false,
        };
    }

    /**
     * Get session by ID with full details
     * Validates that session belongs to user and is pending
     */
    async getSession(userId: string, sessionId: string) {
        const session = await this.sessionRepository.findByIdWithDetails(sessionId);

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.userId !== userId) {
            throw new BadRequestException('Session does not belong to this user');
        }

        // Format the response with seat details
        const formattedSeats = session.seatsSessions.map((seatSession: {
            id: string;
            seat: {
                id: string;
                seatLabel: string;
                seatNumber: number;
                row: {
                    rowNumber: number;
                    section: {
                        position: SectionPosition;
                        locationZone: {
                            zone: { type: ZoneType };
                            zonePricings: Array<{
                                originalPrice: number;
                                discountedPrice: number | null;
                                eventId: string;
                                scheduleId: string;
                            }>;
                        };
                    };
                };
            };
        }) => {
            const seat = seatSession.seat;
            const row = seat.row;
            const section = row.section;
            const locationZone = section.locationZone;
            const zone = locationZone.zone;

            // Find pricing for this event and schedule
            const pricing = locationZone.zonePricings.find(
                (p: { eventId: string; scheduleId: string }) =>
                    p.eventId === session.eventId && p.scheduleId === session.scheduleId
            );

            return {
                id: seatSession.id,
                seatId: seat.id,
                seatLabel: seat.seatLabel,
                seatNumber: seat.seatNumber,
                rowNumber: row.rowNumber,
                sectionPosition: section.position,
                zoneType: zone.type,
                price: pricing?.discountedPrice ?? pricing?.originalPrice ?? null,
                originalPrice: pricing?.originalPrice ?? null,
                discountedPrice: pricing?.discountedPrice ?? null,
            };
        });

        // Calculate total price
        const totalPrice = formattedSeats.reduce(
            (sum: number, seat: { price: number | null }) => sum + (seat.price ?? 0),
            0
        );

        return {
            id: session.id,
            code: session.code,
            status: session.status,
            event: session.event,
            schedule: session.schedule,
            seats: formattedSeats,
            totalSeats: formattedSeats.length,
            totalPrice,
            currency: 'AED',
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        };
    }

    /**
     * Toggle seat in session (add if not exists, remove if exists)
     */
    async toggleSeat(
        userId: string,
        sessionId: string,
        seatData: {
            zoneType: ZoneType;
            sectionPosition: SectionPosition;
            rowNumber: number;
            seatNumber: number;
        }
    ) {
        // Get session and validate
        const session = await this.sessionRepository.findByIdWithDetails(sessionId);

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.userId !== userId) {
            throw new BadRequestException('Session does not belong to this user');
        }

        if (session.status !== SeatsSessionStatus.PENDING) {
            throw new BadRequestException('Session is no longer active');
        }

        // Get event with location to find the seat
        const event = await this.sessionRepository.getEventWithLocation(session.eventId);
        if (!event || !event.location) {
            throw new NotFoundException('Event or location not found');
        }

        // Find the seat by location details
        const seat = await this.sessionRepository.findSeatByLocationDetails(
            event.location.id,
            seatData.zoneType,
            seatData.sectionPosition,
            seatData.rowNumber,
            seatData.seatNumber
        );

        if (!seat) {
            throw new NotFoundException(
                `Seat not found: ${seatData.zoneType}-${seatData.sectionPosition}-Row${seatData.rowNumber}-Seat${seatData.seatNumber}`
            );
        }

        // Check if seat is already in this session
        const existingSeatSession = await this.sessionRepository.findSeatSession(sessionId, seat.id);

        if (existingSeatSession) {
            // Remove the seat from session
            await this.sessionRepository.removeSeatFromSession(existingSeatSession.id);

            return {
                action: 'removed',
                seat: {
                    seatId: seat.id,
                    seatLabel: seat.seatLabel,
                    seatNumber: seat.seatNumber,
                    rowNumber: seat.row.rowNumber,
                    sectionPosition: seat.row.section.position,
                    zoneType: seat.row.section.locationZone.zone.type,
                },
            };
        }

        // Check if seat is already booked (in BookingSeat)
        const isBooked = await this.sessionRepository.isSeatBooked(seat.id, session.scheduleId);
        if (isBooked) {
            throw new ConflictException('This seat is already reserved');
        }

        // Add seat to session
        const newSeatSession = await this.sessionRepository.addSeatToSession(sessionId, seat.id);

        return {
            action: 'added',
            seat: {
                id: newSeatSession.id,
                seatId: seat.id,
                seatLabel: seat.seatLabel,
                seatNumber: seat.seatNumber,
                rowNumber: seat.row.rowNumber,
                sectionPosition: seat.row.section.position,
                zoneType: seat.row.section.locationZone.zone.type,
            },
        };
    }

    /**
     * Remove a specific seat from session
     */
    async removeSeat(
        userId: string,
        sessionId: string,
        seatData: {
            zoneType: ZoneType;
            sectionPosition: SectionPosition;
            rowNumber: number;
            seatNumber: number;
        }
    ) {
        // Get session and validate
        const session = await this.sessionRepository.findById(sessionId);

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.userId !== userId) {
            throw new BadRequestException('Session does not belong to this user');
        }

        if (session.status !== SeatsSessionStatus.PENDING) {
            throw new BadRequestException('Session is no longer active');
        }

        // Get event with location
        const event = await this.sessionRepository.getEventWithLocation(session.eventId);
        if (!event || !event.location) {
            throw new NotFoundException('Event or location not found');
        }

        // Find the seat
        const seat = await this.sessionRepository.findSeatByLocationDetails(
            event.location.id,
            seatData.zoneType,
            seatData.sectionPosition,
            seatData.rowNumber,
            seatData.seatNumber
        );

        if (!seat) {
            throw new NotFoundException('Seat not found');
        }

        // Find seat in session
        const seatSession = await this.sessionRepository.findSeatSession(sessionId, seat.id);

        if (!seatSession) {
            throw new NotFoundException('Seat is not in this session');
        }

        // Remove the seat
        await this.sessionRepository.removeSeatFromSession(seatSession.id);

        return {
            message: 'Seat removed from session',
            seat: {
                seatId: seat.id,
                seatLabel: seat.seatLabel,
                seatNumber: seat.seatNumber,
                rowNumber: seat.row.rowNumber,
                sectionPosition: seat.row.section.position,
                zoneType: seat.row.section.locationZone.zone.type,
            },
        };
    }

    /**
     * Cancel a session (set status to CANCELLED and clear seats)
     */
    async cancelSession(userId: string, sessionId: string) {
        const session = await this.sessionRepository.findById(sessionId);

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.userId !== userId) {
            throw new BadRequestException('Session does not belong to this user');
        }

        if (session.status !== SeatsSessionStatus.PENDING) {
            throw new BadRequestException('Session is already completed or cancelled');
        }

        // Clear all seats from session
        await this.sessionRepository.clearSessionSeats(sessionId);

        // Update session status
        const updatedSession = await this.sessionRepository.updateStatus(sessionId, SeatsSessionStatus.CANCELLED);

        return {
            message: 'Session cancelled successfully',
            session: updatedSession,
        };
    }

    /**
     * Clear all seats from a session (keep session active)
     */
    async clearSessionSeats(userId: string, sessionId: string) {
        const session = await this.sessionRepository.findById(sessionId);

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.userId !== userId) {
            throw new BadRequestException('Session does not belong to this user');
        }

        if (session.status !== SeatsSessionStatus.PENDING) {
            throw new BadRequestException('Session is no longer active');
        }

        await this.sessionRepository.clearSessionSeats(sessionId);

        return {
            message: 'All seats cleared from session',
        };
    }
}

