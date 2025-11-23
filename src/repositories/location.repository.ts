import { Prisma } from '@prisma/client';

import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import prisma from '../utils/prisma.client';

/**
 * Location with its relations
 */
export interface LocationWithRelations {
    id: string;
    name: any;
    locationSlug: string;
    description: any;
    active: boolean;
    type: string;
    capacity: number | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: Date;
    updatedAt: Date;
    locationMedias: Array<{
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
    eventLocations?: Array<{
        id: string;
        eventId: string;
        event: {
            id: string;
            name: any;
            eventSlug: string;
            active: boolean;
        };
    }>;
}

/**
 * Location Repository
 * Handles all database operations for locations
 */
export class LocationRepository {
    /**
     * Create a new location
     */
    async create(data: {
        name: any;
        locationSlug: string;
        description: any;
        active?: boolean;
        type?: string;
        capacity?: number;
        latitude?: number;
        longitude?: number;
    }): Promise<LocationWithRelations> {
        return await prisma.location.create({
            data,
            include: {
                locationMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
                eventLocations: {
                    include: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                eventSlug: true,
                                active: true,
                            },
                        },
                    },
                },
            },
        }) as LocationWithRelations;
    }

    /**
     * Find location by ID
     */
    async findById(id: string): Promise<LocationWithRelations | null> {
        return await prisma.location.findUnique({
            where: { id },
            include: {
                locationMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
                eventLocations: {
                    include: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                eventSlug: true,
                                active: true,
                            },
                        },
                    },
                },
            },
        }) as LocationWithRelations | null;
    }

    /**
     * Find location by slug
     */
    async findBySlug(slug: string): Promise<LocationWithRelations | null> {
        return await prisma.location.findUnique({
            where: { locationSlug: slug },
            include: {
                locationMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
                eventLocations: {
                    include: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                eventSlug: true,
                                active: true,
                            },
                        },
                    },
                },
            },
        }) as LocationWithRelations | null;
    }

    /**
     * Find location by ID or slug
     */
    async findByIdOrSlug(identifier: string): Promise<LocationWithRelations | null> {
        // Try to find by ID first
        let location = await this.findById(identifier);

        // If not found by ID, try slug
        if (!location) {
            location = await this.findBySlug(identifier);
        }

        return location;
    }

    /**
     * Check if slug exists (excluding specific ID for updates)
     */
    async slugExists(slug: string, excludeId?: string): Promise<boolean> {
        const where: Prisma.LocationWhereInput = {
            locationSlug: slug,
        };

        if (excludeId) {
            where.id = { not: excludeId };
        }

        const count = await prisma.location.count({ where });
        return count > 0;
    }

    /**
     * Get all locations with pagination and filters
     */
    async findAll(
        page: number,
        limit: number,
        filters?: {
            active?: boolean;
            type?: string;
            search?: string;
        }
    ): Promise<PaginatedResponse<LocationWithRelations>> {
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.LocationWhereInput = {};

        if (filters?.active !== undefined) {
            where.active = filters.active;
        }

        if (filters?.type) {
            where.type = filters.type as any;
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

        // Fetch locations and total count in parallel
        const [locations, total] = await Promise.all([
            prisma.location.findMany({
                where,
                skip,
                take: limit,
                include: {
                    locationMedias: {
                        include: {
                            media: true,
                        },
                        orderBy: {
                            sortOrder: 'asc',
                        },
                    },
                    eventLocations: {
                        include: {
                            event: {
                                select: {
                                    id: true,
                                    name: true,
                                    eventSlug: true,
                                    active: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.location.count({ where }),
        ]);

        return createPaginatedResponse(locations as LocationWithRelations[], total, page, limit);
    }

    /**
     * Update a location
     */
    async update(
        id: string,
        data: {
            name?: any;
            locationSlug?: string;
            description?: any;
            type?: string;
            capacity?: number | null;
            latitude?: number | null;
            longitude?: number | null;
        }
    ): Promise<LocationWithRelations> {
        return await prisma.location.update({
            where: { id },
            data,
            include: {
                locationMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
                eventLocations: {
                    include: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                eventSlug: true,
                                active: true,
                            },
                        },
                    },
                },
            },
        }) as LocationWithRelations;
    }

    /**
     * Toggle location active status
     */
    async toggleActive(id: string, active: boolean): Promise<LocationWithRelations> {
        return await prisma.location.update({
            where: { id },
            data: { active },
            include: {
                locationMedias: {
                    include: {
                        media: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
                eventLocations: {
                    include: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                eventSlug: true,
                                active: true,
                            },
                        },
                    },
                },
            },
        }) as LocationWithRelations;
    }

    /**
     * Delete a location
     */
    async delete(id: string): Promise<void> {
        await prisma.location.delete({
            where: { id },
        });
    }

    /**
     * Get comprehensive location statistics
     */
    async getLocationsStatistics(): Promise<{
        total: number;
        active: number;
        inactive: number;
        withEvents: number;
        withoutEvents: number;
        withMedia: number;
        withoutMedia: number;
        byType: Record<string, number>;
        totalEvents: number;
        averageEventsPerLocation: number;
        topLocations: Array<{
            id: string;
            name: any;
            locationSlug: string;
            eventCount: number;
            active: boolean;
            type: string;
        }>;
        recentLocations: Array<{
            id: string;
            name: any;
            locationSlug: string;
            createdAt: Date;
            active: boolean;
            type: string;
        }>;
        locationDistribution: {
            activeWithEvents: number;
            activeWithoutEvents: number;
            inactiveWithEvents: number;
            inactiveWithoutEvents: number;
        };
    }> {
        // Get basic counts
        const [total, active, withEvents, withMedia] = await Promise.all([
            prisma.location.count(),
            prisma.location.count({ where: { active: true } }),
            prisma.location.count({
                where: {
                    eventLocations: {
                        some: {},
                    },
                },
            }),
            prisma.location.count({
                where: {
                    locationMedias: {
                        some: {},
                    },
                },
            }),
        ]);

        // Get total events count across all locations
        const totalEventsCount = await prisma.eventLocation.count();

        // Get counts by type
        const types = await prisma.location.groupBy({
            by: ['type'],
            _count: true,
        });

        const byType: Record<string, number> = {};
        types.forEach((t: any) => {
            byType[t.type] = t._count;
        });

        // Get top 5 locations by event count
        const topLocations = await prisma.location.findMany({
            select: {
                id: true,
                name: true,
                locationSlug: true,
                active: true,
                type: true,
                _count: {
                    select: {
                        eventLocations: true,
                    },
                },
            },
            orderBy: {
                eventLocations: {
                    _count: 'desc',
                },
            },
            take: 5,
        });

        // Get 5 most recent locations
        const recentLocations = await prisma.location.findMany({
            select: {
                id: true,
                name: true,
                locationSlug: true,
                type: true,
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
                prisma.location.count({
                    where: {
                        active: true,
                        eventLocations: {
                            some: {},
                        },
                    },
                }),
                prisma.location.count({
                    where: {
                        active: true,
                        eventLocations: {
                            none: {},
                        },
                    },
                }),
                prisma.location.count({
                    where: {
                        active: false,
                        eventLocations: {
                            some: {},
                        },
                    },
                }),
                prisma.location.count({
                    where: {
                        active: false,
                        eventLocations: {
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
            byType,
            totalEvents: totalEventsCount,
            averageEventsPerLocation:
                total > 0 ? Math.round((totalEventsCount / total) * 100) / 100 : 0,
            topLocations: topLocations.map((loc: any) => ({
                id: loc.id,
                name: loc.name,
                locationSlug: loc.locationSlug,
                eventCount: loc._count.eventLocations,
                active: loc.active,
                type: loc.type,
            })),
            recentLocations: recentLocations.map((loc: any) => ({
                id: loc.id,
                name: loc.name,
                locationSlug: loc.locationSlug,
                createdAt: loc.createdAt,
                active: loc.active,
                type: loc.type,
            })),
            locationDistribution: {
                activeWithEvents,
                activeWithoutEvents,
                inactiveWithEvents,
                inactiveWithoutEvents,
            },
        };
    }

    /**
     * Create media record and link to location
     */
    async createAndLinkMedia(
        locationId: string,
        url: string,
        sortOrder: number,
        uploadedBy?: string
    ): Promise<void> {
        await prisma.locationMedia.create({
            data: {
                location: {
                    connect: { id: locationId },
                },
                sortOrder,
                media: {
                    create: {
                        url,
                        type: 'IMAGE',
                        context: 'location',
                        uploadedBy,
                    },
                },
            },
        });
    }

    /**
     * Remove all media links for a location
     */
    async removeAllMedia(locationId: string): Promise<void> {
        await prisma.locationMedia.deleteMany({
            where: { locationId },
        });
    }
}
