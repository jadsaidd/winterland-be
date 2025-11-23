import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '../exceptions/http.exception';
import eventRepository from '../repositories/event.repository';
import { scheduleRepository } from '../repositories/schedule.repository';
import {
    CreateScheduleInput,
    GetAllSchedulesQuery,
    UpdateScheduleInput,
} from '../schemas/schedule.schema';

export class ScheduleService {
    /**
     * Validate that start and end dates are valid and in correct order
     */
    private validateDateRange(startDate: Date, endDate: Date) {
        if (Number.isNaN(startDate.getTime())) {
            throw new BadRequestException('Invalid start date');
        }
        if (Number.isNaN(endDate.getTime())) {
            throw new BadRequestException('Invalid end date');
        }
        if (endDate <= startDate) {
            throw new BadRequestException('End date must be after start date');
        }
    }

    /**
     * Create a new schedule
     */
    async createSchedule(data: CreateScheduleInput) {
        const { eventId, startAt, endAt, details } = data;

        // Convert string dates to Date objects
        const startDate = new Date(startAt);
        const endDate = new Date(endAt);

        // 1. Validate date range
        this.validateDateRange(startDate, endDate);

        // 2. Validate event exists
        const event = await eventRepository.findById(eventId);
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // 3. Validate schedule is within event date range
        const eventStartDate = new Date(event.startAt);
        const eventEndDate = new Date(event.endAt);

        if (startDate < eventStartDate || endDate > eventEndDate) {
            throw new BadRequestException(
                `Schedule must be within event date range (${eventStartDate.toISOString()} to ${eventEndDate.toISOString()})`
            );
        }

        // 4. Check for overlapping schedules in the same event
        const hasOverlap = await scheduleRepository.hasOverlap(
            eventId,
            startDate,
            endDate
        );

        if (hasOverlap) {
            throw new ConflictException(
                'Schedule overlaps with an existing schedule for this event'
            );
        }

        // 5. Create the schedule
        const schedule = await scheduleRepository.create({
            startAt: startDate,
            endAt: endDate,
            details: details || undefined,
            event: {
                connect: { id: eventId }
            }
        });

        return schedule;
    }

    /**
     * Get all schedules with filters and pagination
     */
    async getAllSchedules(
        page: number,
        limit: number,
        query: GetAllSchedulesQuery
    ) {
        const filters: any = {};

        if (query.eventId) {
            filters.eventId = query.eventId;
        }

        if (query.startDate) {
            filters.startDate = new Date(query.startDate);
        }

        if (query.endDate) {
            filters.endDate = new Date(query.endDate);
        }

        if (query.hasWorkers !== undefined) {
            filters.hasWorkers = query.hasWorkers === 'true';
        }

        return await scheduleRepository.findAll(page, limit, filters);
    }

    /**
     * Get schedule by ID
     */
    async getScheduleById(id: string) {
        const schedule = await scheduleRepository.findById(id);

        if (!schedule) {
            throw new NotFoundException('Schedule not found');
        }

        return schedule;
    }

    /**
     * Update schedule
     */
    async updateSchedule(id: string, data: UpdateScheduleInput) {
        // 1. Check if schedule exists
        const existingSchedule = await scheduleRepository.findById(id);
        if (!existingSchedule) {
            throw new NotFoundException('Schedule not found');
        }

        // 2. Prepare update data
        const updateData: any = {};

        if (data.details !== undefined) {
            updateData.details = data.details;
        }

        // Handle date updates
        let startDate = existingSchedule.startAt;
        let endDate = existingSchedule.endAt;

        if (data.startAt) {
            startDate = new Date(data.startAt);
            updateData.startAt = startDate;
        }

        if (data.endAt) {
            endDate = new Date(data.endAt);
            updateData.endAt = endDate;
        }

        // 2b. Validate date range (only if user attempted to update either)
        if (data.startAt || data.endAt) {
            this.validateDateRange(startDate, endDate);
        }

        // 3. Validate dates are within event range
        const event = await eventRepository.findById(existingSchedule.eventId);
        if (!event) {
            throw new NotFoundException('Associated event not found');
        }

        const eventStartDate = new Date(event.startAt);
        const eventEndDate = new Date(event.endAt);

        if (startDate < eventStartDate || endDate > eventEndDate) {
            throw new BadRequestException(
                `Schedule must be within event date range (${eventStartDate.toISOString()} to ${eventEndDate.toISOString()})`
            );
        }

        // 4. Check for overlapping schedules (exclude current schedule)
        if (data.startAt || data.endAt) {
            const hasOverlap = await scheduleRepository.hasOverlap(
                existingSchedule.eventId,
                startDate,
                endDate,
                id // Exclude current schedule from overlap check
            );

            if (hasOverlap) {
                throw new ConflictException(
                    'Updated schedule would overlap with an existing schedule for this event'
                );
            }
        }

        // 5. Update the schedule
        return await scheduleRepository.update(id, updateData);
    }

    /**
     * Delete schedule
     */
    async deleteSchedule(id: string) {
        const schedule = await scheduleRepository.findById(id);

        if (!schedule) {
            throw new NotFoundException('Schedule not found');
        }

        await scheduleRepository.delete(id);

        return { message: 'Schedule deleted successfully' };
    }

    /**
     * Get schedules by event ID
     */
    async getSchedulesByEventId(eventId: string) {
        // Validate event exists
        const event = await eventRepository.findById(eventId);
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        return await scheduleRepository.findByEventId(eventId);
    }

    /**
     * Get schedules statistics
     */
    async getStatistics() {
        return await scheduleRepository.getStatistics();
    }
}

export const scheduleService = new ScheduleService();
