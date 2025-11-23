import { NextFunction, Request, Response } from 'express';

import eventService from '../../services/event.service';
import { getPreferredLanguage, localizeObject } from '../../utils/i18n.util';

/**
 * Mobile Event Controller
 * Handles HTTP requests for public event endpoints (mobile app)
 */
export class MobileEventController {
    /**
     * Get all active events with pagination and filters
     * GET /api/v1/mobile/events
     */
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page, limit } = (req as any).pagination;
            const { search, categoryId, locationId, startDate, endDate } = req.query;

            // Mobile only shows active events
            const filters: any = {
                active: true,
            };

            if (search) {
                filters.search = search as string;
            }

            if (categoryId) {
                filters.categoryId = categoryId as string;
            }

            if (locationId) {
                filters.locationId = locationId as string;
            }

            if (startDate) {
                filters.startDate = new Date(startDate as string);
            }

            if (endDate) {
                filters.endDate = new Date(endDate as string);
            }

            const result = await eventService.getAllEvents(page, limit, filters);

            // Localize the response
            const language = getPreferredLanguage(req);

            // Localize events
            const localizedEvents = result.data.map((event: any) => {
                // Localize event fields
                const localizedEvent = localizeObject(event, ['name', 'description'], language);

                // Localize categories if present
                if (localizedEvent.eventCategories && localizedEvent.eventCategories.length > 0) {
                    localizedEvent.eventCategories = localizedEvent.eventCategories.map((ec: any) => ({
                        ...ec,
                        category: localizeObject(ec.category, ['title', 'description'], language),
                    }));
                }

                // Localize locations if present
                if (localizedEvent.eventLocations && localizedEvent.eventLocations.length > 0) {
                    localizedEvent.eventLocations = localizedEvent.eventLocations.map((el: any) => ({
                        ...el,
                        location: localizeObject(el.location, ['name', 'description'], language),
                    }));
                }

                return localizedEvent;
            });

            res.status(200).json({
                success: true,
                message: 'Events retrieved successfully',
                data: localizedEvents,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get event by ID or slug with all details
     * GET /api/v1/mobile/events/:identifier
     */
    async getByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { identifier } = req.params;
            const event = await eventService.getEventByIdOrSlug(identifier);

            // Localize the response
            const language = getPreferredLanguage(req);

            // Localize event fields
            const localizedEvent = localizeObject(event, ['name', 'description'], language);

            // Localize categories if present
            if (localizedEvent.eventCategories && localizedEvent.eventCategories.length > 0) {
                localizedEvent.eventCategories = localizedEvent.eventCategories.map((ec: any) => ({
                    ...ec,
                    category: localizeObject(ec.category, ['title', 'description'], language),
                }));
            }

            // Localize locations if present
            if (localizedEvent.eventLocations && localizedEvent.eventLocations.length > 0) {
                localizedEvent.eventLocations = localizedEvent.eventLocations.map((el: any) => ({
                    ...el,
                    location: localizeObject(el.location, ['name', 'description'], language),
                }));
            }

            res.status(200).json({
                success: true,
                message: 'Event retrieved successfully',
                data: localizedEvent,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new MobileEventController();
