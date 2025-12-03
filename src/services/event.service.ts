import { BadRequestException, NotFoundException } from '../exceptions/http.exception';
import categoryRepository from '../repositories/category.repository';
import eventRepository from '../repositories/event.repository';
import { LocationRepository } from '../repositories/location.repository';
import { MediaRepository } from '../repositories/media.repository';
import { PaginatedResponse } from '../utils/pagination.util';

const locationRepository = new LocationRepository();
const mediaRepository = new MediaRepository();

/**
 * Event Service
 * Handles business logic for event operations
 */
export class EventService {
    /**
     * Generate URL-friendly slug from English name
     */
    private generateSlug(name: string): string {
        return name
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
    private async generateUniqueSlug(baseName: string, excludeId?: string): Promise<string> {
        let slug = this.generateSlug(baseName);
        let counter = 1;
        let finalSlug = slug;

        // Keep checking until we find a unique slug
        while (await eventRepository.slugExists(finalSlug, excludeId)) {
            finalSlug = `${slug}-${counter}`;
            counter++;
        }

        return finalSlug;
    }

    /**
     * Validate date range
     */
    private validateDateRange(startAt: Date, endAt: Date): void {
        if (endAt <= startAt) {
            throw new BadRequestException('End date must be after start date');
        }
    }

    /**
     * Validate and get active categories
     */
    private async validateCategories(categoryIds: string[]): Promise<void> {
        if (!categoryIds || categoryIds.length === 0) {
            throw new BadRequestException('At least one category is required');
        }

        // Remove duplicates
        const uniqueIds = [...new Set(categoryIds)];

        // Check each category exists and is active
        for (const categoryId of uniqueIds) {
            const category = await categoryRepository.findById(categoryId);

            if (!category) {
                throw new NotFoundException(`Category with ID ${categoryId} not found`);
            }

            if (!category.active) {
                throw new BadRequestException(`Category ${categoryId} is not active`);
            }
        }
    }

    /**
     * Validate and get active locations
     */
    private async validateLocations(locationIds: string[]): Promise<void> {
        if (!locationIds || locationIds.length === 0) {
            throw new BadRequestException('At least one location is required');
        }

        // Remove duplicates
        const uniqueIds = [...new Set(locationIds)];

        // Check each location exists and is active
        for (const locationId of uniqueIds) {
            const location = await locationRepository.findById(locationId);

            if (!location) {
                throw new NotFoundException(`Location with ID ${locationId} not found`);
            }

            if (!location.active) {
                throw new BadRequestException(`Location ${locationId} is not active`);
            }
        }
    }

    /**
     * Process and create media records from URLs
     */
    private async processMediaUrls(mediaUrls: string[]): Promise<string[]> {
        const mediaIds: string[] = [];

        for (const url of mediaUrls) {
            const media = await mediaRepository.createMedia({
                url,
                type: 'IMAGE', // Default to IMAGE, can be enhanced later
                context: 'event',
            });
            mediaIds.push(media.id);
        }

        return mediaIds;
    }

    /**
     * Create a new event
     */
    async createEvent(
        data: {
            name: { en: string; ar?: string };
            description: { en: string; ar?: string };
            startAt: string;
            endAt: string;
            haveSeats?: boolean;
            originalPrice?: number;
            discountedPrice?: number;
            categoryIds: string[];
            locationId: string;
            mediaUrls?: string[];
        },
        _userId?: string
    ): Promise<any> {
        // Convert dates
        const startAt = new Date(data.startAt);
        const endAt = new Date(data.endAt);

        // Validate date range
        this.validateDateRange(startAt, endAt);

        // Validate categories
        await this.validateCategories(data.categoryIds);

        // Validate location
        await this.validateLocations([data.locationId]);

        // Generate unique slug
        const eventSlug = await this.generateUniqueSlug(data.name.en);

        // Create event
        const event = await eventRepository.create({
            name: data.name,
            eventSlug,
            description: data.description,
            startAt,
            endAt,
            haveSeats: data.haveSeats ?? false,
            originalPrice: data.originalPrice,
            discountedPrice: data.discountedPrice,
            locationId: data.locationId,
        });

        // Add categories
        const uniqueCategoryIds = [...new Set(data.categoryIds)];
        await eventRepository.addCategories(event.id, uniqueCategoryIds);

        // Process media if provided
        if (data.mediaUrls && data.mediaUrls.length > 0) {
            const mediaIds = await this.processMediaUrls(data.mediaUrls);
            await eventRepository.addMedia(event.id, mediaIds);
        }

        // Return event with relations
        return await eventRepository.findById(event.id, true);
    }

    /**
     * Get all events with pagination and filters
     */
    async getAllEvents(
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
        return await eventRepository.findAll(page, limit, filters);
    }

    /**
     * Get event by ID or slug
     */
    async getEventByIdOrSlug(identifier: string): Promise<any> {
        const event = await eventRepository.findByIdOrSlug(identifier, true);

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        return event;
    }

    /**
     * Get event by ID or slug for mobile (excludes expired events)
     */
    async getEventByIdOrSlugForMobile(identifier: string): Promise<any> {
        const event = await eventRepository.findByIdOrSlug(identifier, true);

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Check if event is expired (endAt < now)
        if (eventRepository.isEventExpired(event)) {
            throw new NotFoundException('Event not found');
        }

        // Check if event is active
        if (!event.active) {
            throw new NotFoundException('Event not found');
        }

        return event;
    }

    /**
     * Mark all expired events as inactive
     * This can be called by a cron job or background task
     */
    async markExpiredEventsAsInactive(): Promise<number> {
        return await eventRepository.markExpiredEventsAsInactive();
    }

    /**
     * Update event
     */
    async updateEvent(
        id: string,
        data: {
            name?: { en: string; ar?: string };
            description?: { en: string; ar?: string };
            startAt?: string;
            endAt?: string;
            haveSeats?: boolean;
            originalPrice?: number | null;
            discountedPrice?: number | null;
            categoryIds?: string[];
            locationId?: string;
            mediaUrls?: string[];
        }
    ): Promise<any> {
        // Check if event exists
        const existingEvent = await eventRepository.findById(id);
        if (!existingEvent) {
            throw new NotFoundException('Event not found');
        }

        const updateData: any = {};

        // Update name and slug if name is changed
        if (data.name) {
            updateData.name = data.name;

            // Only regenerate slug if English name changed
            if (data.name.en !== (existingEvent.name as any).en) {
                updateData.eventSlug = await this.generateUniqueSlug(data.name.en, id);
            }
        }

        // Update description
        if (data.description) {
            updateData.description = data.description;
        }

        // Update dates
        if (data.startAt) {
            updateData.startAt = new Date(data.startAt);
        }
        if (data.endAt) {
            updateData.endAt = new Date(data.endAt);
        }

        // Update haveSeats
        if (data.haveSeats !== undefined) {
            updateData.haveSeats = data.haveSeats;
        }

        // Update pricing (allow null to clear prices when haveSeats is true)
        if (data.originalPrice !== undefined) {
            updateData.originalPrice = data.originalPrice;
        }
        if (data.discountedPrice !== undefined) {
            updateData.discountedPrice = data.discountedPrice;
        }

        // Validate date range if both dates are being updated or one is being updated
        const finalStartAt = updateData.startAt || existingEvent.startAt;
        const finalEndAt = updateData.endAt || existingEvent.endAt;
        this.validateDateRange(finalStartAt, finalEndAt);

        // Update event basic info
        if (Object.keys(updateData).length > 0) {
            await eventRepository.update(id, updateData);
        }

        // Update categories if provided
        if (data.categoryIds) {
            await this.validateCategories(data.categoryIds);
            const uniqueCategoryIds = [...new Set(data.categoryIds)];
            await eventRepository.replaceCategories(id, uniqueCategoryIds);
        }

        // Update location if provided
        if (data.locationId) {
            await this.validateLocations([data.locationId]);
            updateData.locationId = data.locationId;
        }

        // Update media if provided
        if (data.mediaUrls) {
            if (data.mediaUrls.length > 0) {
                const mediaIds = await this.processMediaUrls(data.mediaUrls);
                await eventRepository.replaceMedia(id, mediaIds);
            } else {
                // Clear all media
                await eventRepository.replaceMedia(id, []);
            }
        }

        // Return updated event with relations
        return await eventRepository.findById(id, true);
    }

    /**
     * Toggle event active status
     */
    async toggleEventActive(id: string, active: boolean): Promise<any> {
        // Check if event exists
        const event = await eventRepository.findById(id);
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Update active status
        return await eventRepository.toggleActive(id, active);
    }

    /**
     * Delete event
     */
    async deleteEvent(id: string): Promise<void> {
        // Check if event exists
        const event = await eventRepository.findById(id);
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        await eventRepository.delete(id);
    }

    /**
     * Get event statistics
     */
    async getEventStatistics(): Promise<any> {
        return await eventRepository.getStatistics();
    }

    /**
     * Add categories to event
     */
    async addCategoriesToEvent(eventId: string, categoryIds: string[]): Promise<any> {
        // Check if event exists
        const event = await eventRepository.findById(eventId);
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Validate categories
        await this.validateCategories(categoryIds);

        // Remove duplicates
        const uniqueCategoryIds = [...new Set(categoryIds)];

        // Add categories
        await eventRepository.addCategories(eventId, uniqueCategoryIds);

        // Return updated categories
        return await eventRepository.getEventCategories(eventId);
    }

    /**
     * Remove categories from event
     */
    async removeCategoriesFromEvent(eventId: string, categoryIds: string[]): Promise<void> {
        // Check if event exists
        const event = await eventRepository.findById(eventId);
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Remove duplicates
        const uniqueCategoryIds = [...new Set(categoryIds)];

        // Get current categories
        const currentCategories = await eventRepository.getEventCategories(eventId);
        const currentIds = new Set(currentCategories.map((cat: any) => cat.id));
        // Count how many of the requested IDs are actually attached
        const toRemoveCount = uniqueCategoryIds.filter(id => currentIds.has(id)).length;
        const remainingCount = currentIds.size - toRemoveCount;
        if (remainingCount < 1) {
            throw new BadRequestException('Event must have at least one category');
        }

        // Remove categories (repository can ignore non-attached IDs)
        await eventRepository.removeCategories(eventId, uniqueCategoryIds);
    }
}

export default new EventService();
