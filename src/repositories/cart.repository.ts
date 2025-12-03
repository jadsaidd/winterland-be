import { CartStatus } from '@prisma/client';

import { prisma } from '../utils/prisma.client';

export class CartRepository {
    /**
     * Find user's active cart with all items and event details
     */
    async findActiveCartByUserId(userId: string) {
        return await prisma.cart.findFirst({
            where: {
                userId,
                status: CartStatus.ACTIVE,
            },
            include: {
                cartItems: {
                    include: {
                        event: {
                            include: {
                                eventMedias: {
                                    include: {
                                        media: true,
                                    },
                                    orderBy: {
                                        sortOrder: 'asc',
                                    },
                                },
                                eventCategories: {
                                    include: {
                                        category: true,
                                    },
                                },
                                location: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Find cart by ID with all items and event details
     */
    async findById(cartId: string) {
        return await prisma.cart.findUnique({
            where: { id: cartId },
            include: {
                cartItems: {
                    include: {
                        event: {
                            include: {
                                eventMedias: {
                                    include: {
                                        media: true,
                                    },
                                    orderBy: {
                                        sortOrder: 'asc',
                                    },
                                },
                                eventCategories: {
                                    include: {
                                        category: true,
                                    },
                                },
                                location: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Create a new cart for user
     */
    async createCart(userId: string, currency: string = 'AED') {
        return await prisma.cart.create({
            data: {
                userId,
                currency,
                status: CartStatus.ACTIVE,
            },
            include: {
                cartItems: {
                    include: {
                        event: true,
                    },
                },
            },
        });
    }

    /**
     * Find cart item by cart and event ID
     */
    async findCartItem(cartId: string, eventId: string) {
        return await prisma.cartItem.findUnique({
            where: {
                cartId_eventId: {
                    cartId,
                    eventId,
                },
            },
        });
    }

    /**
     * Find cart item by ID
     */
    async findCartItemById(cartItemId: string) {
        return await prisma.cartItem.findUnique({
            where: { id: cartItemId },
            include: {
                cart: true,
                event: true,
            },
        });
    }

    /**
     * Add item to cart (or replace quantity if exists)
     */
    async addItemToCart(cartId: string, eventId: string, quantity: number) {
        return await prisma.cartItem.upsert({
            where: {
                cartId_eventId: {
                    cartId,
                    eventId,
                },
            },
            update: {
                quantity,
                updatedAt: new Date(),
            },
            create: {
                cartId,
                eventId,
                quantity,
            },
        });
    }

    /**
     * Update cart item quantity
     */
    async updateCartItemQuantity(cartItemId: string, quantity: number) {
        return await prisma.cartItem.update({
            where: { id: cartItemId },
            data: {
                quantity,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Delete cart item
     */
    async deleteCartItem(cartItemId: string) {
        return await prisma.cartItem.delete({
            where: { id: cartItemId },
        });
    }

    /**
     * Update cart totals
     */
    async updateCartTotals(cartId: string, totalAmount: number, discountAmount: number) {
        return await prisma.cart.update({
            where: { id: cartId },
            data: {
                totalAmount,
                discountAmount,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Get all cart items for a cart
     */
    async getCartItems(cartId: string) {
        return await prisma.cartItem.findMany({
            where: { cartId },
            include: {
                event: true,
            },
        });
    }

    /**
     * Update cart status
     */
    async updateCartStatus(cartId: string, status: CartStatus) {
        return await prisma.cart.update({
            where: { id: cartId },
            data: {
                status,
                updatedAt: new Date(),
                ...(status === CartStatus.CHECKED_OUT && { checkedOutAt: new Date() }),
            },
        });
    }

    /**
     * Check if event is already in cart
     */
    async isEventInCart(cartId: string, eventId: string): Promise<boolean> {
        const item = await prisma.cartItem.findUnique({
            where: {
                cartId_eventId: {
                    cartId,
                    eventId,
                },
            },
        });
        return !!item;
    }

    /**
     * Get cart item count
     */
    async getCartItemCount(cartId: string): Promise<number> {
        return await prisma.cartItem.count({
            where: { cartId },
        });
    }

    /**
     * Delete all expired cart items (where event has ended)
     */
    async deleteExpiredCartItems(cartId: string) {
        const now = new Date();
        return await prisma.cartItem.deleteMany({
            where: {
                cartId,
                event: {
                    endAt: {
                        lt: now,
                    },
                },
            },
        });
    }
}

export default new CartRepository();
