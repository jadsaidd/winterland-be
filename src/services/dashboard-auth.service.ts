import { UserStatus, VerificationType } from '@prisma/client';

import { config, logger } from "../config";
import { BadRequestException, HttpException, UnauthorizedException } from "../exceptions/http.exception";
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { UserRepository } from "../repositories/user.repository";
import { VerificationRepository } from '../repositories/verification.repository';
import { sendOTPEmail, sendOTPSMS } from '../utils/notification.util';
import { generateOTP } from '../utils/otp.util';
import { generateAccessToken, generateSecureRefreshToken } from '../utils/token.util';

const userRepository = new UserRepository();
const verificationRepository = new VerificationRepository();
const refreshTokenRepository = new RefreshTokenRepository();

export class DashboardAuthService {
    /**
     * Dashboard login with email or phone (passwordless OTP)
     * Only for existing users - does not create new users
     * @param loginData Login data (email OR phone)
     * @returns User info and message
     */
    async login(loginData: { email?: string; phoneNumber?: string; countryCodeId?: string }) {
        try {
            const { email, phoneNumber, countryCodeId } = loginData;

            // Validate input
            if (!email && !phoneNumber) {
                throw new BadRequestException('Email or phone number is required');
            }

            if (phoneNumber && !countryCodeId) {
                throw new BadRequestException('Country code is required when using phone number');
            }

            let user;
            let verificationType: VerificationType;
            let channel: string;

            // Find user by email or phone
            if (email) {
                user = await userRepository.findByEmail(email);
                verificationType = VerificationType.EMAIL;
                channel = email;
            } else {
                // Validate phone number with country code
                const isValidPhone = await userRepository.validatePhoneNumberLength(phoneNumber!, countryCodeId!);
                if (!isValidPhone) {
                    throw new BadRequestException('Invalid phone number length for selected country code');
                }

                user = await userRepository.findByPhoneNumber(phoneNumber!);
                verificationType = VerificationType.PHONE;
                channel = phoneNumber!;
            }

            // Dashboard specific: User must exist
            if (!user) {
                throw new UnauthorizedException('User not found. Please contact administrator.');
            }

            // Check if account is suspended or deleted
            if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
                throw new UnauthorizedException(
                    user.status === UserStatus.SUSPENDED
                        ? 'Your account has been suspended. Please contact support.'
                        : 'Your account has been deleted. Please contact support to recover it.'
                );
            }

            // Check if account is locked
            if (user.lockedUntil && user.lockedUntil > new Date()) {
                const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
                throw new UnauthorizedException(
                    `Account is locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`
                );
            }

            // Check OTP rate limiting (max 5 OTPs in 15 minutes)
            const recentOTPs = await verificationRepository.countRecentVerifications(
                user.id,
                verificationType,
                15
            );
            if (recentOTPs >= 5) {
                throw new BadRequestException('Too many OTP requests. Please try again in 15 minutes.');
            }

            // Generate OTP (use fixed code for test users)
            let otp: string;
            if ((user as any).isTestUser) {
                otp = '1234';
            } else {
                otp = generateOTP(4);
            }
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Deactivate old verifications
            await verificationRepository.deactivateUserVerifications(user.id, verificationType);

            // Create new verification
            await verificationRepository.createVerification(
                user.id,
                verificationType,
                otp,
                expiresAt,
                channel
            );

            // Send OTP (skip sending for test users but still save the verification)
            let otpSent = false;
            if ((user as any).isTestUser) {
                logger.info(`Test user ${user.id} - using fixed OTP and skipping send`);
                otpSent = true;
            } else {
                if (verificationType === VerificationType.EMAIL) {
                    otpSent = await sendOTPEmail(channel, otp, user.name || undefined);
                } else {
                    otpSent = await sendOTPSMS(channel, otp);
                }

                if (!otpSent) {
                    throw new BadRequestException('Failed to send verification code. Please try again.');
                }
            }

            return {
                success: true,
                message: `Verification code sent to your ${verificationType === VerificationType.EMAIL ? 'email' : 'phone'}`,
                data: {
                    userId: user.id,
                    channel: verificationType === VerificationType.EMAIL ? 'email' : 'phone',
                    expiresIn: 900, // 15 minutes in seconds
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error("Dashboard login error:", error);
            throw new BadRequestException("Failed to process login request");
        }
    }

    /**
     * Verify OTP and issue tokens for dashboard
     * @param verifyData Verification data
     * @returns User info and tokens (no isNewUser flag)
     */
    async verifyOTP(verifyData: {
        code: string;
        email?: string;
        phoneNumber?: string;
        countryCodeId?: string;
    }) {
        try {
            const { code, email, phoneNumber } = verifyData;

            // Validate input
            if (!code) {
                throw new BadRequestException('Verification code is required');
            }

            if (!email && !phoneNumber) {
                throw new BadRequestException('Email or phone number is required');
            }

            // Determine verification type
            const verificationType = email ? VerificationType.EMAIL : VerificationType.PHONE;

            // Find verification by code
            const verification = await verificationRepository.findByCode(code, verificationType);

            if (!verification) {
                throw new UnauthorizedException('Invalid or expired verification code');
            }

            // Verify channel matches
            const channelMatch = email
                ? verification.channel === email
                : verification.channel === phoneNumber;

            if (!channelMatch) {
                throw new UnauthorizedException('Verification code does not match the provided contact');
            }

            const user = verification.user;

            // Check user status
            if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
                throw new UnauthorizedException('Your account is not active');
            }

            // Mark verification as used
            await verificationRepository.markAsUsed(verification.id);

            // Update user verification status
            const updateData: any = {
                isVerified: true,
                lastLogin: new Date(),
                failedLoginAttempts: 0,
                lockedUntil: null,
            };

            if (verificationType === VerificationType.EMAIL) {
                updateData.isEmailVerified = true;
            } else {
                updateData.isPhoneVerified = true;
            }

            await userRepository.updateUser(user.id, updateData);

            // Fetch user with roles and permissions
            const userWithRoles = await userRepository.findByIdWithRolesAndPermissions(user.id);

            // Format roles and permissions
            const roles = userWithRoles?.userRoles.map((ur: any) => ({
                id: ur.role.id,
                name: ur.role.name,
                description: ur.role.description,
                permissions: ur.role.rolePermissions.map((rp: any) => ({
                    id: rp.permission.id,
                    name: rp.permission.name,
                    resource: rp.permission.resource,
                    action: rp.permission.action,
                })),
            })) || [];

            // Generate tokens with Dashboard platform
            const accessToken = generateAccessToken({
                userId: user.id,
                email: user.email,
                phoneNumber: user.phoneNumber,
                platform: 'Dashboard',
            });

            const refreshToken = generateSecureRefreshToken();
            const refreshExpiresAt = new Date(Date.now() + config.JWT_REFRESH_EXPIRATION * 1000);

            // Store refresh token
            await refreshTokenRepository.createRefreshToken(user.id, refreshToken, refreshExpiresAt);

            return {
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        name: user.name,
                        profilePictureUrl: user.profilePictureUrl,
                        isEmailVerified: user.isEmailVerified,
                        isPhoneVerified: user.isPhoneVerified,
                        platform: user.platform,
                        roles,
                    },
                    tokens: {
                        accessToken,
                        refreshToken,
                    },
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error("Dashboard verification error:", error);
            throw new BadRequestException("Failed to verify code");
        }
    }

