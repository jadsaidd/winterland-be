import { NextFunction, Request, Response } from 'express';

import { CountryCodeService } from '../../services/country-code.service';

const countryCodeService = new CountryCodeService();

export class MobileCountryCodeController {
    /**
     * Get all active country codes
     * @route GET /country-codes
     */
    async getAllActiveCountryCodes(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await countryCodeService.getAllActiveCountryCodes();

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
