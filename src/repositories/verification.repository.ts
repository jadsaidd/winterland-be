import { VerificationType } from '@prisma/client';

import { prisma } from '../utils/prisma.client';

export class VerificationRepository {
    /**
     * Create a new verification code
     * @param userId User ID
     * @param type Verification type (EMAIL or PHONE)
     * @param code OTP code
     * @param expiresAt Expiration time
     * @param channel Channel (email address or phone number)
     * @returns Created verification record
     */
    async createVerification(
        userId: string,
        type: VerificationType,
        code: string,
        expiresAt: Date,
        channel?: string
    ) {
        return prisma.verification.create({
            data: {
                userId,
                type,
                code,
                expiresAt,
                channel,
                active: true,
            },
        });
    }

    /**
     * Find active verification by user ID and type
     * @param userId User ID
     * @param type Verification type
     * @returns Active verification if found, null otherwise
     */
    async findActiveVerification(userId: string, type: VerificationType) {
        return prisma.verification.findFirst({
            where: {
                userId,
                type,
                active: true,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /**
     * Find verification by code
     * @param code Verification code
     * @param type Verification type
     * @returns Verification if found, null otherwise
     */
    async findByCode(code: string, type: VerificationType) {
        return prisma.verification.findFirst({
            where: {
                code,
                type,
                active: true,
                expiresAt: {
                    gt: new Date(),
                },
                usedAt: null,
            },
            include: {
                user: true,
            },
        });
    }

    /**
     * Mark verification as used
     * @param id Verification ID
     * @returns Updated verification
     */
    async markAsUsed(id: string) {
        return prisma.verification.update({
            where: { id },
            data: {
                active: false,
                usedAt: new Date(),
            },
        });
    }

    /**
     * Deactivate all verifications for a user
     * @param userId User ID
     * @param type Optional verification type to filter
     * @returns Number of updated records
     */
    async deactivateUserVerifications(userId: string, type?: VerificationType) {
        const result = await prisma.verification.updateMany({
            where: {
                userId,
                ...(type && { type }),
                active: true,
            },
            data: {
                active: false,
            },
        });
        return result.count;
    }

    /**
     * Delete expired verifications (cleanup job)
     * @returns Number of deleted records
     */
    async deleteExpiredVerifications() {
        const result = await prisma.verification.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        return result.count;
    }

    /**
     * Count active verifications for user in time window
     * @param userId User ID
     * @param type Verification type
     * @param timeWindowMinutes Time window in minutes
     * @returns Count of verifications
     */
    async countRecentVerifications(
        userId: string,
        type: VerificationType,
        timeWindowMinutes: number = 15
    ): Promise<number> {
        const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

        return prisma.verification.count({
            where: {
                userId,
                type,
                createdAt: {
                    gte: timeWindow,
                },
            },
        });
    }

    /**
     * Get failed verification attempts count
     * @param userId User ID
     * @param type Verification type
     * @param timeWindowMinutes Time window in minutes
     * @returns Count of failed attempts
     */
    async getFailedAttemptsCount(
        userId: string,
        type: VerificationType,
        timeWindowMinutes: number = 15
    ): Promise<number> {
        const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

        // Count verifications that were created but never marked as used
        return prisma.verification.count({
            where: {
                userId,
                type,
                active: false,
                usedAt: null,
                createdAt: {
                    gte: timeWindow,
                },
            },
        });
    }
}
