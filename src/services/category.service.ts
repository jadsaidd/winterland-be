import { NotFoundException } from '../exceptions/http.exception';
import categoryRepository, {
    CategoryWithRelations,
} from '../repositories/category.repository';
import { PaginatedResponse } from '../utils/pagination.util';

/**
 * Category Service
 * Handles business logic for category operations
 */
export class CategoryService {
    /**
     * Generate URL-friendly slug from English title
     */
    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .replace(/^-+|-+$/g, ''); // Trim hyphens from start and end
    }

    /**
     * Generate unique slug, appending number if needed
     */
    private async generateUniqueSlug(baseTitle: string, excludeId?: string): Promise<string> {
        let slug = this.generateSlug(baseTitle);
        let counter = 1;
        let finalSlug = slug;

        // Keep checking until we find a unique slug
        while (await categoryRepository.slugExists(finalSlug, excludeId)) {
            finalSlug = `${slug}-${counter}`;
            counter++;
        }

        return finalSlug;
    }

    /**
     * Create a new category
     */
    async createCategory(
        data: {
            title: { en: string; ar?: string };
            description: { en: string; ar?: string };
            mediaUrls?: string[];
        },
        uploadedBy?: string
    ): Promise<CategoryWithRelations> {
        // Generate unique slug from English title
        const slug = await this.generateUniqueSlug(data.title.en);

        // Create category
        const category = await categoryRepository.create({
            title: data.title,
            categorySlug: slug,
            description: data.description,
            active: true, // Default to active
        });

        // Link media if provided
        if (data.mediaUrls && data.mediaUrls.length > 0) {
            await Promise.all(
                data.mediaUrls.map((url, index) =>
                    categoryRepository.createAndLinkMedia(
                        category.id,
                        url,
                        index + 1, // sortOrder starts from 1
                        uploadedBy
                    )
                )
            );

            // Fetch updated category with media
            return await categoryRepository.findById(category.id) as CategoryWithRelations;
        }

        return category;
    }

    /**
     * Get category by ID or slug
     */
    async getCategoryByIdOrSlug(identifier: string): Promise<CategoryWithRelations> {
        const category = await categoryRepository.findByIdOrSlug(identifier);

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    /**
     * Get all categories with pagination and filters
     */
    async getAllCategories(
        page: number,
        limit: number,
        filters?: {
            active?: string;
            search?: string;
        }
    ): Promise<PaginatedResponse<CategoryWithRelations>> {
        // Parse active filter
        const parsedFilters: { active?: boolean; search?: string } = {};

        if (filters?.active) {
            parsedFilters.active = filters.active === 'true';
        }

        if (filters?.search) {
            parsedFilters.search = filters.search;
        }

        return await categoryRepository.findAll(page, limit, parsedFilters);
    }

    /**
     * Update category
     */
    async updateCategory(
        identifier: string,
        data: {
            title?: { en: string; ar?: string };
            description?: { en: string; ar?: string };
            mediaUrls?: string[];
            active?: boolean;
        },
        uploadedBy?: string
    ): Promise<CategoryWithRelations> {
        // Check if category exists
        const existingCategory = await this.getCategoryByIdOrSlug(identifier);

        // Prepare update data
        const updateData: any = {};

        if (data.title) {
            updateData.title = data.title;
            // Regenerate slug if title changed
            const newSlug = await this.generateUniqueSlug(data.title.en, existingCategory.id);
            updateData.categorySlug = newSlug;
        }

        if (data.description) {
            updateData.description = data.description;
        }

        if (data.active !== undefined) {
            updateData.active = data.active;
        }

        // Update category
        await categoryRepository.update(existingCategory.id, updateData);

        // Handle media replacement if provided
        if (data.mediaUrls !== undefined) {
            // Remove all existing media links
            await categoryRepository.removeAllMedia(existingCategory.id);

            // Add new media
            if (data.mediaUrls.length > 0) {
                await Promise.all(
                    data.mediaUrls.map((url, index) =>
                        categoryRepository.createAndLinkMedia(
                            existingCategory.id,
                            url,
                            index + 1,
                            uploadedBy
                        )
                    )
                );
            }
        }

        // Fetch and return updated category with all relations
        return await categoryRepository.findById(existingCategory.id) as CategoryWithRelations;
    }

    /**
     * Toggle category active status
     */
    async toggleCategoryActive(
        identifier: string,
        active: boolean
    ): Promise<CategoryWithRelations> {
        // Check if category exists
        const existingCategory = await this.getCategoryByIdOrSlug(identifier);

        // Update active status
        return await categoryRepository.update(existingCategory.id, { active });
    }

    /**
     * Delete category
     */
    async deleteCategory(identifier: string): Promise<void> {
        // Check if category exists
        const existingCategory = await this.getCategoryByIdOrSlug(identifier);

        // Delete category (cascade will handle media links)
        await categoryRepository.delete(existingCategory.id);
    }

    /**
     * Get categories statistics
     */
    async getCategoriesStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        withEvents: number;
        withoutEvents: number;
        withMedia: number;
        withoutMedia: number;
        totalEvents: number;
        averageEventsPerCategory: number;
        topCategories: Array<{
            id: string;
            title: any;
            categorySlug: string;
            eventCount: number;
            active: boolean;
        }>;
        recentCategories: Array<{
            id: string;
            title: any;
            categorySlug: string;
            createdAt: Date;
            active: boolean;
        }>;
        categoryDistribution: {
            activeWithEvents: number;
            activeWithoutEvents: number;
            inactiveWithEvents: number;
            inactiveWithoutEvents: number;
        };
    }> {
        const stats = await categoryRepository.getCategoriesStatistics();
        return stats;
    }
}

export default new CategoryService();
