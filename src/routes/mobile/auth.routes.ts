import { Router } from 'express';

import { MobileAuthController } from '../../controllers/mobile/auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
// import { authLimiter, otpLimiter, verifyLimiter } from '../../rate-limiter/mobile/auth.rate-limiter';
import { appleLoginSchema, googleLoginSchema, guestLoginSchema, loginUserSchema, logoutSchema, refreshTokenSchema, resendOTPSchema, verifyOTPSchema } from '../../schemas/auth.schema';

const router = Router();
const authController = new MobileAuthController();

/**
 * @route   POST /mobile/auth/login
 * @desc    Login with email or phone (sends OTP)
 * @access  Public
 */
router.post(
    '/login',
    // otpLimiter,
    validate(loginUserSchema),
    authController.login
);

/**
 * @route   POST /mobile/auth/verify
 * @desc    Verify OTP and complete login
 * @access  Public
 */
router.post(
    '/verify',
    // verifyLimiter,
    validate(verifyOTPSchema),
    authController.verify
);

/**
 * @route   POST /mobile/auth/google
 * @desc    Login with Google
 * @access  Public
 */
router.post(
    '/google',
    // authLimiter,
    validate(googleLoginSchema),
    authController.googleLogin
);

/**
 * @route   POST /mobile/auth/apple
 * @desc    Login with Apple
 * @access  Public
 */
router.post(
    '/apple',
    // authLimiter,
    validate(appleLoginSchema),
    authController.appleLogin
);

/**
 * @route   POST /mobile/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
    '/refresh-token',
    // authLimiter,
    validate(refreshTokenSchema),
    authController.refreshToken
);

/**
 * @route   POST /mobile/auth/logout
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
 * @route   POST /mobile/auth/resend-otp
 * @desc    Resend OTP
 * @access  Public
 */
router.post(
    '/resend-otp',
    // otpLimiter,
    validate(resendOTPSchema),
    authController.resendOTP
);

/**
 * @route   POST /mobile/auth/guest-login
 * @desc    Guest login with device ID
 * @access  Public
 */
router.post(
    '/guest-login',
    validate(guestLoginSchema),
    authController.guestLogin
);

export default router;