import { UserStatus, VerificationType } from '@prisma/client';

import { config, logger } from "../config";
import { BadRequestException, HttpException, UnauthorizedException } from "../exceptions/http.exception";
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from "../repositories/user.repository";
import { VerificationRepository } from '../repositories/verification.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { sendOTPEmail, sendOTPSMS, sendWelcomeEmail } from '../utils/notification.util';
import { generateOTP } from '../utils/otp.util';
import prisma from '../utils/prisma.client';
import { generateAccessToken, generateSecureRefreshToken } from '../utils/token.util';

const userRepository = new UserRepository();
const verificationRepository = new VerificationRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const roleRepository = new RoleRepository();
const walletRepository = new WalletRepository();

export class AuthService {
  /**
   * Login with email or phone (passwordless OTP)
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

      // Check if account is suspended or deleted
      if (user && (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED)) {
        throw new UnauthorizedException(
          user.status === UserStatus.SUSPENDED
            ? 'Your account has been suspended. Please contact support.'
            : 'Your account has been deleted. Please contact support to recover it.'
        );
      }

      // Check if account is locked
      if (user && user.lockedUntil && user.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        throw new UnauthorizedException(
          `Account is locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`
        );
      }

      // Check OTP rate limiting (max 5 OTPs in 15 minutes)
      if (user) {
        const recentOTPs = await verificationRepository.countRecentVerifications(
          user.id,
          verificationType,
          15
        );
        if (recentOTPs >= 5) {
          throw new BadRequestException('Too many OTP requests. Please try again in 15 minutes.');
        }
      }

      // Create user if doesn't exist (new user flow)
      if (!user) {
        const userData: any = {
          platform: 'Mobile' as any,
          status: UserStatus.ACTIVE,
        };

        if (email) {
          userData.email = email;
        } else {
          userData.phoneNumber = phoneNumber;
          userData.countryCodeId = countryCodeId;
        }

        user = await userRepository.createUser(userData);

        // Create default wallet for new user (non-blocking)
        walletRepository.createWallet(user.id, config.DEFAULT_CURRENCY).catch(err =>
          logger.error('Failed to create wallet for new user:', err)
        );

        // Send welcome notification (non-blocking)
        if (email) {
          sendWelcomeEmail(email, 'User').catch(err =>
            logger.error('Failed to send welcome email:', err)
          );
        }
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
      logger.error("Login error:", error);
      throw new BadRequestException("Failed to process login request");
    }
  }

  /**
   * Verify OTP and issue tokens
   * @param verifyData Verification data
   * @returns User info and tokens
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

      // Auto-assign CUSTOMER role for mobile users if exactly one CUSTOMER role exists
      const customerRoles = await roleRepository.findByRoleType('CUSTOMER');
      if (customerRoles.length === 1) {
        // Check if user already has any roles
        const existingRoles = await roleRepository.getUserRoles(user.id);
        if (existingRoles.length === 0) {
          // Assign the single CUSTOMER role
          await roleRepository.assignRoleToUser(user.id, customerRoles[0].id);
          logger.info(`Auto-assigned CUSTOMER role to user ${user.id}`);
        }
      }

      // Fetch user with roles and permissions
      const userWithRoles = await userRepository.findByIdWithRolesAndPermissions(user.id);

      // Format roles and permissions
      const roles = userWithRoles?.userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        roleType: ur.role.roleType,
        description: ur.role.description,
        permissions: ur.role.rolePermissions.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      })) || [];

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        platform: 'Mobile',
      });

      const refreshToken = generateSecureRefreshToken();
      const refreshExpiresAt = new Date(Date.now() + config.JWT_REFRESH_EXPIRATION * 1000);

      // Store refresh token
      await refreshTokenRepository.createRefreshToken(user.id, refreshToken, refreshExpiresAt);

      // Determine if new user (created recently)
      const isNewUser = (Date.now() - user.createdAt.getTime()) < 60000; // Created in last minute

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
            applicationData: userWithRoles?.userApplicationData || null,
            roles,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
          isNewUser,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      logger.error("Verification error:", error);
      throw new BadRequestException("Failed to verify code");
    }
  }

  /**
   * Google login
   * @param googleData Google OAuth data
   * @returns User info and tokens
   */
  async googleLogin(googleData: {
    googleId: string;
    email: string;
    name?: string;
    profilePictureUrl?: string;
    googleVerifiedEmail?: boolean;
  }) {
    try {
      const { googleId, email, name, profilePictureUrl, googleVerifiedEmail } = googleData;

      // Validate required fields
      if (!googleId || !email) {
        throw new BadRequestException('Google ID and email are required');
      }

      // Try to find user by Google ID first
      let user = await userRepository.findByGoogleId(googleId);

      // If not found by Google ID, try by email (link accounts)
      if (!user) {
        user = await userRepository.findByEmail(email);

        if (user) {
          // Link Google account to existing user
          await userRepository.updateUser(user.id, {
            googleId,
            googleVerifiedEmail,
            profilePictureUrl: profilePictureUrl || user.profilePictureUrl,
            isEmailVerified: true,
            isVerified: true,
          });
        }
      }

      // Create new user if still not found
      const isNewUser = !user;
      if (!user) {
        user = await userRepository.createUser({
          email,
          name,
          googleId,
          googleVerifiedEmail,
          profilePictureUrl,
          platform: 'Mobile' as any,
          isEmailVerified: true,
          isVerified: true,
        });

        // Create default wallet for new user (non-blocking)
        walletRepository.createWallet(user.id, config.DEFAULT_CURRENCY).catch(err =>
          logger.error('Failed to create wallet for new user:', err)
        );

        // Send welcome email (non-blocking)
        sendWelcomeEmail(email, name || 'User').catch(err =>
          logger.error('Failed to send welcome email:', err)
        );
      }

      // Check user status
      if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
        throw new UnauthorizedException(
          user.status === UserStatus.SUSPENDED
            ? 'Your account has been suspended. Please contact support.'
            : 'Your account has been deleted. Please contact support to recover it.'
        );
      }

      // Update last login
      await userRepository.updateUser(user.id, {
        lastLogin: new Date(),
      });

      // Auto-assign CUSTOMER role for mobile users if exactly one CUSTOMER role exists
      const customerRoles = await roleRepository.findByRoleType('CUSTOMER');
      if (customerRoles.length === 1) {
        // Check if user already has any roles
        const existingRoles = await roleRepository.getUserRoles(user.id);
        if (existingRoles.length === 0) {
          // Assign the single CUSTOMER role
          await roleRepository.assignRoleToUser(user.id, customerRoles[0].id);
          logger.info(`Auto-assigned CUSTOMER role to user ${user.id}`);
        }
      }

      // Fetch user with roles and permissions
      const userWithRoles = await userRepository.findByIdWithRolesAndPermissions(user.id);

      // Format roles and permissions
      const roles = userWithRoles?.userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        roleType: ur.role.roleType,
        description: ur.role.description,
        permissions: ur.role.rolePermissions.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      })) || [];

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        platform: 'Mobile',
      });

      const refreshToken = generateSecureRefreshToken();
      const refreshExpiresAt = new Date(Date.now() + config.JWT_REFRESH_EXPIRATION * 1000);

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
          isNewUser,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      logger.error("Google login error:", error);
      throw new BadRequestException("Failed to process Google login");
    }
  }

  /**
   * Apple login
   * @param appleData Apple OAuth data
   * @returns User info and tokens
   */
  async appleLogin(appleData: {
    appleId: string;
    email?: string;
    name?: string;
  }) {
    try {
      const { appleId, email, name } = appleData;

      // Validate required fields
      if (!appleId) {
        throw new BadRequestException('Apple ID is required');
      }

      // Try to find user by Apple ID first
      let user = await userRepository.findByAppleId(appleId);

      // If not found by Apple ID and email provided, try by email (link accounts)
      if (!user && email) {
        user = await userRepository.findByEmail(email);

        if (user) {
          // Link Apple account to existing user
          await userRepository.updateUser(user.id, {
            appleId,
            isEmailVerified: email ? true : user.isEmailVerified,
            isVerified: true,
          });
        }
      }

      // Create new user if still not found
      const isNewUser = !user;
      if (!user) {
        user = await userRepository.createUser({
          ...(email && { email }),
          name,
          appleId,
          platform: 'Mobile' as any,
          isEmailVerified: email ? true : false,
          isVerified: true,
        });

        // Create default wallet for new user (non-blocking)
        walletRepository.createWallet(user.id, config.DEFAULT_CURRENCY).catch(err =>
          logger.error('Failed to create wallet for new user:', err)
        );

        // Send welcome email if email provided (non-blocking)
        if (email) {
          sendWelcomeEmail(email, name || 'User').catch(err =>
            logger.error('Failed to send welcome email:', err)
          );
        }
      }

      // Check user status
      if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
        throw new UnauthorizedException(
          user.status === UserStatus.SUSPENDED
            ? 'Your account has been suspended. Please contact support.'
            : 'Your account has been deleted. Please contact support to recover it.'
        );
      }

      // Update last login
      await userRepository.updateUser(user.id, {
        lastLogin: new Date(),
      });

      // Auto-assign CUSTOMER role for mobile users if exactly one CUSTOMER role exists
      const customerRoles = await roleRepository.findByRoleType('CUSTOMER');
      if (customerRoles.length === 1) {
        // Check if user already has any roles
        const existingRoles = await roleRepository.getUserRoles(user.id);
        if (existingRoles.length === 0) {
          // Assign the single CUSTOMER role
          await roleRepository.assignRoleToUser(user.id, customerRoles[0].id);
          logger.info(`Auto-assigned CUSTOMER role to user ${user.id}`);
        }
      }

      // Fetch user with roles and permissions
      const userWithRoles = await userRepository.findByIdWithRolesAndPermissions(user.id);

      // Format roles and permissions
      const roles = userWithRoles?.userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        roleType: ur.role.roleType,
        description: ur.role.description,
        permissions: ur.role.rolePermissions.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      })) || [];

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        platform: 'Mobile',
      });

      const refreshToken = generateSecureRefreshToken();
      const refreshExpiresAt = new Date(Date.now() + config.JWT_REFRESH_EXPIRATION * 1000);

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
          isNewUser,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      logger.error("Apple login error:", error);
      throw new BadRequestException("Failed to process Apple login");
    }
  }

  /**
   * Refresh access token
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

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        platform: 'Mobile',
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
      logger.error("Token refresh error:", error);
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
      logger.error("Logout error:", error);
      throw new BadRequestException("Failed to logout");
    }
  }

  /**
   * Resend OTP
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
        throw new BadRequestException('User not found. Please login first.');
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

      // Generate new OTP
      const otp = generateOTP(4);
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

      // Send OTP
      let otpSent = false;
      if (verificationType === VerificationType.EMAIL) {
        otpSent = await sendOTPEmail(channel, otp, user.name || undefined);
      } else {
        otpSent = await sendOTPSMS(channel, otp);
      }

      if (!otpSent) {
        throw new BadRequestException('Failed to send verification code. Please try again.');
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
      logger.error("Resend OTP error:", error);
      throw new BadRequestException("Failed to resend verification code");
    }
  }

  /**
   * Guest login
   * @param guestData Guest login data with deviceId
   * @returns User info and tokens
   */
  async guestLogin(guestData: { deviceId: string }) {
    try {
      const { deviceId } = guestData;

      // Validate required fields
      if (!deviceId) {
        throw new BadRequestException('Device ID is required');
      }

      // Try to find user by device ID
      let user = await userRepository.findByDeviceId(deviceId);
      let isNewUser = false;

      // If user exists but is not a guest user, treat as new guest login
      if (user && !user.userApplicationData?.isGuestUser) {
        user = null;
      }

      // Create new guest user if not found
      if (!user) {
        isNewUser = true;

        user = await userRepository.createUser({
          name: 'Guest User',
          platform: 'Mobile' as any,
          isVerified: false,
          isEmailVerified: false,
          isPhoneVerified: false,
        });

        // Create user application data with deviceId and isGuestUser flag
        await prisma.userApplicationData.create({
          data: {
            userId: user.id,
            deviceId,
            isGuestUser: true,
          },
        });

        // Create default wallet for new guest user (non-blocking)
        walletRepository.createWallet(user.id, config.DEFAULT_CURRENCY).catch(err =>
          logger.error('Failed to create wallet for new guest user:', err)
        );
      }

      // Check user status
      if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
        throw new UnauthorizedException(
          user.status === UserStatus.SUSPENDED
            ? 'Your account has been suspended. Please contact support.'
            : 'Your account has been deleted. Please contact support to recover it.'
        );
      }

      // Update last login
      await userRepository.updateUser(user.id, {
        lastLogin: new Date(),
      });

      // Auto-assign CUSTOMER role for mobile users if exactly one CUSTOMER role exists
      const customerRoles = await roleRepository.findByRoleType('CUSTOMER');
      if (customerRoles.length === 1) {
        // Check if user already has any roles
        const existingRoles = await roleRepository.getUserRoles(user.id);
        if (existingRoles.length === 0) {
          // Assign the single CUSTOMER role
          await roleRepository.assignRoleToUser(user.id, customerRoles[0].id);
          logger.info(`Auto-assigned CUSTOMER role to guest user ${user.id}`);
        }
      }

      // Fetch user with roles and permissions
      const userWithRoles = await userRepository.findByIdWithRolesAndPermissions(user.id);

      // Format roles and permissions
      const roles = userWithRoles?.userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        roleType: ur.role.roleType,
        description: ur.role.description,
        permissions: ur.role.rolePermissions.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      })) || [];

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        platform: 'Mobile',
      });

      const refreshToken = generateSecureRefreshToken();
      const refreshExpiresAt = new Date(Date.now() + config.JWT_REFRESH_EXPIRATION * 1000);

      await refreshTokenRepository.createRefreshToken(user.id, refreshToken, refreshExpiresAt);

      return {
        success: true,
        message: 'Guest login successful',
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
            applicationData: userWithRoles?.userApplicationData ? {
              deviceId: userWithRoles.userApplicationData.deviceId,
              deviceModel: userWithRoles.userApplicationData.deviceModel,
              osName: userWithRoles.userApplicationData.osName,
              osVersion: userWithRoles.userApplicationData.osVersion,
              appPlatform: userWithRoles.userApplicationData.appPlatform,
              fcmToken: userWithRoles.userApplicationData.fcmToken,
              timezoneName: userWithRoles.userApplicationData.timezoneName,
              timezoneOffset: userWithRoles.userApplicationData.timezoneOffset,
              appVersion: userWithRoles.userApplicationData.appVersion,
              buildNumber: userWithRoles.userApplicationData.buildNumber,
              lastKnownIpAddress: userWithRoles.userApplicationData.lastKnownIpAddress,
              currentIpAddress: userWithRoles.userApplicationData.currentIpAddress,
              createdAt: userWithRoles.userApplicationData.createdAt?.toISOString(),
              updatedAt: userWithRoles.userApplicationData.updatedAt?.toISOString(),
            } : null,
            roles,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
          isNewUser,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      logger.error("Guest login error:", error);
      throw new BadRequestException("Failed to process guest login");
    }
  }
}
