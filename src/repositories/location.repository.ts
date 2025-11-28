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
    hasZones: boolean; // Indicates if location has zones/sections/rows/seats configured
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
    events?: Array<{
        id: string;
        name: any;
        eventSlug: string;
        active: boolean;
    }>;
    _count?: {
        locationZones: number;
    };
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
        const location = await prisma.location.create({
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
                events: {
                    select: {
                        id: true,
                        name: true,
                        eventSlug: true,
                        active: true,
                    },
                },
                _count: {
                    select: {
                        locationZones: true,
                    },
                },
            },
        });
        return {
            ...location,
            hasZones: location._count.locationZones > 0,
        } as LocationWithRelations;
    }

    /**
     * Find location by ID
     */
    async findById(id: string): Promise<LocationWithRelations | null> {
        const location = await prisma.location.findUnique({
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
                events: {
                    select: {
                        id: true,
                        name: true,
                        eventSlug: true,
                        active: true,
                    },
                },
                _count: {
                    select: {
                        locationZones: true,
                    },
                },
            },
        });
        if (!location) return null;
        return {
            ...location,
            hasZones: location._count.locationZones > 0,
        } as LocationWithRelations;
    }

    /**
     * Find location by slug
     */
    async findBySlug(slug: string): Promise<LocationWithRelations | null> {
        const location = await prisma.location.findUnique({
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
                events: {
                    select: {
                        id: true,
                        name: true,
                        eventSlug: true,
                        active: true,
                    },
                },
                _count: {
                    select: {
                        locationZones: true,
                    },
                },
            },
        });
        if (!location) return null;
        return {
            ...location,
            hasZones: location._count.locationZones > 0,
        } as LocationWithRelations;
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
                    events: {
                        select: {
                            id: true,
                            name: true,
                            eventSlug: true,
                            active: true,
                        },
                    },
                    _count: {
                        select: {
                            locationZones: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.location.count({ where }),
        ]);

        // Transform locations to include hasZones
        const locationsWithHasZones = locations.map((location: (typeof locations)[number]) => ({
            ...location,
            hasZones: location._count.locationZones > 0,
        })) as LocationWithRelations[];

        return createPaginatedResponse(locationsWithHasZones, total, page, limit);
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
        const location = await prisma.location.update({
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
                events: {
                    select: {
                        id: true,
                        name: true,
                        eventSlug: true,
                        active: true,
                    },
                },
                _count: {
                    select: {
                        locationZones: true,
                    },
                },
            },
        });
        return {
            ...location,
            hasZones: location._count.locationZones > 0,
        } as LocationWithRelations;
    }

    /**
     * Toggle location active status
     */
    async toggleActive(id: string, active: boolean): Promise<LocationWithRelations> {
        const location = await prisma.location.update({
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
                events: {
                    select: {
                        id: true,
                        name: true,
                        eventSlug: true,
                        active: true,
                    },
                },
                _count: {
                    select: {
                        locationZones: true,
                    },
                },
            },
        });
        return {
            ...location,
            hasZones: location._count.locationZones > 0,
        } as LocationWithRelations;
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
                    events: {
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
        const totalEventsCount = await prisma.event.count();

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
                        events: true,
                    },
                },
            },
            orderBy: {
                events: {
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
                        events: {
                            some: {},
                        },
                    },
                }),
                prisma.location.count({
                    where: {
                        active: true,
                        events: {
                            none: {},
                        },
                    },
                }),
                prisma.location.count({
                    where: {
                        active: false,
                        events: {
                            some: {},
                        },
                    },
                }),
                prisma.location.count({
                    where: {
                        active: false,
                        events: {
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
                eventCount: loc._count.events,
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

    /**
 * Get location template by location ID
     */
    async getTemplateByLocationId(locationId: string): Promise<{
        id: string;
        name: string;
        config: any;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        locationId: string;
    } | null> {
        return await prisma.locationTemplate.findUnique({
            where: { locationId },
        });
    }

    /**
     * Get location zones with optional pricing info
     */
    async getLocationZones(
        locationId: string,
        options?: {
            scheduleId?: string;
            eventId?: string;
        }
    ): Promise<Array<{
        id: string;
        zoneId: string;
        zone: {
            id: string;
            type: string;
            priority: number;
        };
        locationSections: Array<{
            id: string;
            position: string;
            numberOfRows: number;
            locationRows: Array<{
                id: string;
                rowNumber: number;
                order: number;
                _count: {
                    seats: number;
                };
            }>;
        }>;
        zonePricings: Array<{
            id: string;
            originalPrice: number;
            discountedPrice: number | null;
            eventId: string;
            scheduleId: string;
            schedule: {
                id: string;
                startAt: Date;
                endAt: Date;
            };
        }>;
        _count: {
            locationSections: number;
        };
    }>> {
        // Build zone pricing where clause
        const zonePricingWhere: any = {};
        if (options?.scheduleId) {
            zonePricingWhere.scheduleId = options.scheduleId;
        }
        if (options?.eventId) {
            zonePricingWhere.eventId = options.eventId;
        }

        const locationZones = await prisma.locationZone.findMany({
            where: {
                locationId,
            },
            include: {
                zone: {
                    select: {
                        id: true,
                        type: true,
                        priority: true,
                    },
                },
                locationSections: {
                    select: {
                        id: true,
                        position: true,
                        numberOfRows: true,
                        locationRows: {
                            select: {
                                id: true,
                                rowNumber: true,
                                order: true,
                                _count: {
                                    select: {
                                        seats: true,
                                    },
                                },
                            },
                            orderBy: {
                                rowNumber: 'asc',
                            },
                        },
                    },
                },
                zonePricings: {
                    where: Object.keys(zonePricingWhere).length > 0 ? zonePricingWhere : undefined,
                    select: {
                        id: true,
                        originalPrice: true,
                        discountedPrice: true,
                        eventId: true,
                        scheduleId: true,
                        schedule: {
                            select: {
                                id: true,
                                startAt: true,
                                endAt: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        locationSections: true,
                    },
                },
            },
            orderBy: {
                zone: {
                    priority: 'asc',
                },
            },
        });

        return locationZones;
    }

    /**
     * Find location zone by ID
     */
    async findLocationZoneById(locationZoneId: string): Promise<{
        id: string;
        locationId: string;
        zoneId: string;
    } | null> {
        return await prisma.locationZone.findUnique({
            where: { id: locationZoneId },
            select: {
                id: true,
                locationId: true,
                zoneId: true,
            },
        });
    }

    /**
     * Find multiple location zones by IDs
     */
    async findLocationZonesByIds(locationZoneIds: string[]): Promise<Array<{
        id: string;
        locationId: string;
        zoneId: string;
    }>> {
        return await prisma.locationZone.findMany({
            where: {
                id: { in: locationZoneIds },
            },
            select: {
                id: true,
                locationId: true,
                zoneId: true,
            },
        });
    }

    /**
     * Find schedule by ID with event info
     */
    async findScheduleById(scheduleId: string): Promise<{
        id: string;
        eventId: string;
        event: {
            id: string;
            locationId: string;
        };
    } | null> {
        return await prisma.schedule.findUnique({
            where: { id: scheduleId },
            select: {
                id: true,
                eventId: true,
                event: {
                    select: {
                        id: true,
                        locationId: true,
                    },
                },
            },
        });
    }

    /**
     * Set zone pricing (upsert - create or update)
     * Uses transaction to ensure atomicity
     */
    async setZonePricing(
        pricings: Array<{
            locationZoneId: string;
            zoneId: string;
            eventId: string;
            scheduleId: string;
            originalPrice: number;
            discountedPrice?: number | null;
        }>
    ): Promise<Array<{
        id: string;
        locationZoneId: string;
        zoneId: string;
        eventId: string;
        scheduleId: string;
        originalPrice: number;
        discountedPrice: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>> {
        return await prisma.$transaction(
            pricings.map((pricing) =>
                prisma.zonePricing.upsert({
                    where: {
                        locationZoneId_eventId_scheduleId: {
                            locationZoneId: pricing.locationZoneId,
                            eventId: pricing.eventId,
                            scheduleId: pricing.scheduleId,
                        },
                    },
                    create: {
                        locationZoneId: pricing.locationZoneId,
                        zoneId: pricing.zoneId,
                        eventId: pricing.eventId,
                        scheduleId: pricing.scheduleId,
                        originalPrice: pricing.originalPrice,
                        discountedPrice: pricing.discountedPrice ?? null,
                    },
                    update: {
                        originalPrice: pricing.originalPrice,
                        discountedPrice: pricing.discountedPrice ?? null,
                    },
                })
            )
        );
    }

    /**
     * Get zone pricing by location zone, event and schedule
     */
    async getZonePricing(
        locationZoneId: string,
        eventId: string,
        scheduleId: string
    ): Promise<{
        id: string;
        originalPrice: number;
        discountedPrice: number | null;
    } | null> {
        return await prisma.zonePricing.findUnique({
            where: {
                locationZoneId_eventId_scheduleId: {
                    locationZoneId,
                    eventId,
                    scheduleId,
                },
            },
            select: {
                id: true,
                originalPrice: true,
                discountedPrice: true,
            },
        });
    }
}
