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
 * Schema for creating a new payment method
 */
export const createPaymentMethodSchema = z.object({
    name: i18nFieldSchema,
    description: i18nFieldSchema.optional(),
    mediaUrls: z.array(mediaUrlSchema).optional().default([]),
}).strict();

/**
 * Schema for updating an existing payment method
 */
export const updatePaymentMethodSchema = z.object({
    name: i18nFieldSchema.optional(),
    description: i18nFieldSchema.optional(),
    mediaUrls: z.array(mediaUrlSchema).optional(),
    isActive: z.boolean().optional(),
}).strict().refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
);

/**
 * Schema for toggling payment method active status (PATCH)
 */
export const togglePaymentMethodActiveSchema = z.object({
    isActive: z.boolean({ message: 'Active status must be a boolean value' }),
}).strict();

/**
 * Schema for payment method ID parameter
 */
export const paymentMethodIdParamSchema = z.object({
    id: z.string().min(1, 'Payment method ID is required'),
}).strict();

/**
 * Schema for get all payment methods query parameters
 */
export const getPaymentMethodsQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
}).strict();

/**
 * Schema for mobile payment methods query parameters
 */
export const getMobilePaymentMethodsQuerySchema = z.object({
    includeWallet: z.enum(['true', 'false']).optional(),
}).strict();

/**
 * Type exports for use in controllers/services
 */
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;
export type TogglePaymentMethodActiveInput = z.infer<typeof togglePaymentMethodActiveSchema>;
export type GetPaymentMethodsQuery = z.infer<typeof getPaymentMethodsQuerySchema>;
export type GetMobilePaymentMethodsQuery = z.infer<typeof getMobilePaymentMethodsQuerySchema>;
