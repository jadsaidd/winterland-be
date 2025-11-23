import { z } from 'zod';

/**
 * Schema for creating a new schedule
 */
export const createScheduleSchema = z.object({
    eventId: z.string().cuid('Invalid event ID format'),
    startAt: z.string().datetime('Invalid datetime format for startAt'),
    endAt: z.string().datetime('Invalid datetime format for endAt'),
    details: z.object({
        en: z.string().optional(),
        ar: z.string().optional(),
    }).optional(),
}).refine(
    (data) => {
        const start = new Date(data.startAt);
        const end = new Date(data.endAt);
        return start < end;
    },
    {
        message: 'startAt must be before endAt',
        path: ['startAt'],
    }
);

/**
 * Schema for updating a schedule
 */
export const updateScheduleSchema = z.object({
    startAt: z.string().datetime('Invalid datetime format for startAt').optional(),
    endAt: z.string().datetime('Invalid datetime format for endAt').optional(),
    details: z.object({
        en: z.string().optional(),
        ar: z.string().optional(),
    }).optional(),
}).refine(
    (data) => {
        // If both dates are provided, validate that startAt < endAt
        if (data.startAt && data.endAt) {
            const start = new Date(data.startAt);
            const end = new Date(data.endAt);
            return start < end;
        }
        return true;
    },
    {
        message: 'startAt must be before endAt',
        path: ['startAt'],
    }
);

/**
 * Schema for schedule ID parameter
 */
export const scheduleIdParamSchema = z.object({
    id: z.string().cuid('Invalid schedule ID format'),
});

/**
 * Schema for getting all schedules with filters
 */
export const getAllSchedulesSchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    eventId: z.string().cuid('Invalid event ID format').optional(),
    startDate: z.string().datetime('Invalid datetime format for startDate').optional(),
    endDate: z.string().datetime('Invalid datetime format for endDate').optional(),
    hasWorkers: z.enum(['true', 'false']).optional(),
});

// Type exports
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type GetAllSchedulesQuery = z.infer<typeof getAllSchedulesSchema>;
