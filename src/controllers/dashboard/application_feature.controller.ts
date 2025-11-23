import { NextFunction, Request, Response } from 'express';

import { ApplicationFeatureService } from '../../services/application_feature.service';

const applicationFeatureService = new ApplicationFeatureService();

export class DashboardApplicationFeatureController {
    /**
     * Get all application features with pagination and optional status filter
     * @route GET /api/v1/dashboard/application-features
     */
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit } = (req as any).pagination;
            const status = req.query.status === 'true' ? true : req.query.status === 'false' ? false : undefined;

            const result = await applicationFeatureService.getAll(page, limit, status);

            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get application feature by ID
     * @route GET /api/v1/dashboard/application-features/:id
     */
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const result = await applicationFeatureService.getById(id);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new application feature
     * @route POST /api/v1/dashboard/application-features
     */
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, status, config } = req.body;

            const result = await applicationFeatureService.create({
                name,
                status,
                config,
            });

            res.status(201).json({
                success: true,
                message: 'Application feature created successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an application feature
     * @route PUT /api/v1/dashboard/application-features/:id
     */
    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status, config } = req.body;

            const result = await applicationFeatureService.update(id, {
                status,
                config,
            });

            res.status(200).json({
                success: true,
                message: 'Application feature updated successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete an application feature
     * @route DELETE /api/v1/dashboard/application-features/:id
     */
    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const result = await applicationFeatureService.delete(id);

            res.status(200).json({
                success: true,
                message: 'Application feature deleted successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
