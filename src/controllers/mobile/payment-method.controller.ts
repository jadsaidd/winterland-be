import { NextFunction, Request, Response } from 'express';

import paymentMethodService from '../../services/payment-method.service';
import { getPreferredLanguage, localizeArray } from '../../utils/i18n.util';

/**
 * Mobile PaymentMethod Controller
 * Handles public payment method endpoints for mobile users with i18n support
 */
export class MobilePaymentMethodController {
    /**
     * I18n fields that need localization
     */
    private readonly i18nFields = ['name', 'description'];

    /**
     * Get all active payment methods with i18n (no pagination)
     * GET /api/v1/mobile/payment-methods
     */
    async getAllPaymentMethods(req: Request, res: Response, next: NextFunction) {
        try {
            // Get preferred language
            const language = getPreferredLanguage(req);

            // Parse includeWallet query param (defaults to true)
            const includeWallet = req.query.includeWallet !== 'false';

            // Fetch all active payment methods
            const paymentMethods = await paymentMethodService.getAllActivePaymentMethods(includeWallet);

            // Localize payment method data
            const localizedData = localizeArray(paymentMethods, this.i18nFields, language);

            return res.status(200).json({
                success: true,
                message: 'Payment methods retrieved successfully',
                data: localizedData,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new MobilePaymentMethodController();
