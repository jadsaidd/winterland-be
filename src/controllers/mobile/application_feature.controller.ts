import { NextFunction, Request, Response } from 'express';

import { ApplicationFeatureService } from '../../services/application_feature.service';

const applicationFeatureService = new ApplicationFeatureService();

export class MobileApplicationFeatureController {
    /**
     * Get all active application features (no pagination)
     * @route GET /api/v1/mobile/application-features
     */
    async getActiveFeatures(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await applicationFeatureService.getActiveFeatures();

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
