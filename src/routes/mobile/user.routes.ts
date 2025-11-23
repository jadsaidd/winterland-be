import { Router } from 'express';

import { MobileUserController } from '../../controllers/mobile/user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { updateUserApplicationDataSchema, updateUserProfileSchema } from '../../schemas/user.schema';

const router = Router();
const userController = new MobileUserController();

/**
 * Get current authenticated user profile
 * @route GET /mobile/user/me
 * @access Private (requires authentication)
 */
router.get(
    '/me',
    authMiddleware,
    userController.getCurrentUser
);

/**
 * Delete user account (soft delete)
 * @route DELETE /mobile/user/delete-account
 * @access Private (requires authentication)
 */
router.delete(
    '/delete-account',
    authMiddleware,
    userController.deleteAccount
);

/**
 * Update user application data
 * @route PATCH /mobile/user/update-data
 * @access Private (requires authentication)
 */
router.patch(
    '/update-data',
    authMiddleware,
    validate(updateUserApplicationDataSchema),
    userController.updateApplicationData
);

/**
 * Update user profile (name, language, profileUrl)
 * @route PATCH /mobile/user/update-profile
 * @access Private (requires authentication)
 */
router.patch(
    '/update-profile',
    authMiddleware,
    validate(updateUserProfileSchema),
    userController.updateProfile
);

export default router;
