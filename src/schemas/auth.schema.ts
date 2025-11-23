import { z } from 'zod';

// Login schema (email OR phone)
export const loginUserSchema = z.object({
  email: z.email('Invalid email address').optional(),
  phoneNumber: z.string().min(1, 'Phone number is required').optional(),
  countryCodeId: z.cuid('Invalid country code ID').optional(),
})
  .refine((data) => data.email || data.phoneNumber, {
    message: 'Either email or phone number must be provided',
    path: ['email'],
  })
  .refine((data) => {
    if (data.phoneNumber && !data.countryCodeId) {
      return false;
    }
    return true;
  }, {
    message: 'Country code is required when phone number is provided',
    path: ['countryCodeId'],
  });

// Verify OTP schema
export const verifyOTPSchema = z.object({
  code: z.string().length(4, 'Verification code must be 4 digits'),
  email: z.email('Invalid email address').optional(),
  phoneNumber: z.string().min(1, 'Phone number is required').optional(),
  countryCodeId: z.cuid('Invalid country code ID').optional(),
})
  .refine((data) => data.email || data.phoneNumber, {
    message: 'Either email or phone number must be provided',
    path: ['email'],
  })
  .refine((data) => {
    if (data.phoneNumber && !data.countryCodeId) {
      return false;
    }
    return true;
  }, {
    message: 'Country code is required when phone number is provided',
    path: ['countryCodeId'],
  });

// Google login schema
export const googleLoginSchema = z.object({
  googleId: z.string().min(1, 'Google ID is required'),
  email: z.email('Invalid email address'),
  name: z.string().optional(),
  profilePictureUrl: z.string().url('Invalid profile picture URL').optional(),
  googleVerifiedEmail: z.boolean().optional(),
});

// Apple login schema
export const appleLoginSchema = z.object({
  appleId: z.string().min(1, 'Apple ID is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  name: z.string().optional(),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Logout schema
export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Resend OTP schema (same as login)
export const resendOTPSchema = loginUserSchema;

// Guest login schema
export const guestLoginSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

// Export types from schemas
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type AppleLoginInput = z.infer<typeof appleLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ResendOTPInput = z.infer<typeof resendOTPSchema>;
export type GuestLoginInput = z.infer<typeof guestLoginSchema>;
