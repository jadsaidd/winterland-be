import { NextFunction, Request, Response } from 'express';

import {
    CreateLocationInput,
    GetLocationsQuery,
    GetLocationZonesQuery,
    SetZonePricingInput,
    ToggleLocationActiveInput,
    UpdateLocationInput,
} from '../../schemas/location.schema';
import { locationService } from '../../services/location.service';

/**
 * Dashboard Location Controller
 * Handles all location CRUD operations for dashboard users
 */
export class DashboardLocationController {
    /**
     * Create a new location
     * POST /api/v1/dashboard/locations
     */
    async createLocation(req: Request, res: Response, next: NextFunction) {
        try {
            const data: CreateLocationInput = req.body;
            const uploadedBy = req.user?.id;

            const location = await locationService.createLocation(data, uploadedBy);

            return res.status(201).json({
                success: true,
                message: 'Location created successfully',
                data: location,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all locations with pagination
     * GET /api/v1/dashboard/locations
     */
    async getAllLocations(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit } = (req as any).pagination;
            const filters = req.query as GetLocationsQuery;

            const result = await locationService.getAllLocations(page, limit, filters);

            return res.status(200).json({
                success: true,
                message: 'Locations retrieved successfully',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get location by ID or slug
     * GET /api/v1/dashboard/locations/:identifier
     */
    async getLocationById(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;

            const location = await locationService.getLocationByIdOrSlug(identifier);

            return res.status(200).json({
                success: true,
                message: 'Location retrieved successfully',
                data: location,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update location
     * PUT /api/v1/dashboard/locations/:identifier
     */
    async updateLocation(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;
            const data: UpdateLocationInput = req.body;
            const uploadedBy = req.user?.id;

            const location = await locationService.updateLocation(identifier, data, uploadedBy);

            return res.status(200).json({
                success: true,
                message: 'Location updated successfully',
                data: location,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Toggle location active status
     * PATCH /api/v1/dashboard/locations/:identifier/toggle-active
     */
    async toggleLocationActive(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;
            const { active }: ToggleLocationActiveInput = req.body;

            const location = await locationService.toggleLocationActive(identifier, active);

            return res.status(200).json({
                success: true,
                message: `Location ${active ? 'activated' : 'deactivated'} successfully`,
                data: location,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete location
     * DELETE /api/v1/dashboard/locations/:identifier
     */
    async deleteLocation(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;

            await locationService.deleteLocation(identifier);

            return res.status(200).json({
                success: true,
                message: 'Location deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get comprehensive locations statistics
     * GET /api/v1/dashboard/locations/stats
     */
    async getLocationsStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await locationService.getLocationsStats();

            return res.status(200).json({
                success: true,
                message: 'Locations statistics retrieved successfully',
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get location template by location ID or slug
     * GET /api/v1/dashboard/locations/:identifier/template
     */
    async getLocationTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;

            const template = await locationService.getLocationTemplate(identifier);

            return res.status(200).json({
                success: true,
                message: 'Location template retrieved successfully',
                data: template,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get location zones with details and optional pricing info
     * GET /api/v1/dashboard/locations/:identifier/zones
     * 
     * Query params:
     * - scheduleId: Filter pricing by specific schedule
     * - eventId: Filter pricing by specific event
     */
    async getLocationZones(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;
            const { scheduleId, eventId } = req.query as GetLocationZonesQuery;

            const zones = await locationService.getLocationZones(identifier, {
                scheduleId,
                eventId,
            });

            return res.status(200).json({
                success: true,
                message: 'Location zones retrieved successfully',
                data: zones,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Set zone pricing for a location
     * POST /api/v1/dashboard/locations/:identifier/zone-pricing
     * 
     * Creates or updates zone pricing based on schedule context.
     * The schedule determines the event and validates location relationship.
     */
    async setZonePricing(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;
            const data: SetZonePricingInput = req.body;

            const result = await locationService.setZonePricing(identifier, data);

            return res.status(200).json({
                success: true,
                message: 'Zone pricing set successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardLocationController = new DashboardLocationController();
