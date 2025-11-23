import { ApplicationFeature } from '@prisma/client';

import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import prisma from '../utils/prisma.client';

export class ApplicationFeatureRepository {
    /**
     * Get all application features with pagination and optional status filter
     */
    async getAll(
        page: number,
        limit: number,
        status?: boolean
    ): Promise<PaginatedResponse<ApplicationFeature>> {
        const skip = (page - 1) * limit;

        const where = status !== undefined ? { status } : {};

        const [features, total] = await Promise.all([
            prisma.applicationFeature.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.applicationFeature.count({ where }),
        ]);

        return createPaginatedResponse(features, total, page, limit);
    }

    /**
     * Get application feature by ID
     */
    async getById(id: string): Promise<ApplicationFeature | null> {
        return prisma.applicationFeature.findUnique({
            where: { id },
        });
    }

    /**
     * Get all active application features (for mobile)
     */
    async getActiveFeatures(): Promise<ApplicationFeature[]> {
        return prisma.applicationFeature.findMany({
            where: { status: true },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                config: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    /**
     * Check if application feature name exists
     */
    async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
        const where: { name: string; id?: { not: string } } = { name };

        if (excludeId) {
            where.id = { not: excludeId };
        }

        const count = await prisma.applicationFeature.count({ where });
        return count > 0;
    }

    /**
     * Create a new application feature
     */
    async create(data: {
        name: string;
        status: boolean;
        config?: Record<string, any> | null;
    }): Promise<ApplicationFeature> {
        return prisma.applicationFeature.create({
            data: {
                name: data.name,
                status: data.status,
                config: data.config || null,
            },
        });
    }

    /**
     * Update an application feature
     * Note: name cannot be updated
     */
    async update(
        id: string,
        data: {
            status: boolean;
            config?: Record<string, any> | null;
        }
    ): Promise<ApplicationFeature> {
        return prisma.applicationFeature.update({
            where: { id },
            data: {
                status: data.status,
                config: data.config !== undefined ? data.config : undefined,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Delete an application feature (hard delete)
     */
    async delete(id: string): Promise<ApplicationFeature> {
        return prisma.applicationFeature.delete({
            where: { id },
        });
    }
}
