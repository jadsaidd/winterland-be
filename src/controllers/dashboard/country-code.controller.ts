import { NextFunction, Request, Response } from 'express';

import { CountryCodeService } from '../../services/country-code.service';

const countryCodeService = new CountryCodeService();

export class DashboardCountryCodeController {
    /**
     * Create a new country code
     * @route POST /country-codes
     */
    async createCountryCode(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await countryCodeService.createCountryCode(req.body);

            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get country code by ID
     * @route GET /country-codes/:id
     */
    async getCountryCodeById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await countryCodeService.getCountryCodeById(id);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a country code
     * @route PUT /country-codes/:id
     */
    async updateCountryCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await countryCodeService.updateCountryCode(id, req.body);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Toggle active status of a country code
     * @route PATCH /country-codes/:id/toggle-active
     */
    async toggleActive(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { active } = req.body;
            const result = await countryCodeService.toggleActive(id, active);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all country codes
     * @route GET /country-codes
     */
    async getAllCountryCodes(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            // Parse active filter - only set if explicitly provided
            let active: boolean | undefined;
            if (req.query.active !== undefined) {
                active = req.query.active === 'true';
            }

            const result = await countryCodeService.getAllCountryCodes(page, limit, active);

            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a country code
     * @route DELETE /country-codes/:id
     */
    async deleteCountryCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await countryCodeService.deleteCountryCode(id);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
