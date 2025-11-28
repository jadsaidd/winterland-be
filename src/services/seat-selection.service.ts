import { logger } from '../config';
import { BadRequestException, NotFoundException } from '../exceptions/http.exception';
import seatSelectionRepository, {
    RowWithSeats,
    SeatMap,
    SeatWithAvailability,
    SectionWithRows,
    ZoneWithPricing,
} from '../repositories/seat-selection.repository';

/**
 * Seat Selection Service
 * Handles business logic for seat selection flow
 */
export class SeatSelectionService {
    /**
     * Validate schedule exists and get event/location info
     */
    private async validateSchedule(scheduleId: string) {
        const schedule = await seatSelectionRepository.getScheduleWithEvent(scheduleId);

        if (!schedule) {
            throw new NotFoundException('Schedule not found');
        }

        if (!schedule.event.active) {
            throw new BadRequestException('Event is not active');
        }

        if (!schedule.event.haveSeats) {
            throw new BadRequestException('This event does not have seat selection');
        }

        if (!schedule.event.locationId) {
            throw new BadRequestException('Event does not have a location configured');
        }

        return {
            schedule,
            eventId: schedule.eventId,
            locationId: schedule.event.locationId,
        };
    }

    /**
     * Get zones for a schedule with availability info
     * First level of seat selection hierarchy
     */
    async getZonesForSchedule(scheduleId: string): Promise<{
        success: boolean;
        data: {
            eventId: string;
            scheduleId: string;
            locationId: string;
            zones: ZoneWithPricing[];
            summary: {
                totalZones: number;
                totalSeats: number;
                availableSeats: number;
            };
        };
    }> {
        const { eventId, locationId } = await this.validateSchedule(scheduleId);

        const zones = await seatSelectionRepository.getZonesForSchedule(
            eventId,
            scheduleId,
            locationId
        );

        const totalSeats = zones.reduce((sum, z) => sum + z.totalSeats, 0);
        const availableSeats = zones.reduce((sum, z) => sum + z.availableSeats, 0);

        logger.info(`Retrieved ${zones.length} zones for schedule ${scheduleId}`);

        return {
            success: true,
            data: {
                eventId,
                scheduleId,
                locationId,
                zones,
                summary: {
                    totalZones: zones.length,
                    totalSeats,
                    availableSeats,
                },
            },
        };
    }

    /**
     * Get sections for a specific zone with availability
     * Second level of seat selection hierarchy
     */
    async getSectionsForZone(
        scheduleId: string,
        locationZoneId: string
    ): Promise<{
        success: boolean;
        data: {
            eventId: string;
            scheduleId: string;
            locationZoneId: string;
            zoneType: string;
            sections: SectionWithRows[];
            summary: {
                totalSections: number;
                totalSeats: number;
                availableSeats: number;
            };
        };
    }> {
        const { eventId } = await this.validateSchedule(scheduleId);

        // Validate location zone exists
        const locationZone = await seatSelectionRepository.getLocationZone(locationZoneId);
        if (!locationZone) {
            throw new NotFoundException('Location zone not found');
        }

        const sections = await seatSelectionRepository.getSectionsForZone(
            locationZoneId,
            eventId,
            scheduleId
        );

        const totalSeats = sections.reduce((sum, s) => sum + s.totalSeats, 0);
        const availableSeats = sections.reduce((sum, s) => sum + s.availableSeats, 0);

        logger.info(
            `Retrieved ${sections.length} sections for zone ${locationZoneId} in schedule ${scheduleId}`
        );

        return {
            success: true,
            data: {
                eventId,
                scheduleId,
                locationZoneId,
                zoneType: locationZone.zone.type,
                sections,
                summary: {
                    totalSections: sections.length,
                    totalSeats,
                    availableSeats,
                },
            },
        };
    }

    /**
     * Get rows for a specific section with seat availability
     * Third level of seat selection hierarchy
     */
    async getRowsForSection(
        scheduleId: string,
        sectionId: string
    ): Promise<{
        success: boolean;
        data: {
            eventId: string;
            scheduleId: string;
            sectionId: string;
            sectionPosition: string;
            rows: RowWithSeats[];
            summary: {
                totalRows: number;
                totalSeats: number;
                availableSeats: number;
            };
        };
    }> {
        const { eventId } = await this.validateSchedule(scheduleId);

        // Validate section exists
        const section = await seatSelectionRepository.getSection(sectionId);
        if (!section) {
            throw new NotFoundException('Section not found');
        }

        const rows = await seatSelectionRepository.getRowsForSection(
            sectionId,
            eventId,
            scheduleId
        );

        const totalSeats = rows.reduce((sum, r) => sum + r.totalSeats, 0);
        const availableSeats = rows.reduce((sum, r) => sum + r.availableSeats, 0);

        logger.info(
            `Retrieved ${rows.length} rows for section ${sectionId} in schedule ${scheduleId}`
        );

        return {
            success: true,
            data: {
                eventId,
                scheduleId,
                sectionId,
                sectionPosition: section.position,
                rows,
                summary: {
                    totalRows: rows.length,
                    totalSeats,
                    availableSeats,
                },
            },
        };
    }

