import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { config } from '../config';
import { ITokenPayload } from '../interfaces/user.interface';

/**
 * Generate a JWT access token
 * @param payload Data to include in the token
 * @returns JWT token
 */
export const generateAccessToken = (payload: Omit<ITokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRATION,
  });
};

/**
 * Generate a JWT refresh token (DEPRECATED - Use generateSecureRefreshToken instead)
 * This function exists for backward compatibility but is not recommended.
 * Refresh tokens should be opaque random strings stored in the database for better security.
 * @param payload Data to include in the token
 * @returns JWT token
 */
export const generateRefreshToken = (payload: Omit<ITokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: `${config.JWT_REFRESH_EXPIRATION}s`, // Explicitly specify seconds
  });
};

/**
 * Generate a secure random refresh token (RECOMMENDED)
 * This generates an opaque token that must be stored in the database.
 * This approach is more secure as tokens can be individually revoked.
 * @returns Random token string (80 character hex string)
 */
export const generateSecureRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Verify a JWT access token
 * @param token JWT token to verify
 * @returns Decoded token payload if valid, null if invalid
 */
export const verifyAccessToken = (token: string): ITokenPayload | null => {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as ITokenPayload;
  } catch (_error) {
    return null;
  }
};

/**
 * Verify a JWT refresh token
 * @param token JWT token to verify
 * @returns Decoded token payload if valid, null if invalid
 */
export const verifyRefreshToken = (token: string): ITokenPayload | null => {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as ITokenPayload;
  } catch (_error) {
    return null;
  }
};
