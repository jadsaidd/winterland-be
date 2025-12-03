import { NextFunction, Request, Response } from 'express';

import cartService from '../../services/cart.service';
import { getPreferredLanguage, localizeObject, SupportedLanguage } from '../../utils/i18n.util';

/**
 * Mobile Cart Controller
 * Handles HTTP requests for cart endpoints (mobile app)
 */
export class MobileCartController {
    /**
     * Localize cart data for response
     */
    private localizeCart(cart: any, language: SupportedLanguage): any {
        if (!cart) return cart;

        return {
            ...cart,
            cartItems: cart.cartItems?.map((item: any) => ({
                ...item,
                event: {
                    ...localizeObject(item.event, ['name', 'description'], language),
                    // Localize nested relations
                    eventCategories: item.event.eventCategories?.map((ec: any) => ({
                        ...ec,
                        category: localizeObject(ec.category, ['title', 'description'], language),
                    })),
                    location: item.event.location
                        ? localizeObject(item.event.location, ['name', 'description'], language)
                        : null,
                },
            })),
        };
    }

    /**
     * Add item to cart
     * POST /api/v1/mobile/cart
     */
    addToCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { eventId, quantity } = req.body;

            const cart = await cartService.addToCart(userId, eventId, quantity);

            // Localize the response
            const language = getPreferredLanguage(req);
            const localizedCart = this.localizeCart(cart, language);

            res.status(200).json({
                success: true,
                message: 'Item added to cart successfully',
                data: localizedCart,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get user's cart with all details
     * GET /api/v1/mobile/cart
     */
    getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;

            const cart = await cartService.getCart(userId);

            // Localize the response
            const language = getPreferredLanguage(req);
            const localizedCart = this.localizeCart(cart, language);

            res.status(200).json({
                success: true,
                message: 'Cart retrieved successfully',
                data: localizedCart,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update cart item quantity
     * PATCH /api/v1/mobile/cart/items/:id
     */
    updateCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { quantity } = req.body;

            const cart = await cartService.updateCartItemQuantity(userId, id, quantity);

            // Localize the response
            const language = getPreferredLanguage(req);
            const localizedCart = this.localizeCart(cart, language);

            res.status(200).json({
                success: true,
                message: 'Cart item updated successfully',
                data: localizedCart,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Delete cart item
     * DELETE /api/v1/mobile/cart/items/:id
     */
    deleteCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const cart = await cartService.deleteCartItem(userId, id);

            // Localize the response
            const language = getPreferredLanguage(req);
            const localizedCart = this.localizeCart(cart, language);

            res.status(200).json({
                success: true,
                message: 'Cart item removed successfully',
                data: localizedCart,
            });
        } catch (error) {
            next(error);
        }
    };

}

export default new MobileCartController();
