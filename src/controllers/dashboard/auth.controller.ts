import { NextFunction, Request, Response } from 'express';

import { DashboardAuthService } from '../../services/dashboard-auth.service';

const authService = new DashboardAuthService();

export class DashboardAuthController {
    /**
     * Login with email or phone (passwordless)
     * @route POST /dashboard/auth/login
     */
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.login(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify OTP and complete login
     * @route POST /dashboard/auth/verify
     */
    async verify(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.verifyOTP(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Refresh access token
     * @route POST /dashboard/auth/refresh-token
     */
    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshAccessToken(refreshToken);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout (revoke refresh token)
     * @route POST /dashboard/auth/logout
     */
    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.logout(refreshToken);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Resend OTP
     * @route POST /dashboard/auth/resend-otp
     */
    async resendOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.resendOTP(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}