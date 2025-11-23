import { z } from 'zod';

/**
 * Schema for creating a new application feature
 */
export const createApplicationFeatureSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters')
        .trim(),
    status: z.boolean({
        message: 'Status must be a boolean',
    }),
    config: z
        .record(z.string(), z.any())
        .optional()
        .nullable()
        .refine(
            (val) => {
                if (val === null || val === undefined) return true;
                try {
                    JSON.stringify(val);
                    return true;
                } catch {
                    return false;
                }
            },
            { message: 'Config must be a valid JSON object' }
        ),
});

/**
 * Schema for updating an application feature
 * Note: name cannot be updated
 */
export const updateApplicationFeatureSchema = z.object({
    status: z.boolean({
        message: 'Status must be a boolean',
    }),
    config: z
        .record(z.string(), z.any())
        .optional()
        .nullable()
        .refine(
            (val) => {
                if (val === null || val === undefined) return true;
                try {
                    JSON.stringify(val);
                    return true;
                } catch {
                    return false;
                }
            },
            { message: 'Config must be a valid JSON object' }
        ),
});

/**
 * Schema for application feature ID parameter
 */
export const applicationFeatureIdParamSchema = z.object({
    id: z.string().cuid('Invalid application feature ID format'),
});

/**
 * Type exports
 */
export type CreateApplicationFeatureDto = z.infer<typeof createApplicationFeatureSchema>;
export type UpdateApplicationFeatureDto = z.infer<typeof updateApplicationFeatureSchema>;
export type ApplicationFeatureIdParam = z.infer<typeof applicationFeatureIdParamSchema>;
