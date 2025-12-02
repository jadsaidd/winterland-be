import { NextFunction, Request, Response } from 'express';

import {
    AdminBookingInput,
    AssignBookingInput,
    AssignBulkBookingsInput,
    CancelBookingInput,
    GetDashboardBookingsQuery,
    PreReserveBookingInput,
    UpdateBookingStatusInput,
} from '../../schemas/dashboard-booking.schema';
import dashboardBookingService from '../../services/dashboard-booking.service';

/**
 * Dashboard Booking Controller
 * Handles HTTP requests for admin booking endpoints
 * Note: Returns full objects with both languages (no i18n localization)
 */
export class DashboardBookingController {
    /**
     * Admin Checkout - Create booking for customer
     * POST /api/v1/dashboard/bookings/checkout
     * 
     * Handles both seated and non-seated events:
     * - Non-seated: { eventId, quantity, userInfo, unitPrice? }
     * - Seated: { eventId, scheduleId, seats, userInfo, unitPrice? }
     */
    checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const adminId = req.user.id;
            const checkoutData: AdminBookingInput = req.body;

            const result = await dashboardBookingService.adminCheckout(adminId, checkoutData);

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all bookings with filters and pagination
     * GET /api/v1/dashboard/bookings
     */
    getAllBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { page, limit } = (req as any).pagination;
            const query = req.query as unknown as GetDashboardBookingsQuery;

            // Parse filters
            const filters: any = {};

            if (query.status) {
                filters.status = query.status;
            }

            if (query.eventId) {
                filters.eventId = query.eventId;
            }

            if (query.scheduleId) {
                filters.scheduleId = query.scheduleId;
            }

            if (query.userId) {
                filters.userId = query.userId;
            }

            if (query.isAdminBooking) {
                filters.isAdminBooking = query.isAdminBooking === 'true';
            }

            if (query.isPreReserved) {
                filters.isPreReserved = query.isPreReserved === 'true';
            }

            if (query.startDate) {
                filters.startDate = new Date(query.startDate);
            }

            if (query.endDate) {
                filters.endDate = new Date(query.endDate);
            }

            if (query.search) {
                filters.search = query.search;
            }

            const result = await dashboardBookingService.getAllBookings(page, limit, filters);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get booking by ID with full details
     * GET /api/v1/dashboard/bookings/:id
     */
    getBookingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            const result = await dashboardBookingService.getBookingById(id);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update booking status
     * PATCH /api/v1/dashboard/bookings/:id/status
     */
    updateBookingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const { status, cancelReason }: UpdateBookingStatusInput = req.body;

            const result = await dashboardBookingService.updateBookingStatus(id, status, cancelReason);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Cancel booking
     * POST /api/v1/dashboard/bookings/:id/cancel
     */
    cancelBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const { reason }: CancelBookingInput = req.body;

            const result = await dashboardBookingService.cancelBooking(id, reason);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    // ==================== PRE-RESERVED BOOKING ENDPOINTS ====================

    /**
     * Pre-reserve bookings
     * POST /api/v1/dashboard/bookings/pre-reserve
     * 
     * Creates bulk pre-reserved bookings with placeholder guest users.
     * Each booking gets its own guest user named "Guest - {bookingNumber}".
     * 
     * For non-seated events: Creates N bookings (one per quantity unit)
     * For seated events: Creates one booking per seat
     */
    preReserve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const adminId = req.user.id;
            const preReserveData: PreReserveBookingInput = req.body;

            const result = await dashboardBookingService.preReserveBookings(adminId, preReserveData);

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Assign a pre-reserved booking to a user
     * POST /api/v1/dashboard/bookings/:id/assign
     * 
     * Links a pre-reserved booking to an existing or new user.
     * If user with email/phone exists, links to existing user.
     * Otherwise creates a new user and links the booking.
     * Deletes the unused guest user after assignment.
     */
    assignBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const assignData: AssignBookingInput = req.body;

            const result = await dashboardBookingService.assignBooking(id, assignData);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Bulk assign pre-reserved bookings
     * POST /api/v1/dashboard/bookings/assign-bulk
     * 
     * Assigns multiple pre-reserved bookings to users in a single request.
     * Each assignment can link to an existing or new user.
     */
    assignBulkBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const assignData: AssignBulkBookingsInput = req.body;

            const result = await dashboardBookingService.assignBulkBookings(assignData);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}

export const dashboardBookingController = new DashboardBookingController();
export default dashboardBookingController;
