import { SectionPosition, ZoneType } from '@prisma/client';

import prisma from '../utils/prisma.client';

/**
 * Zone with pricing and section summary
 */
export interface ZoneWithPricing {
    id: string;
    locationZoneId: string;
    type: ZoneType;
    priority: number;
    pricing: {
        originalPrice: number;
        discountedPrice: number | null;
    } | null;
    sections: Array<{
        id: string;
        position: SectionPosition;
        totalSeats: number;
        availableSeats: number;
    }>;
    totalSeats: number;
    availableSeats: number;
}

/**
 * Section with rows summary
 */
export interface SectionWithRows {
    id: string;
    position: SectionPosition;
    numberOfRows: number;
    locationZoneId: string;
    zone: {
        id: string;
        type: ZoneType;
        priority: number;
    };
    pricing: {
        originalPrice: number;
        discountedPrice: number | null;
    } | null;
    rows: Array<{
        id: string;
        rowNumber: number;
        order: number;
        totalSeats: number;
        availableSeats: number;
    }>;
    totalSeats: number;
    availableSeats: number;
}

/**
 * Row with seats
 */
export interface RowWithSeats {
    id: string;
    rowNumber: number;
    order: number;
    sectionId: string;
    section: {
        id: string;
        position: SectionPosition;
        locationZone: {
            id: string;
            zone: {
                id: string;
                type: ZoneType;
                priority: number;
            };
        };
    };
    pricing: {
        originalPrice: number;
        discountedPrice: number | null;
    } | null;
    seats: Array<{
        id: string;
        seatNumber: number;
        seatLabel: string;
        isAvailable: boolean;
    }>;
    totalSeats: number;
    availableSeats: number;
}

/**
 * Seat with availability
 */
export interface SeatWithAvailability {
    id: string;
    seatNumber: number;
    seatLabel: string;
    isAvailable: boolean;
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
    pricing: {
        originalPrice: number;
        discountedPrice: number | null;
    } | null;
}

/**
 * Full seat map structure for an event/schedule
 */
export interface SeatMap {
    eventId: string;
    scheduleId: string;
    locationId: string;
    zones: Array<{
        id: string;
        locationZoneId: string;
        type: ZoneType;
        priority: number;
        pricing: {
            originalPrice: number;
            discountedPrice: number | null;
        } | null;
        sections: Array<{
            id: string;
            position: SectionPosition;
            rows: Array<{
                id: string;
                rowNumber: number;
                order: number;
                seats: Array<{
                    id: string;
                    seatNumber: number;
                    seatLabel: string;
                    isAvailable: boolean;
                }>;
            }>;
        }>;
        totalSeats: number;
        availableSeats: number;
    }>;
    summary: {
        totalSeats: number;
        availableSeats: number;
        reservedSeats: number;
    };
}

/**
 * Seat Selection Repository
 * Handles database operations for seat selection flow
 */
