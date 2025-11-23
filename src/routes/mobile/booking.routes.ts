import { Router } from 'express';

import mobileBookingController from '../../controllers/mobile/booking.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    bookingIdParamSchema,
    checkoutSchema,
    getBookingsQuerySchema,
    updateBookingQuantitySchema,
} from '../../schemas/booking.schema';

const router = Router();

/**
 * Mobile Booking Routes
 * All routes are protected with authentication
 */

/**
 * @route   POST /api/v1/mobile/bookings/checkout
 * @desc    Checkout - handles both direct event and cart checkout
 * @access  Private (Mobile Users)
 * @body    For direct checkout: { eventId, quantity, paymentMethodId }
 *          For cart checkout: { cartId, paymentMethodId }
 */
router.post(
    '/checkout',
    authMiddleware,
    validate(checkoutSchema),
    mobileBookingController.checkout
);

/**
 * @route   GET /api/v1/mobile/bookings
 * @desc    Get all user bookings with filters and pagination
 * @access  Private (Mobile Users)
 * @query   status (optional): BookingStatus enum
 *          eventId (optional): Filter by event ID
 *          startDate (optional): Filter by booking creation start date (ISO string)
 *          endDate (optional): Filter by booking creation end date (ISO string)
 *          page (optional): Page number (default: 1)
 *          limit (optional): Items per page (default: 10, max: 50)
 */
router.get(
    '/',
    authMiddleware,
    paginationMiddleware(10, 50),
    validate(getBookingsQuerySchema, 'query'),
    mobileBookingController.getAllBookings
);

/**
 * @route   GET /api/v1/mobile/bookings/:id
 * @desc    Get booking by ID with full details
 * @access  Private (Mobile Users)
 */
router.get(
    '/:id',
    authMiddleware,
    validate(bookingIdParamSchema, 'params'),
    mobileBookingController.getBookingById
);

/**
 * @route   PATCH /api/v1/mobile/bookings/:id/update-quantity
 * @desc    Update booking used quantity (workers only)
 * @access  Private (Workers)
 * @body    { quantity: number }
 */
router.patch(
    '/:id/update-quantity',
    authMiddleware,
    validate(bookingIdParamSchema, 'params'),
    validate(updateBookingQuantitySchema),
    mobileBookingController.updateBookingQuantity
);

export default router;
