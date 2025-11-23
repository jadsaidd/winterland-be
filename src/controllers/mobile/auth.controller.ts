import { NextFunction, Request, Response } from 'express';

import { AuthService } from '../../services/auth.service';

const authService = new AuthService();

export class MobileAuthController {
    /**
     * Login with email or phone (passwordless)
     * @route POST /mobile/auth/login
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
     * @route POST /mobile/auth/verify
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
     * Google login
     * @route POST /mobile/auth/google
     */
    async googleLogin(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.googleLogin(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Apple login
     * @route POST /mobile/auth/apple
     */
    async appleLogin(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.appleLogin(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Refresh access token
     * @route POST /mobile/auth/refresh-token
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
     * @route POST /mobile/auth/logout
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
     * @route POST /mobile/auth/resend-otp
     */
    async resendOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.resendOTP(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Guest login
     * @route POST /mobile/auth/guest-login
     */
    async guestLogin(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.guestLogin(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}