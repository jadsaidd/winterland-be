import { NextFunction, Request, Response } from 'express';

import {
    CreateCategoryInput,
    GetCategoriesQuery,
    ToggleCategoryActiveInput,
    UpdateCategoryInput,
} from '../../schemas/category.schema';
import categoryService from '../../services/category.service';

/**
 * Dashboard Category Controller
 * Handles all category CRUD operations for dashboard users
 */
export class DashboardCategoryController {
    /**
     * Create a new category
     * POST /api/v1/dashboard/categories
     */
    async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const data: CreateCategoryInput = req.body;
            const uploadedBy = req.user?.id;

            const category = await categoryService.createCategory(data, uploadedBy);

            return res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: category,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all categories with pagination
     * GET /api/v1/dashboard/categories
     */
    async getAllCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit } = (req as any).pagination;
            const filters = req.query as GetCategoriesQuery;

            const result = await categoryService.getAllCategories(page, limit, filters);

            return res.status(200).json({
                success: true,
                message: 'Categories retrieved successfully',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get category by ID or slug
     * GET /api/v1/dashboard/categories/:identifier
     */
    async getCategoryById(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;

            const category = await categoryService.getCategoryByIdOrSlug(identifier);

            return res.status(200).json({
                success: true,
                message: 'Category retrieved successfully',
                data: category,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update category
     * PUT /api/v1/dashboard/categories/:identifier
     */
    async updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;
            const data: UpdateCategoryInput = req.body;
            const uploadedBy = req.user?.id;

            const category = await categoryService.updateCategory(identifier, data, uploadedBy);

            return res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                data: category,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Toggle category active status
     * PATCH /api/v1/dashboard/categories/:identifier/toggle-active
     */
    async toggleCategoryActive(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;
            const { active }: ToggleCategoryActiveInput = req.body;

            const category = await categoryService.toggleCategoryActive(identifier, active);

            return res.status(200).json({
                success: true,
                message: `Category ${active ? 'activated' : 'deactivated'} successfully`,
                data: category,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete category
     * DELETE /api/v1/dashboard/categories/:identifier
     */
    async deleteCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;

            await categoryService.deleteCategory(identifier);

            return res.status(200).json({
                success: true,
                message: 'Category deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get categories statistics
     * GET /api/v1/dashboard/categories/stats
     */
    async getCategoriesStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await categoryService.getCategoriesStats();

            return res.status(200).json({
                success: true,
                message: 'Categories statistics retrieved successfully',
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new DashboardCategoryController();
