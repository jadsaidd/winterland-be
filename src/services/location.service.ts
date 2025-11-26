import slugify from 'slugify';

import { NotFoundException } from '../exceptions/http.exception';
import { LocationRepository, LocationWithRelations } from '../repositories/location.repository';
import { PaginatedResponse } from '../utils/pagination.util';

/**
 * Location Service
 * Handles business logic for location operations
 */
export class LocationService {
    private locationRepository: LocationRepository;

    constructor() {
        this.locationRepository = new LocationRepository();
    }

    /**
     * Generate URL-friendly slug from English name.
     * Uses a Unicode-aware transliteration (slugify) and guarantees non-empty output.
     */
    private generateSlug(name: string): string {
        const base = (name ?? '').trim();
        // Unicode-aware transliteration and normalization
        let result = slugify(base, {
            lower: true,
            strict: true, // strip non-url-safe chars while preserving transliteration
            trim: true,
        });

        // Guard: ensure a non-empty slug; provide deterministic fallback
        if (!result) {
            result = `location-${Date.now()}`;
        }

        return result;
    }

    /**
     * Generate unique slug, appending number if needed
     */
    private async generateUniqueSlug(baseName: string, excludeId?: string): Promise<string> {
        let slug = this.generateSlug(baseName);
        let counter = 1;
        let finalSlug = slug;

        // Keep checking until we find a unique slug
        while (await this.locationRepository.slugExists(finalSlug, excludeId)) {
            finalSlug = `${slug}-${counter}`;
            counter++;
        }

        return finalSlug;
    }

    /**
     * Create a new location
     */
    async createLocation(
        data: {
            name: { en: string; ar?: string };
            description: { en: string; ar?: string };
            type?: 'STADIUM' | 'ARENA' | 'THEATRE' | 'HALL' | 'OUTDOOR' | 'INDOOR' | 'OTHER';
            capacity?: number;
            latitude?: number;
            longitude?: number;
            mediaUrls?: string[];
        },
        uploadedBy?: string
    ): Promise<LocationWithRelations> {
        // Generate unique slug from English name
        const slug = await this.generateUniqueSlug(data.name.en);

        // Create location
        const location = await this.locationRepository.create({
            name: data.name,
            locationSlug: slug,
            description: data.description,
            active: true, // Default to active
            type: data.type,
            capacity: data.capacity,
            latitude: data.latitude,
            longitude: data.longitude,
        });

        // Link media if provided
        if (data.mediaUrls && data.mediaUrls.length > 0) {
            await Promise.all(
                data.mediaUrls.map((url, index) =>
                    this.locationRepository.createAndLinkMedia(
                        location.id,
                        url,
                        index + 1, // sortOrder starts from 1
                        uploadedBy
                    )
                )
            );

            // Fetch updated location with media
            return (await this.locationRepository.findById(location.id)) as LocationWithRelations;
        }

        return location;
    }

    /**
     * Get location by ID or slug
     */
    async getLocationByIdOrSlug(identifier: string): Promise<LocationWithRelations> {
        const location = await this.locationRepository.findByIdOrSlug(identifier);

        if (!location) {
            throw new NotFoundException('Location not found');
        }

        return location;
    }

    /**
     * Get all locations with pagination and filters
     */
    async getAllLocations(
        page: number,
        limit: number,
        filters?: {
            active?: string;
            type?: string;
            search?: string;
        }
    ): Promise<PaginatedResponse<LocationWithRelations>> {
        // Parse active filter
        const parsedFilters: { active?: boolean; type?: string; search?: string } = {};

        if (filters?.active) {
            parsedFilters.active = filters.active === 'true';
        }

        if (filters?.type) {
            parsedFilters.type = filters.type;
        }

        if (filters?.search) {
            parsedFilters.search = filters.search;
        }

        return await this.locationRepository.findAll(page, limit, parsedFilters);
    }

    /**
     * Update location
     */
    async updateLocation(
        identifier: string,
        data: {
            name?: { en: string; ar?: string };
            description?: { en: string; ar?: string };
            type?: 'STADIUM' | 'ARENA' | 'THEATRE' | 'HALL' | 'OUTDOOR' | 'INDOOR' | 'OTHER';
            capacity?: number | null;
            latitude?: number | null;
            longitude?: number | null;
            mediaUrls?: string[];
        },
        uploadedBy?: string
    ): Promise<LocationWithRelations> {
        // Check if location exists
        const existingLocation = await this.getLocationByIdOrSlug(identifier);

        // Prepare update data
        const updateData: any = {};

        if (data.name) {
            updateData.name = data.name;
            // Regenerate slug if name changed
            const newSlug = await this.generateUniqueSlug(data.name.en, existingLocation.id);
            updateData.locationSlug = newSlug;
        }

        if (data.description) {
            updateData.description = data.description;
        }

        if (data.type !== undefined) {
            updateData.type = data.type;
        }

        if (data.capacity !== undefined) {
            updateData.capacity = data.capacity;
        }

        if (data.latitude !== undefined) {
            updateData.latitude = data.latitude;
        }

        if (data.longitude !== undefined) {
            updateData.longitude = data.longitude;
        }

        // Update location
        // Only perform repository update if there are scalar changes
        let updatedLocation: LocationWithRelations;
        if (Object.keys(updateData).length > 0) {
            updatedLocation = await this.locationRepository.update(existingLocation.id, updateData) as LocationWithRelations;
        } else {
            // No scalar changes; keep existing location instance
            updatedLocation = existingLocation;
        }

        // Handle media updates if provided
        if (data.mediaUrls !== undefined) {
            // Remove all existing media links
            await this.locationRepository.removeAllMedia(existingLocation.id);

            // Add new media links
            if (data.mediaUrls.length > 0) {
                await Promise.all(
                    data.mediaUrls.map((url, index) =>
                        this.locationRepository.createAndLinkMedia(
                            existingLocation.id,
                            url,
                            index + 1, // sortOrder starts from 1
                            uploadedBy
                        )
                    )
                );
            }

            // Fetch updated location with new media (fresh relations)
            return (await this.locationRepository.findById(existingLocation.id)) as LocationWithRelations;
        }

        return updatedLocation;
    }

    /**
     * Toggle location active status
     */
    async toggleLocationActive(identifier: string, active: boolean): Promise<LocationWithRelations> {
        // Check if location exists
        const existingLocation = await this.getLocationByIdOrSlug(identifier);

        return await this.locationRepository.toggleActive(existingLocation.id, active);
    }

    /**
     * Delete location
     */
    async deleteLocation(identifier: string): Promise<void> {
        // Check if location exists
        const existingLocation = await this.getLocationByIdOrSlug(identifier);

        await this.locationRepository.delete(existingLocation.id);
    }

    /**
     * Get comprehensive location statistics
     */
    async getLocationsStats(): Promise<{
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
        return await this.locationRepository.getLocationsStatistics();
    }

    /**
     * Get location template by location ID or slug
     */
    async getLocationTemplate(identifier: string): Promise<{
        id: string;
        name: string;
        config: any;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        locationId: string;
    }> {
        // First, get the location to ensure it exists and get the ID
        const location = await this.getLocationByIdOrSlug(identifier);

        const template = await this.locationRepository.getTemplateByLocationId(location.id);

        if (!template) {
            throw new NotFoundException('Location template not found');
        }

        return template;
    }
}

export const locationService = new LocationService();
