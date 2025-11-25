import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import { prisma } from '../utils/prisma.client';

export class EventRepository {
    /**
     * Create a new event
     */
    async create(data: {
        name: any;
        eventSlug: string;
        description: any;
        startAt: Date;
        endAt: Date;
        haveSeats?: boolean;
        originalPrice?: number;
        discountedPrice?: number;
        locationId: string;
    }) {
        return await prisma.event.create({
            data,
        });
    }

    /**
     * Find event by ID with optional relations
     */
    async findById(id: string, includeRelations: boolean = false) {
        return await prisma.event.findUnique({
            where: { id },
            include: includeRelations ? {
                eventCategories: {
                    include: {
                        category: {
                            include: {
                                categoryMedias: {
                                    include: {
                                        media: true,
                                    },
                                },
                            },
                        },
                    },
                },
                location: {
                    include: {
                        locationMedias: {
                            include: {
                                media: true,
                            },
                        },
                    },
                },
                eventMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            } : undefined,
        });
    }

    /**
     * Find event by slug with optional relations
     */
    async findBySlug(slug: string, includeRelations: boolean = false) {
        return await prisma.event.findUnique({
            where: { eventSlug: slug },
            include: includeRelations ? {
                eventCategories: {
                    include: {
                        category: {
                            include: {
                                categoryMedias: {
                                    include: {
                                        media: true,
                                    },
                                },
                            },
                        },
                    },
                },
                location: {
                    include: {
                        locationMedias: {
                            include: {
                                media: true,
                            },
                        },
                    },
                },
                eventMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            } : undefined,
        });
    }

    /**
     * Find event by ID or slug with relations
     */
    async findByIdOrSlug(identifier: string, includeRelations: boolean = false) {
        // Try to find by ID first
        let event = await this.findById(identifier, includeRelations);

        // If not found, try by slug
        if (!event) {
            event = await this.findBySlug(identifier, includeRelations);
        }

        return event;
    }

    /**
     * Check if event slug exists (excluding specific event ID)
     */
    async slugExists(slug: string, excludeId?: string): Promise<boolean> {
        const event = await prisma.event.findUnique({
            where: { eventSlug: slug },
            select: { id: true },
        });

        if (!event) return false;
        if (excludeId && event.id === excludeId) return false;

        return true;
    }

    /**
     * Get all events with pagination and filters
     */
    async findAll(
        page: number,
        limit: number,
        filters?: {
            active?: boolean;
            search?: string;
            categoryId?: string;
            locationId?: string;
            startDate?: Date;
            endDate?: Date;
        }
    ): Promise<PaginatedResponse<any>> {
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (filters?.active !== undefined) {
            where.active = filters.active;
        }

        if (filters?.search) {
            where.OR = [
                {
                    name: {
                        path: ['en'],
                        string_contains: filters.search,
                    },
                },
                {
                    name: {
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

        if (filters?.categoryId) {
            where.eventCategories = {
                some: {
                    categoryId: filters.categoryId,
                },
            };
        }

        if (filters?.locationId) {
            where.locationId = filters.locationId;
        }

        // Date range filters
        if (filters?.startDate || filters?.endDate) {
            where.AND = [];

            if (filters.startDate) {
                where.AND.push({
                    startAt: {
                        gte: filters.startDate,
                    },
                });
            }

            if (filters.endDate) {
                where.AND.push({
                    endAt: {
                        lte: filters.endDate,
                    },
                });
            }
        }

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    startAt: 'desc',
                },
                include: {
                    eventCategories: {
                        include: {
                            category: true,
                        },
                    },
                    location: true,
                    eventMedias: {
                        include: {
                            media: true,
                        },
                        orderBy: {
                            sortOrder: 'asc',
                        },
                    },
                },
            }),
            prisma.event.count({ where }),
        ]);

