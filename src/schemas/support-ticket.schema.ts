import { z } from 'zod';

/**
 * Schema for creating a support ticket
 */
export const createSupportTicketSchema = z.object({
    fullName: z.string().min(1, 'Full name is required').max(255, 'Full name is too long'),
    email: z.string().email('Invalid email address').max(255, 'Email is too long'),
    subject: z.string().min(1, 'Subject is required').max(500, 'Subject is too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description is too long'),
});

/**
 * Schema for updating support ticket status
 */
export const updateSupportTicketStatusSchema = z.object({
    status: z.enum(['OPEN', 'CLOSED'], {
        message: 'Status must be either OPEN or CLOSED',
    }),
});

/**
 * Schema for support ticket ID parameter
 */
export const supportTicketIdParamSchema = z.object({
    id: z.string().cuid('Invalid support ticket ID'),
});

/**
 * Schema for support ticket query filters
 */
export const supportTicketQuerySchema = z.object({
    search: z.string().optional(),
    status: z.enum(['OPEN', 'CLOSED']).optional(),
});

export type CreateSupportTicketDto = z.infer<typeof createSupportTicketSchema>;
export type UpdateSupportTicketStatusDto = z.infer<typeof updateSupportTicketStatusSchema>;
export type SupportTicketIdParamDto = z.infer<typeof supportTicketIdParamSchema>;
export type SupportTicketQueryDto = z.infer<typeof supportTicketQuerySchema>;
