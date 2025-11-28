import { Router } from 'express';

import { dashboardBookingController } from '../../controllers/dashboard/booking.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    adminBookingSchema,
    cancelBookingSchema,
    dashboardBookingIdParamSchema,
    getDashboardBookingsQuerySchema,
    updateBookingStatusSchema,
} from '../../schemas/dashboard-booking.schema';

const router = Router();

/**
 * Dashboard Booking Routes
 * All routes require authentication and appropriate permissions
 */

/**
 * @route   POST /api/v1/dashboard/bookings/checkout
 * @desc    Create admin booking for customer (handles both seated and non-seated events)
 * @access  Private (Dashboard - bookings:create permission)
 * 
 * @body    For non-seated events (haveSeats: false):
 *          {
 *            eventId: string,
 *            quantity: number,
 *            userInfo: { name: string, email?: string, phoneNumber?: string },
 *            unitPrice?: number (optional - uses event price if not provided)
 *          }
 * 
 * @body    For seated events (haveSeats: true):
 *          {
 *            eventId: string,
 *            scheduleId: string,
 *            seats: [{ seatId: string }, ...],
 *            userInfo: { name: string, email?: string, phoneNumber?: string },
 *            unitPrice?: number (optional - uses zone pricing if not provided)
 *          }
 */
router.post(
    '/checkout',
    authMiddleware,
    permissionMiddleware(['bookings:create']),
    validate(adminBookingSchema),
    dashboardBookingController.checkout
);

/**
 * @route   GET /api/v1/dashboard/bookings
 * @desc    Get all bookings with filters and pagination
 * @access  Private (Dashboard - bookings:read permission)
 * 
 * @query   status (optional): BookingStatus enum
 *          eventId (optional): Filter by event ID
 *          scheduleId (optional): Filter by schedule ID
 *          userId (optional): Filter by user ID
 *          isAdminBooking (optional): 'true' or 'false'
 *          startDate (optional): Filter by booking creation start date (ISO string)
 *          endDate (optional): Filter by booking creation end date (ISO string)
 *          search (optional): Search by booking number, user name, email, or phone
 *          page (optional): Page number (default: 1)
 *          limit (optional): Items per page (default: 10, max: 100)
 */
router.get(
    '/',
    authMiddleware,
    permissionMiddleware(['bookings:read']),
    paginationMiddleware(10, 100),
    validate(getDashboardBookingsQuerySchema, 'query'),
    dashboardBookingController.getAllBookings
);

/**
 * @route   GET /api/v1/dashboard/bookings/:id
 * @desc    Get booking by ID with full details
 * @access  Private (Dashboard - bookings:read permission)
 */
router.get(
    '/:id',
    authMiddleware,
    permissionMiddleware(['bookings:read']),
    validate(dashboardBookingIdParamSchema, 'params'),
    dashboardBookingController.getBookingById
);

/**
 * @route   PATCH /api/v1/dashboard/bookings/:id/status
 * @desc    Update booking status
 * @access  Private (Dashboard - bookings:update permission)
 * 
 * @body    {
 *            status: BookingStatus,
 *            cancelReason?: string (required if status is CANCELLED)
 *          }
 * 
 * Valid status transitions:
 * - PENDING → CONFIRMED, CANCELLED
 * - CONFIRMED → COMPLETED, CANCELLED, REFUNDED
 * - COMPLETED → REFUNDED
 * - CANCELLED → (no transitions)
 * - REFUNDED → (no transitions)
 */
router.patch(
    '/:id/status',
    authMiddleware,
    permissionMiddleware(['bookings:update']),
    validate(dashboardBookingIdParamSchema, 'params'),
    validate(updateBookingStatusSchema),
    dashboardBookingController.updateBookingStatus
);

/**
 * @route   POST /api/v1/dashboard/bookings/:id/cancel
 * @desc    Cancel booking with reason (releases seats if applicable)
 * @access  Private (Dashboard - bookings:update permission)
 * 
 * @body    { reason: string }
 */
router.post(
    '/:id/cancel',
    authMiddleware,
    permissionMiddleware(['bookings:update']),
    validate(dashboardBookingIdParamSchema, 'params'),
    validate(cancelBookingSchema),
    dashboardBookingController.cancelBooking
);

export default router;
