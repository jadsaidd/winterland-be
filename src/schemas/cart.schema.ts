import { z } from 'zod';

/**
 * Schema for adding item to cart
 * POST /api/v1/mobile/cart
 */
export const addToCartSchema = z.object({
    eventId: z.string().min(1, 'Event ID is required'),
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(1, 'Quantity must be at least 1')
        .max(100, 'Quantity cannot exceed 100'),
});

/**
 * Schema for updating cart item quantity
 * PATCH /api/v1/mobile/cart/items/:id
 */
export const updateCartItemSchema = z.object({
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(1, 'Quantity must be at least 1')
        .max(100, 'Quantity cannot exceed 100'),
});

/**
 * Schema for cart item ID parameter
 * Used in DELETE and PATCH endpoints
 */
export const cartItemIdParamSchema = z.object({
    id: z.string().min(1, 'Cart item ID is required'),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemIdParam = z.infer<typeof cartItemIdParamSchema>;