    /**
     * Refresh access token for dashboard
     * @param refreshToken Refresh token
     * @returns New access token and refresh token
     */
    async refreshAccessToken(refreshToken: string) {
        try {
            if (!refreshToken) {
                throw new UnauthorizedException('Refresh token is required');
            }

            // Find and validate token in database
            const tokenRecord = await refreshTokenRepository.findValidToken(refreshToken);

            if (!tokenRecord) {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }

            const user = tokenRecord.user;

            // Check user status
            if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
                throw new UnauthorizedException('Your account is not active');
            }

            // Revoke the old refresh token (single-use tokens for security)
            await refreshTokenRepository.revokeToken(refreshToken);

            // Generate new tokens with Dashboard platform
            const newAccessToken = generateAccessToken({
                userId: user.id,
                email: user.email,
                phoneNumber: user.phoneNumber,
                platform: 'Dashboard',
            });

            const newRefreshToken = generateSecureRefreshToken();
            const refreshExpiresAt = new Date(Date.now() + config.JWT_REFRESH_EXPIRATION * 1000);

            await refreshTokenRepository.createRefreshToken(user.id, newRefreshToken, refreshExpiresAt);

            return {
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    tokens: {
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                    },
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error("Dashboard token refresh error:", error);
            throw new UnauthorizedException("Failed to refresh token");
        }
    }

