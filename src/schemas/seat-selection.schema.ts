import { z } from 'zod';

/**
 * Schema for getting zones for a schedule
 * GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/zones
 */
export const getZonesParamsSchema = z.object({
    scheduleId: z.string().cuid('Invalid schedule ID format'),
});

/**
 * Schema for getting sections for a zone
 * GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/zones/:locationZoneId/sections
 */
export const getSectionsParamsSchema = z.object({
    scheduleId: z.string().cuid('Invalid schedule ID format'),
    locationZoneId: z.string().cuid('Invalid location zone ID format'),
});

/**
 * Schema for getting rows for a section
 * GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/sections/:sectionId/rows
 */
export const getRowsParamsSchema = z.object({
    scheduleId: z.string().cuid('Invalid schedule ID format'),
    sectionId: z.string().cuid('Invalid section ID format'),
});

/**
 * Schema for getting seats for a row
 * GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/rows/:rowId/seats
 */
export const getSeatsParamsSchema = z.object({
    scheduleId: z.string().cuid('Invalid schedule ID format'),
    rowId: z.string().cuid('Invalid row ID format'),
});

/**
 * Schema for getting full seat map
 * GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/seat-map
 */
export const getSeatMapParamsSchema = z.object({
    scheduleId: z.string().cuid('Invalid schedule ID format'),
});

/**
 * Schema for checking seat availability
 * POST /api/v1/dashboard/seat-selection/schedules/:scheduleId/check-availability
 */
export const checkAvailabilityParamsSchema = z.object({
    scheduleId: z.string().cuid('Invalid schedule ID format'),
});

export const checkAvailabilityBodySchema = z.object({
    seatIds: z
        .array(z.string().cuid('Invalid seat ID format'))
        .min(1, 'At least one seat ID is required')
        .max(100, 'Cannot check more than 100 seats at once'),
});

/**
 * Schema for validating seats
 * POST /api/v1/dashboard/seat-selection/validate-seats
 */
export const validateSeatsBodySchema = z.object({
    seatIds: z
        .array(z.string().cuid('Invalid seat ID format'))
        .min(1, 'At least one seat ID is required')
        .max(100, 'Cannot validate more than 100 seats at once'),
    scheduleId: z.string().cuid('Invalid schedule ID format'),
});

// Export types
export type GetZonesParams = z.infer<typeof getZonesParamsSchema>;
export type GetSectionsParams = z.infer<typeof getSectionsParamsSchema>;
export type GetRowsParams = z.infer<typeof getRowsParamsSchema>;
export type GetSeatsParams = z.infer<typeof getSeatsParamsSchema>;
export type GetSeatMapParams = z.infer<typeof getSeatMapParamsSchema>;
export type CheckAvailabilityParams = z.infer<typeof checkAvailabilityParamsSchema>;
export type CheckAvailabilityBody = z.infer<typeof checkAvailabilityBodySchema>;
export type ValidateSeatsBody = z.infer<typeof validateSeatsBodySchema>;
