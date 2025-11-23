import { NextFunction, Request, Response } from 'express';

import { GetLocationsQuery } from '../../schemas/location.schema';
import { locationService } from '../../services/location.service';
import { getPreferredLanguage, localizeArray, localizeObject } from '../../utils/i18n.util';

/**
 * Mobile Location Controller
 * Handles public location endpoints for mobile users with i18n support
 */
export class MobileLocationController {
    /**
     * I18n fields that need localization
     */
    private readonly i18nFields = ['name', 'description'];

    /**
     * Get all active locations with pagination and i18n
     * GET /api/v1/mobile/locations
     */
    async getAllLocations(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit } = (req as any).pagination;
            const filters = req.query as GetLocationsQuery;

            // Force active filter for mobile
            const mobileFilters = {
                ...filters,
                active: 'true',
            };

            // Get preferred language
            const language = getPreferredLanguage(req);

            // Fetch locations
            const result = await locationService.getAllLocations(page, limit, mobileFilters);

            // Localize location data
            const localizedData = localizeArray(result.data, this.i18nFields, language);

            return res.status(200).json({
                success: true,
                message: 'Locations retrieved successfully',
                data: localizedData,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get location by ID or slug with i18n
     * GET /api/v1/mobile/locations/:identifier
     */
    async getLocationById(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;

            // Get preferred language
            const language = getPreferredLanguage(req);

            // Fetch location
            const location = await locationService.getLocationByIdOrSlug(identifier);

            // Only return if active for mobile users
            if (!location.active) {
                return res.status(404).json({
                    success: false,
                    message: 'Location not found',
                });
            }

            // Localize location data
            const localizedLocation = localizeObject(location, this.i18nFields, language);

            return res.status(200).json({
                success: true,
                message: 'Location retrieved successfully',
                data: localizedLocation,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const mobileLocationController = new MobileLocationController();
