import { CartStatus } from '@prisma/client';

import { BadRequestException, NotFoundException } from '../exceptions/http.exception';
import cartRepository from '../repositories/cart.repository';
import eventRepository from '../repositories/event.repository';

/**
 * Cart Service
 * Handles business logic for cart operations
 */
export class CartService {
    /**
     * Recalculate cart totals based on current items and event prices
     * This ensures prices are always up-to-date with current event pricing
     */
    private async recalculateCartTotals(cartId: string): Promise<void> {
        const cartItems = await cartRepository.getCartItems(cartId);

        let totalAmount = 0;
        let discountAmount = 0;

        for (const item of cartItems) {
            const event = item.event;

            // Calculate price per item (use discounted price if available)
            const pricePerItem = event.discountedPrice || event.originalPrice;
            const itemTotal = pricePerItem * item.quantity;

            totalAmount += itemTotal;

            // Calculate discount for this item if discount price exists
            if (event.discountedPrice) {
                const discountPerItem = event.originalPrice - event.discountedPrice;
                discountAmount += discountPerItem * item.quantity;
            }
        }

        // Update cart with recalculated totals
        await cartRepository.updateCartTotals(cartId, totalAmount, discountAmount);
    }

    /**
     * Validate and clean cart by removing expired items
     * Returns count of removed items
     */
    private async validateAndCleanCart(cartId: string): Promise<number> {
        const result = await cartRepository.deleteExpiredCartItems(cartId);
        return result.count;
    }

    /**
     * Validate event is active and available
     */
    private async validateEvent(eventId: string): Promise<any> {
        const event = await eventRepository.findById(eventId);

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if (!event.active) {
            throw new BadRequestException('Event is not active');
        }

        // Check if event has already ended
        const now = new Date();
        if (event.endAt < now) {
            throw new BadRequestException('Event has already ended');
        }

        return event;
    }

    /**
     * Get or create active cart for user
     */
    private async getOrCreateCart(userId: string): Promise<any> {
        let cart = await cartRepository.findActiveCartByUserId(userId);

        if (!cart) {
            cart = await cartRepository.createCart(userId);
        }

        return cart;
    }

    /**
     * Add item to cart
     */
    async addToCart(userId: string, eventId: string, quantity: number): Promise<any> {
        // Validate quantity
        if (quantity < 1) {
            throw new BadRequestException('Quantity must be at least 1');
        }

        // Validate event
        await this.validateEvent(eventId);

        // Get or create cart
        const cart = await this.getOrCreateCart(userId);

        // Add item to cart (will increment if already exists)
        await cartRepository.addItemToCart(cart.id, eventId, quantity);

        // Clean expired items
        await this.validateAndCleanCart(cart.id);

        // Recalculate totals
        await this.recalculateCartTotals(cart.id);

        // Return updated cart
        return await cartRepository.findById(cart.id);
    }

    /**
     * Get user's cart with all details
     */
    async getCart(userId: string): Promise<any> {
        // Get or create cart
        let cart = await this.getOrCreateCart(userId);

        // Clean expired items
        const removedCount = await this.validateAndCleanCart(cart.id);

        // Recalculate totals (in case prices changed)
        await this.recalculateCartTotals(cart.id);

        // Get fresh cart data after cleanup and recalculation
        cart = await cartRepository.findById(cart.id);

        return {
            ...cart,
            ...(removedCount > 0 && { expiredItemsRemoved: removedCount }),
        };
    }

    /**
     * Update cart item quantity
     */
    async updateCartItemQuantity(userId: string, cartItemId: string, quantity: number): Promise<any> {
        // Validate quantity
        if (quantity < 1) {
            throw new BadRequestException('Quantity must be at least 1');
        }

        // Find cart item
        const cartItem = await cartRepository.findCartItemById(cartItemId);

        if (!cartItem) {
            throw new NotFoundException('Cart item not found');
        }

        // Verify cart belongs to user
        if (cartItem.cart.userId !== userId) {
            throw new BadRequestException('This cart item does not belong to you');
        }

        // Verify cart is active
        if (cartItem.cart.status !== CartStatus.ACTIVE) {
            throw new BadRequestException('Cannot modify inactive cart');
        }

        // Validate event is still active
        await this.validateEvent(cartItem.eventId);

        // Update quantity
        await cartRepository.updateCartItemQuantity(cartItemId, quantity);

        // Clean expired items
        await this.validateAndCleanCart(cartItem.cart.id);

        // Recalculate totals
        await this.recalculateCartTotals(cartItem.cart.id);

        // Return updated cart
        return await cartRepository.findById(cartItem.cart.id);
    }

    /**
     * Delete cart item
     */
    async deleteCartItem(userId: string, cartItemId: string): Promise<any> {
        // Find cart item
        const cartItem = await cartRepository.findCartItemById(cartItemId);

        if (!cartItem) {
            throw new NotFoundException('Cart item not found');
        }

        // Verify cart belongs to user
        if (cartItem.cart.userId !== userId) {
            throw new BadRequestException('This cart item does not belong to you');
        }

        // Verify cart is active
        if (cartItem.cart.status !== CartStatus.ACTIVE) {
            throw new BadRequestException('Cannot modify inactive cart');
        }

        // Delete the item
        await cartRepository.deleteCartItem(cartItemId);

        // Clean expired items
        await this.validateAndCleanCart(cartItem.cart.id);

        // Recalculate totals
        await this.recalculateCartTotals(cartItem.cart.id);

        // Return updated cart
        return await cartRepository.findById(cartItem.cart.id);
    }

    /**
     * Clear entire cart (optional utility method for future use)
     */
    async clearCart(userId: string): Promise<void> {
        const cart = await cartRepository.findActiveCartByUserId(userId);

        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        // Delete all items
        const items = await cartRepository.getCartItems(cart.id);
        for (const item of items) {
            await cartRepository.deleteCartItem(item.id);
        }

        // Reset totals
        await cartRepository.updateCartTotals(cart.id, 0, 0);
    }
}

export default new CartService();
