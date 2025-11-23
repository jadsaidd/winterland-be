import { prisma } from '../utils/prisma.client';

export class RefreshTokenRepository {
    /**
     * Create a new refresh token
     * @param userId User ID
     * @param token Token string
     * @param expiresAt Expiration time
     * @returns Created refresh token
     */
    async createRefreshToken(userId: string, token: string, expiresAt: Date) {
        return prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }

    /**
     * Find refresh token by token string
     * @param token Token string
     * @returns Refresh token if found and valid, null otherwise
     */
    async findValidToken(token: string) {
        return prisma.refreshToken.findFirst({
            where: {
                token,
                isRevoked: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
            cacheStrategy: { swr: 0, ttl: 0 },
        });
    }

    /**
     * Revoke a refresh token
     * @param token Token string
     * @returns Updated refresh token
     */
    async revokeToken(token: string) {
        return prisma.refreshToken.updateMany({
            where: {
                token,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
            },
        });
    }

    /**
     * Revoke all refresh tokens for a user
     * @param userId User ID
     * @returns Number of revoked tokens
     */
    async revokeAllUserTokens(userId: string) {
        const result = await prisma.refreshToken.updateMany({
            where: {
                userId,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
            },
        });
        return result.count;
    }

    /**
     * Delete expired refresh tokens (cleanup job)
     * @returns Number of deleted tokens
     */
    async deleteExpiredTokens() {
        const result = await prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    {
                        expiresAt: {
                            lt: new Date(),
                        },
                    },
                    {
                        isRevoked: true,
                        updatedAt: {
                            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                ],
            },
        });
        return result.count;
    }

    /**
     * Get count of active refresh tokens for a user
     * @param userId User ID
     * @returns Count of active tokens
     */
    async getActiveTokenCount(userId: string): Promise<number> {
        return prisma.refreshToken.count({
            where: {
                userId,
                isRevoked: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            cacheStrategy: { swr: 0, ttl: 0 },
        });
    }

    /**
     * Find token by ID
     * @param id Token ID
     * @returns Refresh token if found, null otherwise
     */
    async findById(id: string) {
        return prisma.refreshToken.findUnique({
            where: { id },
        });
    }
}
