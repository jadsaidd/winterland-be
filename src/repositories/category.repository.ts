import { Prisma } from '@prisma/client';

import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import prisma from '../utils/prisma.client';

/**
 * Category with its relations
 */
export interface CategoryWithRelations {
    id: string;
    title: any;
    categorySlug: string;
    description: any;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    categoryMedias: Array<{
        id: string;
        sortOrder: number | null;
        mediaId: string;
        media: {
            id: string;
            url: string;
            type: string;
            context: string | null;
            meta: any;
        };
    }>;
}

/**
 * Category Repository
 * Handles all database operations for categories
 */
export class CategoryRepository {
    /**
     * Create a new category
     */
    async create(data: {
        title: any;
        categorySlug: string;
        description: any;
        active?: boolean;
    }): Promise<CategoryWithRelations> {
        return await prisma.category.create({
            data,
            include: {
                categoryMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
        }) as CategoryWithRelations;
    }

    /**
     * Find category by ID
     */
    async findById(id: string): Promise<CategoryWithRelations | null> {
        return await prisma.category.findUnique({
            where: { id },
            include: {
                categoryMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
        }) as CategoryWithRelations | null;
    }

    /**
     * Find category by slug
     */
    async findBySlug(slug: string): Promise<CategoryWithRelations | null> {
        return await prisma.category.findUnique({
            where: { categorySlug: slug },
            include: {
                categoryMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
        }) as CategoryWithRelations | null;
    }

    /**
     * Find category by ID or slug
     */
    async findByIdOrSlug(identifier: string): Promise<CategoryWithRelations | null> {
        // Try to find by ID first
        let category = await this.findById(identifier);

        // If not found by ID, try slug
        if (!category) {
            category = await this.findBySlug(identifier);
        }

        return category;
    }

    /**
     * Check if slug exists (excluding specific ID for updates)
     */
    async slugExists(slug: string, excludeId?: string): Promise<boolean> {
        const where: Prisma.CategoryWhereInput = {
            categorySlug: slug,
        };

        if (excludeId) {
            where.id = { not: excludeId };
        }

        const count = await prisma.category.count({ where });
        return count > 0;
    }

    /**
     * Get all categories with pagination and filters
     */
    async findAll(
        page: number,
        limit: number,
        filters?: {
            active?: boolean;
            search?: string;
        }
    ): Promise<PaginatedResponse<CategoryWithRelations>> {
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.CategoryWhereInput = {};

        if (filters?.active !== undefined) {
            where.active = filters.active;
        }

        if (filters?.search) {
            where.OR = [
                {
                    title: {
                        path: ['en'],
                        string_contains: filters.search,
                    },
                },
                {
                    title: {
                        path: ['ar'],
                        string_contains: filters.search,
                    },
                },
                {
                    description: {
                        path: ['en'],
                        string_contains: filters.search,
                    },
                },
                {
                    description: {
                        path: ['ar'],
                        string_contains: filters.search,
                    },
                },
            ];
        }

        // Fetch categories and total count in parallel
        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                skip,
                take: limit,
                include: {
                    categoryMedias: {
                        include: {
                            media: true,
                        },
                        orderBy: {
                            sortOrder: 'asc',
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.category.count({ where }),
        ]);

        return createPaginatedResponse(
            categories as CategoryWithRelations[],
            total,
            page,
            limit
        );
    }

    /**
     * Update category
     */
    async update(
        id: string,
        data: {
            title?: any;
            categorySlug?: string;
            description?: any;
            active?: boolean;
        }
    ): Promise<CategoryWithRelations> {
        return await prisma.category.update({
            where: { id },
            data,
            include: {
                categoryMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
        }) as CategoryWithRelations;
    }

    /**
     * Delete category
     */
    async delete(id: string): Promise<void> {
        await prisma.category.delete({
            where: { id },
        });
    }

    /**
     * Link media to category
     */
    async addMedia(
        categoryId: string,
        mediaId: string,
        sortOrder?: number
    ): Promise<void> {
        await prisma.categoryMedia.create({
            data: {
                categoryId,
                mediaId,
                sortOrder,
            },
        });
    }

    /**
     * Remove all media links from category
     */
    async removeAllMedia(categoryId: string): Promise<void> {
        await prisma.categoryMedia.deleteMany({
            where: { categoryId },
        });
    }

    /**
     * Create media record and link to category
     */
    async createAndLinkMedia(
        categoryId: string,
        url: string,
        sortOrder: number,
        uploadedBy?: string
    ): Promise<void> {
        await prisma.categoryMedia.create({
            data: {
                sortOrder,
                category: {
                    connect: { id: categoryId },
                },
                media: {
                    create: {
                        url,
                        type: 'IMAGE',
                        context: 'category',
                        uploadedBy,
                    },
                },
            },
        });
    }

    /**
     * Get comprehensive categories statistics
     */
    async getCategoriesStatistics() {
        // Get basic counts
        const [total, active, withEvents, withMedia] = await Promise.all([
            prisma.category.count(),
            prisma.category.count({ where: { active: true } }),
            prisma.category.count({
                where: {
                    eventCategories: {
                        some: {},
                    },
                },
            }),
            prisma.category.count({
                where: {
                    categoryMedias: {
                        some: {},
                    },
                },
            }),
        ]);

        // Get total events count across all categories
        const totalEventsCount = await prisma.eventCategory.count();

        // Get top 5 categories by event count
        const topCategories = await prisma.category.findMany({
            select: {
                id: true,
                title: true,
                categorySlug: true,
                active: true,
                _count: {
                    select: {
                        eventCategories: true,
                    },
                },
            },
            orderBy: {
                eventCategories: {
                    _count: 'desc',
                },
            },
            take: 5,
        });

        // Get 5 most recent categories
        const recentCategories = await prisma.category.findMany({
            select: {
                id: true,
                title: true,
                categorySlug: true,
                createdAt: true,
                active: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5,
        });

        // Get distribution data
        const [activeWithEvents, activeWithoutEvents, inactiveWithEvents, inactiveWithoutEvents] =
            await Promise.all([
                prisma.category.count({
                    where: {
                        active: true,
                        eventCategories: {
                            some: {},
                        },
                    },
                }),
                prisma.category.count({
                    where: {
                        active: true,
                        eventCategories: {
                            none: {},
                        },
                    },
                }),
                prisma.category.count({
                    where: {
                        active: false,
                        eventCategories: {
                            some: {},
                        },
                    },
                }),
                prisma.category.count({
                    where: {
                        active: false,
                        eventCategories: {
                            none: {},
                        },
                    },
                }),
            ]);

        return {
            total,
            active,
            inactive: total - active,
            withEvents,
            withoutEvents: total - withEvents,
            withMedia,
            withoutMedia: total - withMedia,
            totalEvents: totalEventsCount,
            averageEventsPerCategory: total > 0 ? Math.round((totalEventsCount / total) * 100) / 100 : 0,
            topCategories: topCategories.map((cat: any) => ({
                id: cat.id,
                title: cat.title,
                categorySlug: cat.categorySlug,
                eventCount: cat._count.eventCategories,
                active: cat.active,
            })),
            recentCategories: recentCategories.map((cat: any) => ({
                id: cat.id,
                title: cat.title,
                categorySlug: cat.categorySlug,
                createdAt: cat.createdAt,
                active: cat.active,
            })),
            categoryDistribution: {
                activeWithEvents,
                activeWithoutEvents,
                inactiveWithEvents,
                inactiveWithoutEvents,
            },
        };
    }

    /**
     * Get categories count by active status
     */
    async countByStatus(active?: boolean): Promise<number> {
        const where: Prisma.CategoryWhereInput = {};

        if (active !== undefined) {
            where.active = active;
        }

        return await prisma.category.count({ where });
    }
}

export default new CategoryRepository();
