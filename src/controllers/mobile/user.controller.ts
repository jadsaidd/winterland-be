import { NextFunction, Request, Response } from 'express';

import { UserService } from '../../services/user.service';

const userService = new UserService();

export class MobileUserController {
    /**
     * Get current authenticated user profile
     * @route GET /mobile/user/me
     */
    async getCurrentUser(req: Request, res: Response, next: NextFunction) {
        try {
            // User ID comes from authMiddleware (JWT token)
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
            }

            const result = await userService.getCurrentUser(userId);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete user account (soft delete)
     * @route DELETE /mobile/user/delete-account
     */
    async deleteAccount(req: Request, res: Response, next: NextFunction) {
        try {
            // User ID comes from authMiddleware (JWT token)
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
            }

            const result = await userService.deleteAccount(userId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    revokedTokens: result.revokedTokens,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user app settings
     * @route PATCH /mobile/user/update
     */
    async updateUserSettings(req: Request, res: Response, next: NextFunction) {
        try {
            // User ID comes from authMiddleware (JWT token)
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
            }

            const result = await userService.updateUserSettings(userId, req.body);

            res.status(200).json({
                success: true,
                message: 'Settings updated successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user application data (UserApplicationData)
     * @route PATCH /mobile/user/update-data
     */
    async updateApplicationData(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
            }

            const result = await userService.updateUserApplicationData(userId, req.body);

            res.status(200).json({
                success: true,
                message: 'Application data updated successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user profile (name, language, profileUrl)
     * @route PATCH /mobile/user/update-profile
     */
    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
            }

            const result = await userService.updateUserProfile(userId, req.body);

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
