import { BookingStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * User info schema for guest user creation
 */
const guestUserInfoSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Invalid email format').optional().nullable(),
    phoneNumber: z.string().min(5, 'Phone number must be at least 5 characters').optional().nullable(),
}).refine(
    (data) => data.email || data.phoneNumber,
    { message: 'Either email or phone number is required' }
);

/**
 * Seat selection schema for seated events
 */
const seatSelectionSchema = z.object({
    seatId: z.string().cuid('Invalid seat ID format'),
});

/**
 * Schema for admin booking of non-seated events (haveSeats: false)
 * POST /api/v1/dashboard/bookings/checkout
 */
export const adminNonSeatedBookingSchema = z.object({
    eventId: z.string().cuid('Invalid event ID format'),
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(1, 'Quantity must be at least 1')
        .max(1000, 'Quantity cannot exceed 1000'),
    userInfo: guestUserInfoSchema,
    // Optional custom price (can be 0 for free bookings)
    unitPrice: z
        .number()
        .min(0, 'Price cannot be negative')
        .optional(),
});

/**
 * Schema for admin booking of seated events (haveSeats: true)
 * POST /api/v1/dashboard/bookings/checkout
 */
export const adminSeatedBookingSchema = z.object({
    eventId: z.string().cuid('Invalid event ID format'),
    scheduleId: z.string().cuid('Invalid schedule ID format'),
    seats: z
        .array(seatSelectionSchema)
        .min(1, 'At least one seat must be selected')
        .max(100, 'Cannot book more than 100 seats at once'),
    userInfo: guestUserInfoSchema,
    // Optional custom price per seat (can be 0 for free bookings)
    // If not provided, will use zone pricing
    unitPrice: z
        .number()
        .min(0, 'Price cannot be negative')
        .optional(),
});

/**
 * Combined admin booking schema - discriminated by presence of scheduleId and seats
 * The API will determine which type based on event's haveSeats property
 */
export const adminBookingSchema = z.union([
    adminSeatedBookingSchema,
    adminNonSeatedBookingSchema,
]);

/**
 * Schema for booking ID parameter
 */
export const dashboardBookingIdParamSchema = z.object({
    id: z.string().cuid('Invalid booking ID format'),
});

/**
 * Schema for getting all bookings with filters (dashboard)
 * GET /api/v1/dashboard/bookings
 */
export const getDashboardBookingsQuerySchema = z.object({
    status: z.nativeEnum(BookingStatus).optional(),
    eventId: z.string().cuid('Invalid event ID format').optional(),
    scheduleId: z.string().cuid('Invalid schedule ID format').optional(),
    userId: z.string().cuid('Invalid user ID format').optional(),
    isAdminBooking: z.enum(['true', 'false']).optional(),
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    search: z.string().optional(), // Search by booking number or user name
});

/**
 * Schema for updating booking status (dashboard)
 * PATCH /api/v1/dashboard/bookings/:id/status
 */
export const updateBookingStatusSchema = z.object({
    status: z.nativeEnum(BookingStatus),
    cancelReason: z.string().max(500, 'Cancel reason must be less than 500 characters').optional(),
});

/**
 * Schema for cancelling a booking
 * POST /api/v1/dashboard/bookings/:id/cancel
 */
export const cancelBookingSchema = z.object({
    reason: z.string().min(1, 'Cancellation reason is required').max(500, 'Reason must be less than 500 characters'),
});

// Export types
export type GuestUserInfo = z.infer<typeof guestUserInfoSchema>;
export type SeatSelection = z.infer<typeof seatSelectionSchema>;
export type AdminNonSeatedBookingInput = z.infer<typeof adminNonSeatedBookingSchema>;
export type AdminSeatedBookingInput = z.infer<typeof adminSeatedBookingSchema>;
export type AdminBookingInput = z.infer<typeof adminBookingSchema>;
export type DashboardBookingIdParam = z.infer<typeof dashboardBookingIdParamSchema>;
export type GetDashboardBookingsQuery = z.infer<typeof getDashboardBookingsQuerySchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
