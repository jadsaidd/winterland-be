import { z } from 'zod';

/**
 * I18n field validation schema
 * Requires at least English, Arabic is optional
 */
const i18nFieldSchema = z.object({
    en: z.string().min(1, 'English text is required').trim(),
    ar: z.string().min(1, 'Arabic text is required').trim().optional(),
}).strict();

/**
 * Media URL validation
 */
const mediaUrlSchema = z.url('Invalid media URL format');

/**
 * Schema for creating a new category
 */
export const createCategorySchema = z.object({
    title: i18nFieldSchema,
    description: i18nFieldSchema,
    mediaUrls: z.array(mediaUrlSchema).optional().default([]),
}).strict();

/**
 * Schema for updating an existing category
 */
export const updateCategorySchema = z.object({
    title: i18nFieldSchema.optional(),
    description: i18nFieldSchema.optional(),
    mediaUrls: z.array(mediaUrlSchema).optional(),
    active: z.boolean().optional(),
}).strict().refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
);

/**
 * Schema for toggling category active status (PATCH)
 */
export const toggleCategoryActiveSchema = z.object({
    active: z.boolean({ message: 'Active status must be a boolean value' }),
}).strict();

/**
 * Schema for category ID/slug parameter
 */
export const categoryIdentifierParamSchema = z.object({
    identifier: z.string().min(1, 'Category ID or slug is required'),
}).strict();

/**
 * Schema for get all categories query parameters
 */
export const getCategoriesQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    active: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
}).strict();

/**
 * Type exports for use in controllers/services
 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ToggleCategoryActiveInput = z.infer<typeof toggleCategoryActiveSchema>;
export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;
