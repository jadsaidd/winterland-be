import { SectionPosition, ZoneType } from '@prisma/client';
import { z } from 'zod';

/**
 * Schema for creating a new session
 * POST /api/v1/mobile/sessions
 */
export const createSessionSchema = z.object({
    eventId: z.string().cuid('Invalid event ID'),
    scheduleId: z.string().cuid('Invalid schedule ID'),
});

/**
 * Schema for session ID parameter
 */
export const sessionIdParamSchema = z.object({
    sessionId: z.string().cuid('Invalid session ID'),
});

/**
 * Schema for seat selection (toggle add/remove)
 * POST /api/v1/mobile/sessions/:sessionId/seats
 */
export const toggleSeatSchema = z.object({
    sectionPosition: z.nativeEnum(SectionPosition, {
        message: 'Invalid section position. Must be CENTER, LEFT, or RIGHT',
    }),
    zoneType: z.nativeEnum(ZoneType, {
        message: 'Invalid zone type. Must be VVIP, VIP, REGULAR, or ECONOMY',
    }),
    rowNumber: z.number().int().min(1, 'Row number must be at least 1'),
    seatNumber: z.number().int().min(1, 'Seat number must be at least 1'),
});

/**
 * Schema for cancelling a session
 * DELETE /api/v1/mobile/sessions/:sessionId
 */
export const cancelSessionParamSchema = z.object({
    sessionId: z.string().cuid('Invalid session ID'),
});

// Type exports
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
export type ToggleSeatInput = z.infer<typeof toggleSeatSchema>;
export type CancelSessionParam = z.infer<typeof cancelSessionParamSchema>;