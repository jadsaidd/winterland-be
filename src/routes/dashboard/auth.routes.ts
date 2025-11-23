import { Router } from 'express';

import { DashboardAuthController } from '../../controllers/dashboard/auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
// import { dashboardAuthLimiter, dashboardOtpLimiter, dashboardVerifyLimiter } from '../../rate-limiter/dashboard/auth.rate-limiter';
import { loginUserSchema, logoutSchema, refreshTokenSchema, resendOTPSchema, verifyOTPSchema } from '../../schemas/auth.schema';

const router = Router();
const authController = new DashboardAuthController();

/**
 * @route   POST /dashboard/auth/login
 * @desc    Login with email or phone (sends OTP) - Existing users only
 * @access  Public
 */
router.post(
    '/login',
    // dashboardOtpLimiter,
    validate(loginUserSchema),
    authController.login
);

/**
 * @route   POST /dashboard/auth/verify
 * @desc    Verify OTP and complete login
 * @access  Public
 */
router.post(
    '/verify',
    // dashboardVerifyLimiter,
    validate(verifyOTPSchema),
    authController.verify
);

/**
 * @route   POST /dashboard/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
    '/refresh-token',
    // dashboardAuthLimiter,
    validate(refreshTokenSchema),
    authController.refreshToken
);

/**
 * @route   POST /dashboard/auth/logout
 * @desc    Logout (revoke refresh token)
 * @access  Private
 */
router.post(
    '/logout',
    authMiddleware,
    validate(logoutSchema),
    authController.logout
);

/**
 * @route   POST /dashboard/auth/resend-otp
 * @desc    Resend OTP
 * @access  Public
 */
router.post(
    '/resend-otp',
    // dashboardOtpLimiter,
    validate(resendOTPSchema),
    authController.resendOTP
);

export default router;
