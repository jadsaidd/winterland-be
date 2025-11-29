import { SeatsSessionStatus, SectionPosition, ZoneType } from '@prisma/client';

import prisma from '../utils/prisma.client';

export class SessionRepository {
    /**
     * Create a new session
     */
    async create(data: { userId: string; eventId: string; scheduleId: string; code: string }) {
        return prisma.session.create({
            data,
        });
    }

    /**
     * Generate a unique session code
     */
    async generateUniqueCode(): Promise<string> {
        const crypto = await import('crypto');
        let code: string;
        let exists: boolean;
        do {
            code = crypto.randomBytes(12).toString('hex').toUpperCase();
            exists = await prisma.session.findUnique({ where: { code } }) !== null;
        } while (exists);
        return code;
    }

    /**
     * Find event with schedules for validation
     */
    async findEventWithSchedules(eventId: string) {
        return prisma.event.findUnique({
            where: { id: eventId },
            include: {
                schedules: {
                    select: { id: true },
                },
            },
        });
    }

    /**
     * Find pending session for a user on specific event and schedule
     */
    async findPendingSession(userId: string, eventId: string, scheduleId: string) {
        return prisma.session.findFirst({
            where: {
                userId,
                eventId,
                scheduleId,
                status: SeatsSessionStatus.PENDING,
            },
            include: {
                seatsSessions: {
                    include: {
                        seat: {
                            include: {
                                row: {
                                    include: {
                                        section: {
                                            include: {
                                                locationZone: {
                                                    include: {
                                                        zone: true,
                                                    },
                                                },
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
     * Find session by ID
     */
    async findById(sessionId: string) {
        return prisma.session.findUnique({
            where: { id: sessionId },
        });
    }

    /**
     * Find session by ID with full details including seats
     */
    async findByIdWithDetails(sessionId: string) {
        return prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                event: {
                    select: {
                        id: true,
                        name: true,
                        eventSlug: true,
                        haveSeats: true,
                        locationId: true,
                    },
                },
                schedule: {
                    select: {
                        id: true,
                        startAt: true,
                        endAt: true,
                    },
                },
                seatsSessions: {
                    include: {
                        seat: {
                            include: {
                                row: {
                                    include: {
                                        section: {
                                            include: {
                                                locationZone: {
                                                    include: {
                                                        zone: true,
                                                        zonePricings: {
                                                            select: {
                                                                originalPrice: true,
                                                                discountedPrice: true,
                                                                eventId: true,
                                                                scheduleId: true,
                                                            },
                                                        },
                                                    },
                                                },
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
     * Update session status
     */
    async updateStatus(sessionId: string, status: SeatsSessionStatus) {
        return prisma.session.update({
            where: { id: sessionId },
            data: { status },
        });
    }

    /**
     * Find seat by location details (zoneType, sectionPosition, rowNumber, seatNumber)
     * The seat must belong to the event's location
     */
    async findSeatByLocationDetails(
        locationId: string,
        zoneType: ZoneType,
        sectionPosition: SectionPosition,
        rowNumber: number,
        seatNumber: number
    ) {
        return prisma.locationSeat.findFirst({
            where: {
                seatNumber,
                row: {
                    rowNumber,
                    section: {
                        position: sectionPosition,
                        locationZone: {
                            locationId,
                            zone: {
                                type: zoneType,
                            },
                        },
                    },
                },
            },
            include: {
                row: {
                    include: {
                        section: {
                            include: {
                                locationZone: {
                                    include: {
                                        zone: true,
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
     * Check if seat is already booked for a schedule
     */
    async isSeatBooked(seatId: string, scheduleId: string): Promise<boolean> {
        const bookingSeat = await prisma.bookingSeat.findUnique({
            where: {
                scheduleId_seatId: {
                    scheduleId,
                    seatId,
                },
            },
        });
        return bookingSeat !== null && bookingSeat.isReserved;
    }

    /**
     * Find seat session item by session and seat
     */
    async findSeatSession(sessionId: string, seatId: string) {
        return prisma.seatsSession.findFirst({
            where: {
                sessionId,
                seatId,
            },
        });
    }

    /**
     * Add seat to session
     */
    async addSeatToSession(sessionId: string, seatId: string) {
        return prisma.seatsSession.create({
            data: {
                sessionId,
                seatId,
            },
            include: {
                seat: {
                    include: {
                        row: {
                            include: {
                                section: {
                                    include: {
                                        locationZone: {
                                            include: {
                                                zone: true,
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
     * Remove seat from session
     */
    async removeSeatFromSession(seatsSessionId: string) {
        return prisma.seatsSession.delete({
            where: { id: seatsSessionId },
        });
    }

    /**
     * Get all seats in a session
     */
    async getSessionSeats(sessionId: string) {
        return prisma.seatsSession.findMany({
            where: { sessionId },
            include: {
                seat: {
                    include: {
                        row: {
                            include: {
                                section: {
                                    include: {
                                        locationZone: {
                                            include: {
                                                zone: true,
                                                zonePricings: {
                                                    select: {
                                                        originalPrice: true,
                                                        discountedPrice: true,
                                                        eventId: true,
                                                        scheduleId: true,
                                                    },
                                                },
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
     * Clear all seats from a session
     */
    async clearSessionSeats(sessionId: string) {
        return prisma.seatsSession.deleteMany({
            where: { sessionId },
        });
    }

    /**
     * Get event with location for validation
     */
    async getEventWithLocation(eventId: string) {
        return prisma.event.findUnique({
            where: { id: eventId },
            include: {
                location: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
}