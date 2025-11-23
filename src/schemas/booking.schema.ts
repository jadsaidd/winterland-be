import { BookingStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * Schema for direct event checkout
 * POST /api/v1/mobile/bookings/checkout
 */
export const directCheckoutSchema = z.object({
    eventId: z.string().cuid('Invalid event ID format'),
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(1, 'Quantity must be at least 1')
        .max(100, 'Quantity cannot exceed 100'),
    paymentMethodId: z.string().cuid('Invalid payment method ID format'),
});

/**
 * Schema for cart checkout
 * POST /api/v1/mobile/bookings/checkout
 */
export const cartCheckoutSchema = z.object({
    cartId: z.string().cuid('Invalid cart ID format'),
    paymentMethodId: z.string().cuid('Invalid payment method ID format'),
});

/**
 * Combined checkout schema - either direct or cart checkout
 */
export const checkoutSchema = z.union([
    directCheckoutSchema,
    cartCheckoutSchema,
]);

/**
 * Schema for booking ID parameter
 */
export const bookingIdParamSchema = z.object({
    id: z.string().cuid('Invalid booking ID format'),
});

/**
 * Schema for getting all bookings with filters
 * GET /api/v1/mobile/bookings
 */
export const getBookingsQuerySchema = z.object({
    status: z
        .nativeEnum(BookingStatus)
        .optional(),
    eventId: z.string().cuid('Invalid event ID format').optional(),
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
});

/**
 * Schema for updating booking used quantity (workers only)
 * PATCH /api/v1/mobile/bookings/:id/update-quantity
 */
export const updateBookingQuantitySchema = z.object({
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(1, 'Quantity must be at least 1'),
});

export type DirectCheckoutInput = z.infer<typeof directCheckoutSchema>;
export type CartCheckoutInput = z.infer<typeof cartCheckoutSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type BookingIdParam = z.infer<typeof bookingIdParamSchema>;
export type GetBookingsQuery = z.infer<typeof getBookingsQuerySchema>;
export type UpdateBookingQuantityInput = z.infer<typeof updateBookingQuantitySchema>;