    /**
     * Logout user (revoke refresh token)
     * @param refreshToken Refresh token to revoke
     * @returns Success message
     */
    async logout(refreshToken: string) {
        try {
            if (!refreshToken) {
                throw new BadRequestException('Refresh token is required');
            }

            await refreshTokenRepository.revokeToken(refreshToken);

            return {
                success: true,
                message: 'Logged out successfully',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error("Dashboard logout error:", error);
            throw new BadRequestException("Failed to logout");
        }
    }

    /**
     * Resend OTP for dashboard
     * @param resendData Resend data (email OR phone)
     * @returns Success message
     */
    async resendOTP(resendData: { email?: string; phoneNumber?: string; countryCodeId?: string }) {
        try {
            const { email, phoneNumber, countryCodeId } = resendData;

            // Validate input
            if (!email && !phoneNumber) {
                throw new BadRequestException('Email or phone number is required');
            }

            if (phoneNumber && !countryCodeId) {
                throw new BadRequestException('Country code is required when using phone number');
            }

            let user;
            let verificationType: VerificationType;
            let channel: string;

            // Find user
            if (email) {
                user = await userRepository.findByEmail(email);
                verificationType = VerificationType.EMAIL;
                channel = email;
            } else {
                user = await userRepository.findByPhoneNumber(phoneNumber!);
                verificationType = VerificationType.PHONE;
                channel = phoneNumber!;
            }

            if (!user) {
                throw new BadRequestException('User not found. Please contact administrator.');
            }

            // Check OTP rate limiting (max 5 OTPs in 15 minutes)
            const recentOTPs = await verificationRepository.countRecentVerifications(
                user.id,
                verificationType,
                15
            );
            if (recentOTPs >= 5) {
                throw new BadRequestException('Too many OTP requests. Please try again in 15 minutes.');
            }

            // Check cool down (60 seconds between resend)
            const lastVerification = await verificationRepository.findActiveVerification(
                user.id,
                verificationType
            );

            if (lastVerification) {
                const timeSinceLastOTP = Date.now() - lastVerification.createdAt.getTime();
                if (timeSinceLastOTP < 60000) { // 60 seconds
                    const secondsLeft = Math.ceil((60000 - timeSinceLastOTP) / 1000);
                    throw new BadRequestException(`Please wait ${secondsLeft} seconds before requesting a new code`);
                }
            }

            // Generate new OTP (use fixed code for test users)
            let otp: string;
            if ((user as any).isTestUser) {
                otp = '1234';
            } else {
                otp = generateOTP(4);
            }
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Deactivate old verifications
            await verificationRepository.deactivateUserVerifications(user.id, verificationType);

            // Create new verification
            await verificationRepository.createVerification(
                user.id,
                verificationType,
                otp,
                expiresAt,
                channel
            );

            // Send OTP (skip sending for test users but still save the verification)
            let otpSent = false;
            if ((user as any).isTestUser) {
                logger.info(`Test user ${user.id} - using fixed OTP and skipping send`);
                otpSent = true;
            } else {
                if (verificationType === VerificationType.EMAIL) {
                    otpSent = await sendOTPEmail(channel, otp, user.name || undefined);
                } else {
                    otpSent = await sendOTPSMS(channel, otp);
                }

                if (!otpSent) {
                    throw new BadRequestException('Failed to send verification code. Please try again.');
                }
            }

            return {
                success: true,
                message: `Verification code resent to your ${verificationType === VerificationType.EMAIL ? 'email' : 'phone'}`,
                data: {
                    expiresIn: 900, // 15 minutes in seconds
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error("Dashboard resend OTP error:", error);
            throw new BadRequestException("Failed to resend verification code");
        }
    }
}