    /**
     * Get seats for a specific row with availability
     * Fourth (final) level of seat selection hierarchy
     */
    async getSeatsForRow(
        scheduleId: string,
        rowId: string
    ): Promise<{
        success: boolean;
        data: {
            eventId: string;
            scheduleId: string;
            rowId: string;
            rowNumber: number;
            seats: SeatWithAvailability[];
            summary: {
                totalSeats: number;
                availableSeats: number;
            };
        };
    }> {
        const { eventId } = await this.validateSchedule(scheduleId);

        // Validate row exists
        const row = await seatSelectionRepository.getRow(rowId);
        if (!row) {
            throw new NotFoundException('Row not found');
        }

        const seats = await seatSelectionRepository.getSeatsForRow(
            rowId,
            eventId,
            scheduleId
        );

        const availableSeats = seats.filter((s) => s.isAvailable).length;

        logger.info(
            `Retrieved ${seats.length} seats for row ${rowId} in schedule ${scheduleId}`
        );

        return {
            success: true,
            data: {
                eventId,
                scheduleId,
                rowId,
                rowNumber: row.rowNumber,
                seats,
                summary: {
                    totalSeats: seats.length,
                    availableSeats,
                },
            },
        };
    }

    /**
     * Get full seat map for a schedule
     * Returns complete hierarchy for rendering seat map UI
     */
    async getFullSeatMap(scheduleId: string): Promise<{
        success: boolean;
        data: SeatMap;
    }> {
        const { eventId, locationId } = await this.validateSchedule(scheduleId);

        const seatMap = await seatSelectionRepository.getFullSeatMap(
            eventId,
            scheduleId,
            locationId
        );

        logger.info(
            `Retrieved full seat map for schedule ${scheduleId}: ${seatMap.summary.totalSeats} total seats, ${seatMap.summary.availableSeats} available`
        );

        return {
            success: true,
            data: seatMap,
        };
    }

    /**
     * Check availability of specific seats for a schedule
     */
    async checkSeatsAvailability(
        scheduleId: string,
        seatIds: string[]
    ): Promise<{
        success: boolean;
        data: {
            scheduleId: string;
            allAvailable: boolean;
            seats: Array<{
                seatId: string;
                seatLabel: string;
                isAvailable: boolean;
            }>;
            unavailableCount: number;
        };
    }> {
        await this.validateSchedule(scheduleId);

        // First validate seats exist
        const seats = await seatSelectionRepository.validateSeats(seatIds);

        if (seats.length !== seatIds.length) {
            const foundIds = new Set(seats.map((s) => s.id));
            const notFoundIds = seatIds.filter((id) => !foundIds.has(id));
            throw new BadRequestException(
                `The following seat IDs were not found: ${notFoundIds.join(', ')}`
            );
        }

        // Check availability
        const availability = await seatSelectionRepository.checkSeatsAvailability(
            seatIds,
            scheduleId
        );

        const unavailableSeatIds = new Set(availability.unavailableSeats.map((s) => s.seatId));

        const seatsWithAvailability = seats.map((seat) => ({
            seatId: seat.id,
            seatLabel: seat.seatLabel,
            isAvailable: !unavailableSeatIds.has(seat.id),
        }));

        logger.info(
            `Checked availability for ${seatIds.length} seats in schedule ${scheduleId}: ${availability.unavailableSeats.length} unavailable`
        );

        return {
            success: true,
            data: {
                scheduleId,
                allAvailable: availability.available,
                seats: seatsWithAvailability,
                unavailableCount: availability.unavailableSeats.length,
            },
        };
    }

    /**
     * Validate seats for booking
     * Ensures seats exist, belong to same location, and are available
     */
    async validateSeatsForBooking(
        scheduleId: string,
        seatIds: string[]
    ): Promise<{
        success: boolean;
        data: {
            valid: boolean;
            scheduleId: string;
            eventId: string;
            locationId: string;
            seats: Array<{
                id: string;
                seatLabel: string;
                zoneType: string;
                sectionPosition: string;
                rowNumber: number;
                isAvailable: boolean;
            }>;
            allAvailable: boolean;
            unavailableSeats: string[];
        };
    }> {
        const { eventId, locationId } = await this.validateSchedule(scheduleId);

        // Validate seats exist
        const seats = await seatSelectionRepository.validateSeats(seatIds);

        if (seats.length !== seatIds.length) {
            const foundIds = new Set(seats.map((s) => s.id));
            const notFoundIds = seatIds.filter((id) => !foundIds.has(id));
            throw new BadRequestException(
                `The following seat IDs were not found: ${notFoundIds.join(', ')}`
            );
        }

        // Validate all seats belong to the same location
        const seatLocations = new Set(seats.map((s) => s.row.section.locationZone.locationId));
        if (seatLocations.size > 1) {
            throw new BadRequestException('All seats must belong to the same location');
        }

        const seatLocationId = seats[0].row.section.locationZone.locationId;
        if (seatLocationId !== locationId) {
            throw new BadRequestException('Seats do not belong to the event location');
        }

        // Check availability
        const availability = await seatSelectionRepository.checkSeatsAvailability(
            seatIds,
            scheduleId
        );

        const unavailableSeatIds = new Set(availability.unavailableSeats.map((s) => s.seatId));

        const seatsWithDetails = seats.map((seat) => ({
            id: seat.id,
            seatLabel: seat.seatLabel,
            zoneType: seat.row.section.locationZone.zone.type,
            sectionPosition: seat.row.section.position,
            rowNumber: seat.row.rowNumber,
            isAvailable: !unavailableSeatIds.has(seat.id),
        }));

        logger.info(
            `Validated ${seatIds.length} seats for booking in schedule ${scheduleId}`
        );

        return {
            success: true,
            data: {
                valid: true,
                scheduleId,
                eventId,
                locationId,
                seats: seatsWithDetails,
                allAvailable: availability.available,
                unavailableSeats: availability.unavailableSeats.map((s) => s.seatLabel),
            },
        };
    }
}

export default new SeatSelectionService();
