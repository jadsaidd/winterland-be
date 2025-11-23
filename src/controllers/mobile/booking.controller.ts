import { NextFunction, Request, Response } from 'express';

import { GetBookingsQuery } from '../../schemas/booking.schema';
import bookingService from '../../services/booking.service';
import { getPreferredLanguage, localizeArray, localizeObject, SupportedLanguage } from '../../utils/i18n.util';

/**
 * Mobile Booking Controller
 * Handles HTTP requests for booking endpoints (mobile app)
 */
export class MobileBookingController {
    /**
     * Localize booking data for response
     */
    private localizeBooking(booking: any, language: SupportedLanguage): any {
        if (!booking) return booking;

        return {
            ...booking,
            event: booking.event
                ? {
                    ...localizeObject(booking.event, ['name', 'description'], language),
                    eventCategories: booking.event.eventCategories?.map((ec: any) => ({
                        ...ec,
                        category: localizeObject(ec.category, ['title'], language),
                    })),
                    eventLocations: booking.event.eventLocations?.map((el: any) => ({
                        ...el,
                        location: localizeObject(el.location, ['name'], language),
                    })),
                }
                : null,
            paymentMethod: booking.paymentMethod
                ? localizeObject(booking.paymentMethod, ['name', 'description'], language)
                : null,
        };
    }

    /**
     * Checkout - handles both direct event and cart checkout
     * POST /api/v1/mobile/bookings/checkout
     */
    checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const checkoutData = req.body;

            const result = await bookingService.checkout(userId, checkoutData);

            // Localize the response
            const language = getPreferredLanguage(req);

            if ('booking' in result.data) {
                // Direct checkout - single booking
                result.data.booking = this.localizeBooking(result.data.booking, language);
            } else if ('bookings' in result.data) {
                // Cart checkout - multiple bookings
                result.data.bookings = result.data.bookings.map((booking: any) =>
                    this.localizeBooking(booking, language)
                );
            }

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all user bookings with filters and pagination
     * GET /api/v1/mobile/bookings
     */
    getAllBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { page, limit } = (req as any).pagination;
            const query = req.query as GetBookingsQuery;

            // Parse date filters if provided
            const filters: any = {};

            if (query.status) {
                filters.status = query.status;
            }

            if (query.eventId) {
                filters.eventId = query.eventId;
            }

            if (query.startDate) {
                filters.startDate = new Date(query.startDate);
            }

            if (query.endDate) {
                filters.endDate = new Date(query.endDate);
            }

            const result = await bookingService.getUserBookings(userId, page, limit, filters);

            // Localize the response
            const language = getPreferredLanguage(req);
            result.data = localizeArray(
                result.data.map((booking: any) => ({
                    ...booking,
                    event: booking.event
                        ? {
                            ...booking.event,
                            eventCategories: undefined, // Remove nested for list view
                            eventLocations: undefined, // Remove nested for list view
                        }
                        : null,
                })),
                ['event.name', 'event.description', 'paymentMethod.name'],
                language
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get booking by ID with full details
     * GET /api/v1/mobile/bookings/:id
     */
    getBookingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            const result = await bookingService.getBookingById(id);

            // Localize the response
            const language = getPreferredLanguage(req);
            result.data.booking = this.localizeBooking(result.data.booking, language);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update booking used quantity (workers only)
     * PATCH /api/v1/mobile/bookings/:id/update-quantity
     */
    updateBookingQuantity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const { quantity } = req.body;

            const result = await bookingService.updateBookingQuantity(id, quantity);

            // Localize the response
            const language = getPreferredLanguage(req);
            result.data.booking = this.localizeBooking(result.data.booking, language);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}

export default new MobileBookingController();
