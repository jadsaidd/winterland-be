import { z } from 'zod';

// Country code schemas
export const createCountryCodeSchema = z.object({
    country: z.string().trim().min(1, 'Country name is required'),
    flagUrl: z.string().url('Invalid flag URL').optional(),
    isoCode: z.string().trim().length(2, 'ISO code must be 2 characters').optional(),
    code: z.string().trim().min(1, 'Country code is required'),
    digits: z.number().int().positive('Digits must be a positive integer'),
    active: z.boolean().optional(),
});

export const updateCountryCodeSchema = z.object({
    country: z.string().trim().min(1, 'Country name is required').optional(),
    flagUrl: z.string().url('Invalid flag URL').optional(),
    isoCode: z.string().trim().length(2, 'ISO code must be 2 characters').optional(),
    code: z.string().trim().min(1, 'Country code is required').optional(),
    digits: z.number().int().positive('Digits must be a positive integer').optional(),
    active: z.boolean().optional(),
});

export const toggleActiveSchema = z.object({
    active: z.boolean({
        message: 'Active status must be a boolean',
    }),
});

// Parameter schemas
export const countryCodeIdParamSchema = z.object({
    id: z.cuid('Invalid country code ID'),
});

// Export types from schemas
export type CreateCountryCodeInput = z.infer<typeof createCountryCodeSchema>;
export type UpdateCountryCodeInput = z.infer<typeof updateCountryCodeSchema>;
export type ToggleActiveInput = z.infer<typeof toggleActiveSchema>;
export type CountryCodeIdParam = z.infer<typeof countryCodeIdParamSchema>;
