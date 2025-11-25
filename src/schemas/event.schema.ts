import { z } from 'zod';

// ==================== I18N SCHEMAS ====================

const i18nStringSchema = z.object({
    en: z.string().min(1).max(255),
    ar: z.string().optional(),
});

const i18nTextSchema = z.object({
    en: z.string().min(1),
    ar: z.string().optional(),
});

// ==================== CREATE EVENT ====================

export const createEventSchema = z.object({
    name: i18nStringSchema,
    description: i18nTextSchema,
    startAt: z.string().datetime({ message: 'Invalid datetime format for startAt' }),
    endAt: z.string().datetime({ message: 'Invalid datetime format for endAt' }),
    haveSeats: z.boolean().optional().default(false),
    originalPrice: z.number().positive({ message: 'Original price must be a positive number' }).optional(),
    discountedPrice: z.number().positive({ message: 'Discounted price must be a positive number' }).optional(),
    categoryIds: z.array(z.string().cuid()).min(1, 'At least one category is required'),
    locationIds: z.array(z.string().cuid()).min(1, 'At least one location is required'),
    mediaUrls: z.array(z.string().url()).optional(),
}).refine(
    (data) => {
        const start = new Date(data.startAt);
        const end = new Date(data.endAt);
        return end > start;
    },
    {
        message: 'endAt must be after startAt',
        path: ['endAt'],
    }
).refine(
    (data) => {
        // If haveSeats is false, originalPrice is required
        if (!data.haveSeats && data.originalPrice === undefined) {
            return false;
        }
        return true;
    },
    {
        message: 'originalPrice is required when haveSeats is false',
        path: ['originalPrice'],
    }
).refine(
    (data) => {
        // If discountedPrice is provided and originalPrice is provided, discountedPrice must be less than originalPrice
        if (data.discountedPrice !== undefined && data.originalPrice !== undefined) {
            return data.discountedPrice < data.originalPrice;
        }
        return true;
    },
    {
        message: 'discountedPrice must be less than originalPrice',
        path: ['discountedPrice'],
    }
);

// ==================== UPDATE EVENT ====================

export const updateEventSchema = z.object({
    name: i18nStringSchema.optional(),
    description: i18nTextSchema.optional(),
    startAt: z.string().datetime({ message: 'Invalid datetime format for startAt' }).optional(),
    endAt: z.string().datetime({ message: 'Invalid datetime format for endAt' }).optional(),
    haveSeats: z.boolean().optional(),
    originalPrice: z.number().positive({ message: 'Original price must be a positive number' }).nullable().optional(),
    discountedPrice: z.number().positive({ message: 'Discounted price must be a positive number' }).nullable().optional(),
    categoryIds: z.array(z.string().cuid()).min(1).optional(),
    locationIds: z.array(z.string().cuid()).min(1).optional(),
    mediaUrls: z.array(z.string().url()).optional(),
}).refine(
    (data) => {
        // If both dates are provided, validate that endAt is after startAt
        if (data.startAt && data.endAt) {
            const start = new Date(data.startAt);
            const end = new Date(data.endAt);
            return end > start;
        }
        return true;
    },
    {
        message: 'endAt must be after startAt',
        path: ['endAt'],
    }
).refine(
    (data) => {
        // If both prices are provided and not null, discountedPrice must be less than originalPrice
        if (data.discountedPrice !== undefined && data.discountedPrice !== null &&
            data.originalPrice !== undefined && data.originalPrice !== null) {
            return data.discountedPrice < data.originalPrice;
        }
        return true;
    },
    {
        message: 'discountedPrice must be less than originalPrice',
        path: ['discountedPrice'],
    }
);

// ==================== TOGGLE ACTIVE ====================

export const toggleEventActiveSchema = z.object({
    active: z.boolean(),
});

// ==================== MANAGE CATEGORIES ====================

export const manageEventCategoriesSchema = z.object({
    categoryIds: z.array(z.string().cuid()).min(1, 'At least one category ID is required'),
});

// ==================== MANAGE LOCATIONS ====================

export const manageEventLocationsSchema = z.object({
    locationIds: z.array(z.string().cuid()).min(1, 'At least one location ID is required'),
});

// ==================== PARAM SCHEMAS ====================

export const eventIdParamSchema = z.object({
    id: z.string().cuid(),
});

export const eventIdentifierParamSchema = z.object({
    identifier: z.string().min(1),
});

// ==================== QUERY SCHEMAS ====================

export const getAllEventsQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    active: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
    categoryId: z.string().cuid().optional(),
    locationId: z.string().cuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});
