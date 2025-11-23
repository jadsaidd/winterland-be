import { Router } from 'express';

import mobileCartController from '../../controllers/mobile/cart.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { addToCartSchema, cartItemIdParamSchema, updateCartItemSchema } from '../../schemas/cart.schema';

const router = Router();

/**
 * Mobile Cart Routes
 * All routes are protected with authentication
 */

/**
 * @route   POST /api/v1/mobile/cart
 * @desc    Add item to cart
 * @access  Private (Mobile Users)
 */
router.post(
    '/',
    authMiddleware,
    validate(addToCartSchema),
    mobileCartController.addToCart
);

/**
 * @route   GET /api/v1/mobile/cart
 * @desc    Get user's cart with all details
 * @access  Private (Mobile Users)
 */
router.get(
    '/',
    authMiddleware,
    mobileCartController.getCart
);

/**
 * @route   PATCH /api/v1/mobile/cart/items/:id
 * @desc    Update cart item quantity
 * @access  Private (Mobile Users)
 */
router.patch(
    '/items/:id',
    authMiddleware,
    validate(cartItemIdParamSchema, 'params'),
    validate(updateCartItemSchema),
    mobileCartController.updateCartItem
);

/**
 * @route   DELETE /api/v1/mobile/cart/items/:id
 * @desc    Delete cart item
 * @access  Private (Mobile Users)
 */
router.delete(
    '/items/:id',
    authMiddleware,
    validate(cartItemIdParamSchema, 'params'),
    mobileCartController.deleteCartItem
);

export default router;
