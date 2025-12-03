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
                schedules: {
                    orderBy: {
                        startAt: 'asc',
                    },
                    include: {
                        scheduleWorkers: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        phoneNumber: true,
                                        profilePictureUrl: true,
                                    },
                                },
                            },
                        },
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
                schedules: {
                    orderBy: {
                        startAt: 'asc',
                    },
                    include: {
                        scheduleWorkers: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        phoneNumber: true,
                                        profilePictureUrl: true,
                                    },
                                },
                            },
                        },
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
            excludeExpired?: boolean;
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

        // Exclude expired events (endAt < now)
        if (filters?.excludeExpired) {
            where.endAt = {
                gte: new Date(),
            };
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
        const now = new Date();

        const [
            total,
            active,
            inactive,
            upcoming,
            ongoing,
            past,
            withSeats,
            withoutSeats,
            totalBookings,
            totalBookingRevenue,
            categoryStats,
            locationStats,
            bookingStatusStats,
        ] = await Promise.all([
            // Event counts
            prisma.event.count(),
            prisma.event.count({ where: { active: true } }),
            prisma.event.count({ where: { active: false } }),
            prisma.event.count({
                where: {
                    active: true,
                    startAt: { gt: now },
                },
            }),
            prisma.event.count({
                where: {
                    active: true,
                    startAt: { lte: now },
                    endAt: { gte: now },
                },
            }),
            prisma.event.count({
                where: {
                    active: true,
                    endAt: { lt: now },
                },
            }),
            prisma.event.count({ where: { haveSeats: true } }),
            prisma.event.count({ where: { haveSeats: false } }),

            // Booking statistics
            prisma.booking.count(),
            prisma.booking.aggregate({
                _sum: {
                    totalPrice: true,
                },
            }),

            // Category statistics - top 5 categories by event count
            prisma.eventCategory.groupBy({
                by: ['categoryId'],
                _count: {
                    categoryId: true,
                },
                orderBy: {
                    _count: {
                        categoryId: 'desc',
                    },
                },
                take: 5,
            }),

            // Location statistics - top 5 locations by event count
            prisma.event.groupBy({
                by: ['locationId'],
                _count: {
                    locationId: true,
                },
                orderBy: {
                    _count: {
                        locationId: 'desc',
                    },
                },
                take: 5,
            }),

            // Booking status breakdown
            prisma.booking.groupBy({
                by: ['status'],
                _count: {
                    status: true,
                },
                _sum: {
                    totalPrice: true,
                    quantity: true,
                },
            }),
        ]);

        // Fetch category details for top categories
        const categoryIds = categoryStats.map((stat: any) => stat.categoryId);
        const categories = categoryIds.length > 0
            ? await prisma.category.findMany({
                where: { id: { in: categoryIds } },
                select: {
                    id: true,
                    title: true,
                    categorySlug: true,
                    active: true,
                },
            })
            : [];

        // Fetch location details for top locations
        const locationIds = locationStats.map((stat: any) => stat.locationId);
        const locations = locationIds.length > 0
            ? await prisma.location.findMany({
                where: { id: { in: locationIds } },
                select: {
                    id: true,
                    name: true,
                    locationSlug: true,
                    type: true,
                    active: true,
                },
            })
            : [];

        // Map category stats with details
        const topCategories = categoryStats.map((stat: any) => {
            const category = categories.find((c: any) => c.id === stat.categoryId);
            return {
                categoryId: stat.categoryId,
                categoryName: category?.title || null,
                categorySlug: category?.categorySlug || null,
                active: category?.active || false,
                eventCount: stat._count.categoryId,
            };
        });

        // Map location stats with details
        const topLocations = locationStats.map((stat: any) => {
            const location = locations.find((l: any) => l.id === stat.locationId);
            return {
                locationId: stat.locationId,
                locationName: location?.name || null,
                locationSlug: location?.locationSlug || null,
                locationType: location?.type || null,
                active: location?.active || false,
                eventCount: stat._count.locationId,
            };
        });

        // Format booking status stats
        const bookingsByStatus = bookingStatusStats.map((stat: any) => ({
            status: stat.status,
            count: stat._count.status,
            totalRevenue: stat._sum.totalPrice || 0,
            totalTickets: stat._sum.quantity || 0,
        }));

        return {
            events: {
                total,
                active,
                inactive,
                upcoming,
                ongoing,
                past,
                withSeats,
                withoutSeats,
            },
            categories: {
                totalCategories: categoryIds.length,
                topCategories,
            },
            locations: {
                totalLocations: locationIds.length,
                topLocations,
            },
            bookings: {
                totalBookings,
                totalRevenue: totalBookingRevenue._sum.totalPrice || 0,
                byStatus: bookingsByStatus,
            },
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

    /**
     * Mark all expired events as inactive
     * Expired events are those with endAt < current time
     */
    async markExpiredEventsAsInactive(): Promise<number> {
        const result = await prisma.event.updateMany({
            where: {
                endAt: {
                    lt: new Date(),
                },
                active: true,
            },
            data: {
                active: false,
            },
        });

        return result.count;
    }

    /**
     * Check if an event is expired
     */
    isEventExpired(event: { endAt: Date }): boolean {
        return new Date(event.endAt) < new Date();
    }
}

export default new EventRepository();
