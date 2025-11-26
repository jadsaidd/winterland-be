import { z } from 'zod';

export const createSessionSchema = z.object({
    eventId: z.string().cuid('Invalid event ID'),
    scheduleId: z.string().cuid('Invalid schedule ID'),
});