export class SeatSelectionRepository {
    /**
     * Get all zones for an event/schedule with availability summary
     * This is the first level of the seat selection hierarchy
     */
    async getZonesForSchedule(
        eventId: string,
        scheduleId: string,
        locationId: string
    ): Promise<ZoneWithPricing[]> {
        // Get all location zones with their sections
        const locationZones = await prisma.locationZone.findMany({
            where: {
                locationId,
            },
            include: {
                zone: {
                    select: {
                        id: true,
                        type: true,
                        priority: true,
                    },
                },
                locationSections: {
                    select: {
                        id: true,
                        position: true,
                        locationRows: {
                            select: {
                                id: true,
                                seats: {
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                        },
                    },
                },
                zonePricings: {
                    where: {
                        eventId,
                        scheduleId,
                    },
                    select: {
                        originalPrice: true,
                        discountedPrice: true,
                    },
                    take: 1,
                },
            },
            orderBy: {
                zone: {
                    priority: 'asc',
                },
            },
        });

        // Get all reserved seats for this schedule
        const reservedSeats = await prisma.bookingSeat.findMany({
            where: {
                scheduleId,
                isReserved: true,
            },
            select: {
                seatId: true,
            },
        });

        const reservedSeatIds = new Set(reservedSeats.map((s: { seatId: string }) => s.seatId));

        // Build zone response with availability
        return locationZones.map((lz: typeof locationZones[number]) => {
            const sections = lz.locationSections.map((section: typeof lz.locationSections[number]) => {
                const allSeats = section.locationRows.flatMap((row: typeof section.locationRows[number]) => row.seats);
                const totalSeats = allSeats.length;
                const availableSeats = allSeats.filter((s: { id: string }) => !reservedSeatIds.has(s.id)).length;

                return {
                    id: section.id,
                    position: section.position,
                    totalSeats,
                    availableSeats,
                };
            });

            const totalSeats = sections.reduce((sum: number, s: { totalSeats: number }) => sum + s.totalSeats, 0);
            const availableSeats = sections.reduce((sum: number, s: { availableSeats: number }) => sum + s.availableSeats, 0);

            return {
                id: lz.zone.id,
                locationZoneId: lz.id,
                type: lz.zone.type,
                priority: lz.zone.priority,
                pricing: lz.zonePricings[0]
                    ? {
                        originalPrice: lz.zonePricings[0].originalPrice,
                        discountedPrice: lz.zonePricings[0].discountedPrice,
                    }
                    : null,
                sections,
                totalSeats,
                availableSeats,
            };
        });
    }

    /**
     * Get sections for a specific zone with availability
     * Second level of seat selection hierarchy
     */
    async getSectionsForZone(
        locationZoneId: string,
        eventId: string,
        scheduleId: string
    ): Promise<SectionWithRows[]> {
        const sections = await prisma.locationSection.findMany({
            where: {
                locationZoneId,
            },
            include: {
                locationZone: {
                    include: {
                        zone: {
                            select: {
                                id: true,
                                type: true,
                                priority: true,
                            },
                        },
                        zonePricings: {
                            where: {
                                eventId,
                                scheduleId,
                            },
                            select: {
                                originalPrice: true,
                                discountedPrice: true,
                            },
                            take: 1,
                        },
                    },
                },
                locationRows: {
                    select: {
                        id: true,
                        rowNumber: true,
                        order: true,
                        seats: {
                            select: {
                                id: true,
                            },
                        },
                    },
                    orderBy: {
                        rowNumber: 'asc',
                    },
                },
            },
            orderBy: {
                position: 'asc',
            },
        });

        // Get reserved seats
        const allSeatIds = sections.flatMap((s: typeof sections[number]) =>
            s.locationRows.flatMap((r: typeof s.locationRows[number]) => r.seats.map((seat: { id: string }) => seat.id))
        );

        const reservedSeats = await prisma.bookingSeat.findMany({
            where: {
                scheduleId,
                seatId: { in: allSeatIds },
                isReserved: true,
            },
            select: {
                seatId: true,
            },
        });

        const reservedSeatIds = new Set(reservedSeats.map((s: { seatId: string }) => s.seatId));

        return sections.map((section: typeof sections[number]) => {
            const rows = section.locationRows.map((row: typeof section.locationRows[number]) => {
                const totalSeats = row.seats.length;
                const availableSeats = row.seats.filter((s: { id: string }) => !reservedSeatIds.has(s.id)).length;

                return {
                    id: row.id,
                    rowNumber: row.rowNumber,
                    order: row.order,
                    totalSeats,
                    availableSeats,
                };
            });

            const totalSeats = rows.reduce((sum: number, r: { totalSeats: number }) => sum + r.totalSeats, 0);
            const availableSeats = rows.reduce((sum: number, r: { availableSeats: number }) => sum + r.availableSeats, 0);

            return {
                id: section.id,
                position: section.position,
                numberOfRows: section.numberOfRows,
                locationZoneId: section.locationZoneId,
                zone: section.locationZone.zone,
                pricing: section.locationZone.zonePricings[0]
                    ? {
                        originalPrice: section.locationZone.zonePricings[0].originalPrice,
                        discountedPrice: section.locationZone.zonePricings[0].discountedPrice,
                    }
                    : null,
                rows,
                totalSeats,
                availableSeats,
            };
        });
    }

    /**
     * Get rows for a specific section with seat availability
     * Third level of seat selection hierarchy
     */
    async getRowsForSection(
        sectionId: string,
        eventId: string,
        scheduleId: string
    ): Promise<RowWithSeats[]> {
        const rows = await prisma.locationRow.findMany({
            where: {
                sectionId,
            },
            include: {
                section: {
                    include: {
                        locationZone: {
                            include: {
                                zone: {
                                    select: {
                                        id: true,
                                        type: true,
                                        priority: true,
                                    },
                                },
                                zonePricings: {
                                    where: {
                                        eventId,
                                        scheduleId,
                                    },
                                    select: {
                                        originalPrice: true,
                                        discountedPrice: true,
                                    },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                seats: {
                    select: {
                        id: true,
                        seatNumber: true,
                        seatLabel: true,
                    },
                    orderBy: {
                        seatNumber: 'asc',
                    },
                },
            },
            orderBy: {
                rowNumber: 'asc',
            },
        });

        // Get reserved seats
        const allSeatIds = rows.flatMap((r: typeof rows[number]) => r.seats.map((s: { id: string }) => s.id));

        const reservedSeats = await prisma.bookingSeat.findMany({
            where: {
                scheduleId,
                seatId: { in: allSeatIds },
                isReserved: true,
            },
            select: {
                seatId: true,
            },
        });

        const reservedSeatIds = new Set(reservedSeats.map((s: { seatId: string }) => s.seatId));

        return rows.map((row: typeof rows[number]) => {
            const seats = row.seats.map((seat: typeof row.seats[number]) => ({
                id: seat.id,
                seatNumber: seat.seatNumber,
                seatLabel: seat.seatLabel,
                isAvailable: !reservedSeatIds.has(seat.id),
            }));

            const totalSeats = seats.length;
            const availableSeats = seats.filter((s: { isAvailable: boolean }) => s.isAvailable).length;

            return {
                id: row.id,
                rowNumber: row.rowNumber,
                order: row.order,
                sectionId: row.sectionId,
                section: {
                    id: row.section.id,
                    position: row.section.position,
                    locationZone: {
                        id: row.section.locationZone.id,
                        zone: row.section.locationZone.zone,
                    },
                },
                pricing: row.section.locationZone.zonePricings[0]
                    ? {
                        originalPrice: row.section.locationZone.zonePricings[0].originalPrice,
                        discountedPrice: row.section.locationZone.zonePricings[0].discountedPrice,
                    }
                    : null,
                seats,
                totalSeats,
                availableSeats,
            };
        });
    }

    /**
     * Get all seats for a specific row with availability
     * Fourth (final) level of seat selection hierarchy
     */
    async getSeatsForRow(
        rowId: string,
        eventId: string,
        scheduleId: string
    ): Promise<SeatWithAvailability[]> {
        const seats = await prisma.locationSeat.findMany({
            where: {
                rowId,
            },
            include: {
                row: {
                    include: {
                        section: {
                            include: {
                                locationZone: {
                                    include: {
                                        zone: {
                                            select: {
                                                id: true,
                                                type: true,
                                            },
                                        },
                                        zonePricings: {
                                            where: {
                                                eventId,
                                                scheduleId,
                                            },
                                            select: {
                                                originalPrice: true,
                                                discountedPrice: true,
                                            },
                                            take: 1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                seatNumber: 'asc',
            },
        });

        // Get reserved seats
        const seatIds = seats.map((s: { id: string }) => s.id);

        const reservedSeats = await prisma.bookingSeat.findMany({
            where: {
                scheduleId,
                seatId: { in: seatIds },
                isReserved: true,
            },
            select: {
                seatId: true,
            },
        });

        const reservedSeatIds = new Set(reservedSeats.map((s: { seatId: string }) => s.seatId));

        return seats.map((seat: typeof seats[number]) => ({
            id: seat.id,
            seatNumber: seat.seatNumber,
            seatLabel: seat.seatLabel,
            isAvailable: !reservedSeatIds.has(seat.id),
            row: {
                id: seat.row.id,
                rowNumber: seat.row.rowNumber,
                section: {
                    id: seat.row.section.id,
                    position: seat.row.section.position,
                    locationZone: {
                        id: seat.row.section.locationZone.id,
                        zone: seat.row.section.locationZone.zone,
                    },
                },
            },
            pricing: seat.row.section.locationZone.zonePricings[0]
                ? {
                    originalPrice: seat.row.section.locationZone.zonePricings[0].originalPrice,
                    discountedPrice: seat.row.section.locationZone.zonePricings[0].discountedPrice,
                }
                : null,
        }));
    }

    /**
     * Get full seat map for an event/schedule
     * Returns complete hierarchy: zones -> sections -> rows -> seats
     * Useful for rendering a complete seat map UI
     */
    async getFullSeatMap(
        eventId: string,
        scheduleId: string,
        locationId: string
    ): Promise<SeatMap> {
        // Get all location zones with full hierarchy
        const locationZones = await prisma.locationZone.findMany({
            where: {
                locationId,
            },
            include: {
                zone: {
                    select: {
                        id: true,
                        type: true,
                        priority: true,
                    },
                },
                locationSections: {
                    include: {
                        locationRows: {
                            include: {
                                seats: {
                                    select: {
                                        id: true,
                                        seatNumber: true,
                                        seatLabel: true,
                                    },
                                    orderBy: {
                                        seatNumber: 'asc',
                                    },
                                },
                            },
                            orderBy: {
                                rowNumber: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        position: 'asc',
                    },
                },
                zonePricings: {
                    where: {
                        eventId,
                        scheduleId,
                    },
                    select: {
                        originalPrice: true,
                        discountedPrice: true,
                    },
                    take: 1,
                },
            },
            orderBy: {
                zone: {
                    priority: 'asc',
                },
            },
        });

        // Get all reserved seats for this schedule
        const reservedSeats = await prisma.bookingSeat.findMany({
            where: {
                scheduleId,
                isReserved: true,
            },
            select: {
                seatId: true,
            },
        });

        const reservedSeatIds = new Set(reservedSeats.map((s: { seatId: string }) => s.seatId));

        let totalSeats = 0;
        let availableSeats = 0;

        const zones = locationZones.map((lz: typeof locationZones[number]) => {
            let zoneTotalSeats = 0;
            let zoneAvailableSeats = 0;

            const sections = lz.locationSections.map((section: typeof lz.locationSections[number]) => {
                const rows = section.locationRows.map((row: typeof section.locationRows[number]) => {
                    const seats = row.seats.map((seat: typeof row.seats[number]) => {
                        const isAvailable = !reservedSeatIds.has(seat.id);
                        zoneTotalSeats++;
                        if (isAvailable) zoneAvailableSeats++;

                        return {
                            id: seat.id,
                            seatNumber: seat.seatNumber,
                            seatLabel: seat.seatLabel,
                            isAvailable,
                        };
                    });

                    return {
                        id: row.id,
                        rowNumber: row.rowNumber,
                        order: row.order,
                        seats,
                    };
                });

                return {
                    id: section.id,
                    position: section.position,
                    rows,
                };
            });

            totalSeats += zoneTotalSeats;
            availableSeats += zoneAvailableSeats;

            return {
                id: lz.zone.id,
                locationZoneId: lz.id,
                type: lz.zone.type,
                priority: lz.zone.priority,
                pricing: lz.zonePricings[0]
                    ? {
                        originalPrice: lz.zonePricings[0].originalPrice,
                        discountedPrice: lz.zonePricings[0].discountedPrice,
                    }
                    : null,
                sections,
                totalSeats: zoneTotalSeats,
                availableSeats: zoneAvailableSeats,
            };
        });

        return {
            eventId,
            scheduleId,
            locationId,
            zones,
            summary: {
                totalSeats,
                availableSeats,
                reservedSeats: totalSeats - availableSeats,
            },
        };
    }

    /**
     * Validate that seats exist and get their details
     */
    async validateSeats(seatIds: string[]): Promise<Array<{
        id: string;
        seatLabel: string;
        row: {
            id: string;
            rowNumber: number;
            section: {
                id: string;
                position: SectionPosition;
                locationZone: {
                    id: string;
                    locationId: string;
                    zone: {
                        id: string;
                        type: ZoneType;
                    };
                };
            };
        };
    }>> {
        return await prisma.locationSeat.findMany({
            where: {
                id: { in: seatIds },
            },
            select: {
                id: true,
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
                                        locationId: true,
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
     * Check seat availability for a schedule
     */
    async checkSeatsAvailability(
        seatIds: string[],
        scheduleId: string
    ): Promise<{
        available: boolean;
        unavailableSeats: Array<{
            seatId: string;
            seatLabel: string;
        }>;
    }> {
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
            unavailableSeats: reservedSeats.map((s: typeof reservedSeats[number]) => ({
                seatId: s.seatId,
                seatLabel: s.seat.seatLabel,
            })),
        };
    }

    /**
     * Get event with location info
     */
    async getEventWithLocation(eventId: string): Promise<{
        id: string;
        name: any;
        locationId: string | null;
        haveSeats: boolean;
        active: boolean;
    } | null> {
        return await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                name: true,
                locationId: true,
                haveSeats: true,
                active: true,
            },
        });
    }

    /**
     * Get schedule with event info
     */
    async getScheduleWithEvent(scheduleId: string): Promise<{
        id: string;
        eventId: string;
        startAt: Date;
        endAt: Date;
        event: {
            id: string;
            name: any;
            locationId: string | null;
            haveSeats: boolean;
            active: boolean;
        };
    } | null> {
        return await prisma.schedule.findUnique({
            where: { id: scheduleId },
            select: {
                id: true,
                eventId: true,
                startAt: true,
                endAt: true,
                event: {
                    select: {
                        id: true,
                        name: true,
                        locationId: true,
                        haveSeats: true,
                        active: true,
                    },
                },
            },
        });
    }

    /**
     * Get location zone by ID
     */
    async getLocationZone(locationZoneId: string): Promise<{
        id: string;
        locationId: string;
        zoneId: string;
        zone: {
            type: ZoneType;
        };
    } | null> {
        return await prisma.locationZone.findUnique({
            where: { id: locationZoneId },
            select: {
                id: true,
                locationId: true,
                zoneId: true,
                zone: {
                    select: {
                        type: true,
                    },
                },
            },
        });
    }

    /**
     * Get section by ID
     */
    async getSection(sectionId: string): Promise<{
        id: string;
        position: SectionPosition;
        locationZoneId: string;
        locationZone: {
            locationId: string;
        };
    } | null> {
        return await prisma.locationSection.findUnique({
            where: { id: sectionId },
            select: {
                id: true,
                position: true,
                locationZoneId: true,
                locationZone: {
                    select: {
                        locationId: true,
                    },
                },
            },
        });
    }

    /**
     * Get row by ID
     */
    async getRow(rowId: string): Promise<{
        id: string;
        rowNumber: number;
        sectionId: string;
        section: {
            locationZoneId: string;
            locationZone: {
                locationId: string;
            };
        };
    } | null> {
        return await prisma.locationRow.findUnique({
            where: { id: rowId },
            select: {
                id: true,
                rowNumber: true,
                sectionId: true,
                section: {
                    select: {
                        locationZoneId: true,
                        locationZone: {
                            select: {
                                locationId: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Get all reserved seats for a schedule
     * Returns detailed information about each reserved seat including booking info
     */
    async getReservedSeatsForSchedule(scheduleId: string): Promise<Array<{
        id: string;
        seatId: string;
        isAdminLocked: boolean;
        isReserved: boolean;
        zoneType: ZoneType;
        sectionPosition: SectionPosition;
        rowNumberSnapshot: number;
        seatNumberSnapshot: number;
        createdAt: Date;
        seat: {
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
                            priority: number;
                        };
                    };
                };
            };
        };
        booking: {
            id: string;
            bookingNumber: string;
            status: string;
            isAdminBooking: boolean;
            createdAt: Date;
            user: {
                id: string;
                name: string | null;
                email: string | null;
                phoneNumber: string | null;
            };
        } | null;
        user: {
            id: string;
            name: string | null;
            email: string | null;
            phoneNumber: string | null;
        } | null;
    }>> {
        return await prisma.bookingSeat.findMany({
            where: {
                scheduleId,
                isReserved: true,
            },
            select: {
                id: true,
                seatId: true,
                isAdminLocked: true,
                isReserved: true,
                zoneType: true,
                sectionPosition: true,
                rowNumberSnapshot: true,
                seatNumberSnapshot: true,
                createdAt: true,
                seat: {
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
                                                        priority: true,
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
                booking: {
                    select: {
                        id: true,
                        bookingNumber: true,
                        status: true,
                        isAdminBooking: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phoneNumber: true,
                            },
                        },
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
            orderBy: [
                { seat: { row: { section: { locationZone: { zone: { priority: 'asc' } } } } } },
                { seat: { row: { section: { position: 'asc' } } } },
                { seat: { row: { rowNumber: 'asc' } } },
                { seat: { seatNumber: 'asc' } },
            ],
        });
    }
}

export default new SeatSelectionRepository();
