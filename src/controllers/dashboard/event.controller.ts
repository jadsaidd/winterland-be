import { NextFunction, Request, Response } from 'express';

import eventService from '../../services/event.service';

/**
 * Dashboard Event Controller
 * Handles HTTP requests for event management (admin/dashboard)
 */
export class DashboardEventController {
    /**
     * Create a new event
     * POST /api/v1/dashboard/events
     */
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            const event = await eventService.createEvent(req.body, userId);

            res.status(201).json({
                success: true,
                message: 'Event created successfully',
                data: event,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all events with pagination and filters
     * GET /api/v1/dashboard/events
     */
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page, limit } = (req as any).pagination;
            const { active, search, categoryId, locationId, startDate, endDate } = req.query;

            const filters: any = {};

            if (active !== undefined) {
                filters.active = active === 'true';
            }

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

            res.status(200).json({
                success: true,
                message: 'Events retrieved successfully',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get event by ID or slug
     * GET /api/v1/dashboard/events/:identifier
     */
    async getByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { identifier } = req.params;
            const event = await eventService.getEventByIdOrSlug(identifier);

            res.status(200).json({
                success: true,
                message: 'Event retrieved successfully',
                data: event,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update event
     * PUT /api/v1/dashboard/events/:id
     */
    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const event = await eventService.updateEvent(id, req.body);

            res.status(200).json({
                success: true,
                message: 'Event updated successfully',
                data: event,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Toggle event active status
     * PATCH /api/v1/dashboard/events/:id/toggle-active
     */
    async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { active } = req.body;
            const event = await eventService.toggleEventActive(id, active);

            res.status(200).json({
                success: true,
                message: `Event ${active ? 'activated' : 'deactivated'} successfully`,
                data: event,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete event
     * DELETE /api/v1/dashboard/events/:id
     */
    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            await eventService.deleteEvent(id);

            res.status(200).json({
                success: true,
                message: 'Event deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get event statistics
     * GET /api/v1/dashboard/events/statistics/summary
     */
    async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const statistics = await eventService.getEventStatistics();

            res.status(200).json({
                success: true,
                message: 'Event statistics retrieved successfully',
                data: statistics,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Add categories to event
     * POST /api/v1/dashboard/events/:id/categories
     */
    async addCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { categoryIds } = req.body;
            const categories = await eventService.addCategoriesToEvent(id, categoryIds);

            res.status(200).json({
                success: true,
                message: 'Categories added to event successfully',
                data: categories,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove categories from event
     * DELETE /api/v1/dashboard/events/:id/categories
     */
    async removeCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { categoryIds } = req.body;
            await eventService.removeCategoriesFromEvent(id, categoryIds);

            res.status(200).json({
                success: true,
                message: 'Categories removed from event successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new DashboardEventController();
