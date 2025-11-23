import { NextFunction, Request, Response } from 'express';

import {
    CreatePaymentMethodInput,
    GetPaymentMethodsQuery,
    TogglePaymentMethodActiveInput,
    UpdatePaymentMethodInput,
} from '../../schemas/payment-method.schema';
import paymentMethodService from '../../services/payment-method.service';

/**
 * Dashboard PaymentMethod Controller
 * Handles all payment method CRUD operations for dashboard users
 */
export class DashboardPaymentMethodController {
    /**
     * Create a new payment method
     * POST /api/v1/dashboard/payment-methods
     */
    async createPaymentMethod(req: Request, res: Response, next: NextFunction) {
        try {
            const data: CreatePaymentMethodInput = req.body;
            const uploadedBy = req.user?.id;

            const paymentMethod = await paymentMethodService.createPaymentMethod(data, uploadedBy);

            return res.status(201).json({
                success: true,
                message: 'Payment method created successfully',
                data: paymentMethod,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all payment methods with pagination
     * GET /api/v1/dashboard/payment-methods
     */
    async getAllPaymentMethods(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit } = (req as any).pagination;
            const filters = req.query as GetPaymentMethodsQuery;

            const result = await paymentMethodService.getAllPaymentMethods(page, limit, filters);

            return res.status(200).json({
                success: true,
                message: 'Payment methods retrieved successfully',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get payment method by ID
     * GET /api/v1/dashboard/payment-methods/:id
     */
    async getPaymentMethodById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const paymentMethod = await paymentMethodService.getPaymentMethodById(id);

            return res.status(200).json({
                success: true,
                message: 'Payment method retrieved successfully',
                data: paymentMethod,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update payment method
     * PUT /api/v1/dashboard/payment-methods/:id
     */
    async updatePaymentMethod(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data: UpdatePaymentMethodInput = req.body;
            const uploadedBy = req.user?.id;

            const paymentMethod = await paymentMethodService.updatePaymentMethod(id, data, uploadedBy);

            return res.status(200).json({
                success: true,
                message: 'Payment method updated successfully',
                data: paymentMethod,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Toggle payment method active status
     * PATCH /api/v1/dashboard/payment-methods/:id/toggle-active
     */
    async togglePaymentMethodActive(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { isActive }: TogglePaymentMethodActiveInput = req.body;

            const paymentMethod = await paymentMethodService.togglePaymentMethodActive(id, isActive);

            return res.status(200).json({
                success: true,
                message: `Payment method ${isActive ? 'activated' : 'deactivated'} successfully`,
                data: paymentMethod,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete payment method
     * DELETE /api/v1/dashboard/payment-methods/:id
     */
    async deletePaymentMethod(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            await paymentMethodService.deletePaymentMethod(id);

            return res.status(200).json({
                success: true,
                message: 'Payment method deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new DashboardPaymentMethodController();
