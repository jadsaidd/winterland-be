import { z } from 'zod';

/**
 * I18n schema for multi-language fields
 */
const i18nSchema = z.object({
    en: z.string().min(1, 'English translation is required'),
    ar: z.string().optional(),
});

/**
 * Location type enum values
 */
const locationTypeSchema = z.enum([
    'STADIUM',
    'ARENA',
    'THEATRE',
    'HALL',
    'OUTDOOR',
    'INDOOR',
    'OTHER',
]);

/**
 * Schema for creating a new location
 */
export const createLocationSchema = z.object({
    body: z.object({
        name: i18nSchema,
        description: i18nSchema,
        type: locationTypeSchema.optional(),
        capacity: z.number().int().positive('Capacity must be a positive number').optional(),
        latitude: z
            .number()
            .min(-90, 'Latitude must be between -90 and 90')
            .max(90, 'Latitude must be between -90 and 90')
            .optional(),
        longitude: z
            .number()
            .min(-180, 'Longitude must be between -180 and 180')
            .max(180, 'Longitude must be between -180 and 180')
            .optional(),
        mediaUrls: z.array(z.string().url('Invalid media URL')).optional(),
    }),
});

/**
 * Schema for updating an existing location
 */
export const updateLocationSchema = z.object({
    body: z.object({
        name: i18nSchema.optional(),
        description: i18nSchema.optional(),
        type: locationTypeSchema.optional(),
        capacity: z.number().int().positive('Capacity must be a positive number').optional().nullable(),
        latitude: z
            .number()
            .min(-90, 'Latitude must be between -90 and 90')
            .max(90, 'Latitude must be between -90 and 90')
            .optional()
            .nullable(),
        longitude: z
            .number()
            .min(-180, 'Longitude must be between -180 and 180')
            .max(180, 'Longitude must be between -180 and 180')
            .optional()
            .nullable(),
        mediaUrls: z.array(z.string().url('Invalid media URL')).optional(),
    }),
});

/**
 * Schema for toggling location active status
 */
export const toggleLocationActiveSchema = z.object({
    body: z.object({
        active: z.boolean({
            message: 'Active must be a boolean',
        }),
    }),
});

/**
 * Schema for location ID/slug path parameter
 */
export const locationIdentifierParamSchema = z.object({
    params: z.object({
        identifier: z.string().min(1, 'Location identifier is required'),
    }),
});

/**
 * Schema for query parameters in get all locations
 */
export const getLocationsQuerySchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        active: z.enum(['true', 'false']).optional(),
        type: locationTypeSchema.optional(),
        search: z.string().optional(),
    }),
});

/**
 * Schema for query parameters in get location zones
 */
export const getLocationZonesQuerySchema = z.object({
    query: z.object({
        scheduleId: z.string().optional(),
        eventId: z.string().optional(),
    }),
});

/**
 * Single zone pricing item in the array
 */
const zonePricingItemSchema = z.object({
    locationZoneId: z.string().min(1, 'Location zone ID is required'),
    originalPrice: z.number().positive('Original price must be a positive number'),
    discountedPrice: z.number().positive('Discounted price must be a positive number').optional().nullable(),
});

/**
 * Schema for setting zone pricing
 * Takes scheduleId which determines the event and location context
 */
export const setZonePricingSchema = z.object({
    body: z.object({
        scheduleId: z.string().min(1, 'Schedule ID is required'),
        pricings: z.array(zonePricingItemSchema).min(1, 'At least one pricing item is required'),
    }),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>['body'];
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>['body'];
export type ToggleLocationActiveInput = z.infer<typeof toggleLocationActiveSchema>['body'];
export type LocationIdentifierParam = z.infer<typeof locationIdentifierParamSchema>['params'];
export type GetLocationsQuery = z.infer<typeof getLocationsQuerySchema>['query'];
export type GetLocationZonesQuery = z.infer<typeof getLocationZonesQuerySchema>['query'];
export type SetZonePricingInput = z.infer<typeof setZonePricingSchema>['body'];
export type ZonePricingItem = z.infer<typeof zonePricingItemSchema>;
