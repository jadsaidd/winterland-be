import { NextFunction, Request, Response } from 'express';

import { GetCategoriesQuery } from '../../schemas/category.schema';
import categoryService from '../../services/category.service';
import { getPreferredLanguage, localizeArray, localizeObject } from '../../utils/i18n.util';

/**
 * Mobile Category Controller
 * Handles public category endpoints for mobile users with i18n support
 */
export class MobileCategoryController {
    /**
     * I18n fields that need localization
     */
    private readonly i18nFields = ['title', 'description'];

    /**
     * Get all active categories with pagination and i18n
     * GET /api/v1/mobile/categories
     */
    async getAllCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit } = (req as any).pagination;
            const filters = req.query as GetCategoriesQuery;

            // Force active filter for mobile
            const mobileFilters = {
                ...filters,
                active: 'true',
            };

            // Get preferred language
            const language = getPreferredLanguage(req);

            // Fetch categories
            const result = await categoryService.getAllCategories(page, limit, mobileFilters);

            // Localize category data
            const localizedData = localizeArray(result.data, this.i18nFields, language);

            return res.status(200).json({
                success: true,
                message: 'Categories retrieved successfully',
                data: localizedData,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get category by ID or slug with i18n
     * GET /api/v1/mobile/categories/:identifier
     */
    async getCategoryById(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;

            // Get preferred language
            const language = getPreferredLanguage(req);

            // Fetch category
            const category = await categoryService.getCategoryByIdOrSlug(identifier);

            // Only return if active for mobile users
            if (!category.active) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found',
                });
            }

            // Localize category data
            const localizedCategory = localizeObject(category, this.i18nFields, language);

            return res.status(200).json({
                success: true,
                message: 'Category retrieved successfully',
                data: localizedCategory,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new MobileCategoryController();