        return createPaginatedResponse(events, total, page, limit);
    }

    /**
     * Update event
     */
    async update(
        id: string,
        data: {
            name?: any;
            eventSlug?: string;
            description?: any;
            startAt?: Date;
            endAt?: Date;
            haveSeats?: boolean;
            originalPrice?: number | null;
            discountedPrice?: number | null;
            locationId?: string;
        }
    ) {
        return await prisma.event.update({
            where: { id },
            data,
        });
    }

    /**
     * Toggle event active status
     */
    async toggleActive(id: string, active: boolean) {
        return await prisma.event.update({
            where: { id },
            data: { active },
        });
    }

    /**
     * Delete event
     */
    async delete(id: string) {
        return await prisma.event.delete({
            where: { id },
        });
    }

    /**
     * Get event statistics
     */
    async getStatistics() {
        const [total, active, inactive, upcoming, ongoing, past] = await Promise.all([
            prisma.event.count(),
            prisma.event.count({ where: { active: true } }),
            prisma.event.count({ where: { active: false } }),
            prisma.event.count({
                where: {
                    active: true,
                    startAt: {
                        gt: new Date(),
                    },
                },
            }),
            prisma.event.count({
                where: {
                    active: true,
                    startAt: {
                        lte: new Date(),
                    },
                    endAt: {
                        gte: new Date(),
                    },
                },
            }),
            prisma.event.count({
                where: {
                    active: true,
                    endAt: {
                        lt: new Date(),
                    },
                },
            }),
        ]);

        return {
            total,
            active,
            inactive,
            upcoming,
            ongoing,
            past,
        };
    }

    // ==================== EVENT CATEGORY RELATIONS ====================

    /**
     * Add categories to event
     */
    async addCategories(eventId: string, categoryIds: string[]) {
        const data = categoryIds.map((categoryId) => ({
            eventId,
            categoryId,
        }));

        return await prisma.eventCategory.createMany({
            data,
            skipDuplicates: true,
        });
    }

    /**
     * Remove categories from event
     */
    async removeCategories(eventId: string, categoryIds: string[]) {
        return await prisma.eventCategory.deleteMany({
            where: {
                eventId,
                categoryId: {
                    in: categoryIds,
                },
            },
        });
    }

    /**
     * Replace all categories for an event
     */
    async replaceCategories(eventId: string, categoryIds: string[]) {
        await prisma.$transaction(async (tx: any) => {
            // Remove all existing categories
            await tx.eventCategory.deleteMany({
                where: { eventId },
            });

            // Add new categories
            if (categoryIds.length > 0) {
                const data = categoryIds.map((categoryId) => ({
                    eventId,
                    categoryId,
                }));

                await tx.eventCategory.createMany({
                    data,
                    skipDuplicates: true,
                });
            }
        });
    }

    /**
     * Get event categories
     */
    async getEventCategories(eventId: string) {
        return await prisma.eventCategory.findMany({
            where: { eventId },
            include: {
                category: {
                    include: {
                        categoryMedias: {
                            include: {
                                media: true,
                            },
                        },
                    },
                },
            },
        });
    }

    // ==================== EVENT MEDIA RELATIONS ====================

    /**
     * Add media to event
     */
    async addMedia(eventId: string, mediaIds: string[], sortOrders?: number[]) {
        const data = mediaIds.map((mediaId, index) => ({
            eventId,
            mediaId,
            sortOrder: sortOrders ? sortOrders[index] : index,
        }));

        return await prisma.eventMedia.createMany({
            data,
            skipDuplicates: true,
        });
    }

    /**
     * Remove media from event
     */
    async removeMedia(eventId: string, mediaIds: string[]) {
        return await prisma.eventMedia.deleteMany({
            where: {
                eventId,
                mediaId: {
                    in: mediaIds,
                },
            },
        });
    }

    /**
     * Replace all media for an event
     */
    async replaceMedia(eventId: string, mediaIds: string[]) {
        await prisma.$transaction(async (tx: any) => {
            // Remove all existing media
            await tx.eventMedia.deleteMany({
                where: { eventId },
            });

            // Add new media
            if (mediaIds.length > 0) {
                const data = mediaIds.map((mediaId, index) => ({
                    eventId,
                    mediaId,
                    sortOrder: index,
                }));

                await tx.eventMedia.createMany({
                    data,
                    skipDuplicates: true,
                });
            }
        });
    }

    /**
     * Get event media
     */
    async getEventMedia(eventId: string) {
        return await prisma.eventMedia.findMany({
            where: { eventId },
            include: {
                media: true,
            },
            orderBy: {
                sortOrder: 'asc',
            },
        });
    }
}

export default new EventRepository();
