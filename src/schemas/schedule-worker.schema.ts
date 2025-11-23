import { z } from 'zod';

/**
 * Schema for assigning a worker to a schedule
 */
export const createScheduleWorkerSchema = z.object({
    body: z.object({
        scheduleId: z.string().cuid('Invalid schedule ID format'),
        userId: z.string().cuid('Invalid user ID format'),
    }),
});

/**
 * Schema for schedule worker ID parameter
 */
export const scheduleWorkerIdParamSchema = z.object({
    params: z.object({
        id: z.string().cuid('Invalid schedule worker ID format'),
    }),
});

/**
 * Schema for getting all schedule workers with filters
 */
export const getAllScheduleWorkersSchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        scheduleId: z.string().cuid('Invalid schedule ID format').optional(),
        userId: z.string().cuid('Invalid user ID format').optional(),
        eventId: z.string().cuid('Invalid event ID format').optional(),
    }),
});

/**
 * Schema for getting workers by schedule ID
 */
export const getWorkersByScheduleSchema = z.object({
    params: z.object({
        scheduleId: z.string().cuid('Invalid schedule ID format'),
    }),
});

/**
 * Schema for removing worker from schedule
 */
export const removeWorkerFromScheduleSchema = z.object({
    params: z.object({
        scheduleId: z.string().cuid('Invalid schedule ID format'),
        userId: z.string().cuid('Invalid user ID format'),
    }),
});

// Type exports
export type CreateScheduleWorkerInput = z.infer<typeof createScheduleWorkerSchema>['body'];
export type GetAllScheduleWorkersQuery = z.infer<typeof getAllScheduleWorkersSchema>['query'];
