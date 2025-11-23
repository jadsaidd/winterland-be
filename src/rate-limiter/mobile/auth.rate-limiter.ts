import rateLimit from "express-rate-limit";

// Rate limiter for OTP endpoints (5 requests per 15 minutes)
export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for verification attempts (10 attempts per 15 minutes)
export const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        message: 'Too many verification attempts. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for auth endpoints (20 requests per 15 minutes)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: {
        success: false,
        message: 'Too many authentication requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});