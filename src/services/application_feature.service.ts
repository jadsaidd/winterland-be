import { ApplicationFeature } from '@prisma/client';

import { ConflictException, NotFoundException } from '../exceptions/http.exception';
import { ApplicationFeatureRepository } from '../repositories/application_feature.repository';
import { PaginatedResponse } from '../utils/pagination.util';

const applicationFeatureRepository = new ApplicationFeatureRepository();

export class ApplicationFeatureService {
    /**
     * Get all application features with pagination and optional status filter
     */
    async getAll(
        page: number,
        limit: number,
        status?: boolean
    ): Promise<PaginatedResponse<ApplicationFeature>> {
        return applicationFeatureRepository.getAll(page, limit, status);
    }

    /**
     * Get application feature by ID
     */
    async getById(id: string): Promise<ApplicationFeature> {
        const feature = await applicationFeatureRepository.getById(id);

        if (!feature) {
            throw new NotFoundException('Application feature not found');
        }

        return feature;
    }

    /**
     * Get all active application features (for mobile)
     */
    async getActiveFeatures(): Promise<ApplicationFeature[]> {
        return applicationFeatureRepository.getActiveFeatures();
    }

    /**
     * Create a new application feature
     */
    async create(data: {
        name: string;
        status: boolean;
        config?: Record<string, any> | null;
    }): Promise<ApplicationFeature> {
        // Check if name already exists
        const nameExists = await applicationFeatureRepository.checkNameExists(data.name);

        if (nameExists) {
            throw new ConflictException(
                `Application feature with name "${data.name}" already exists`
            );
        }

        return applicationFeatureRepository.create(data);
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
        // Check if feature exists
        const existingFeature = await applicationFeatureRepository.getById(id);

        if (!existingFeature) {
            throw new NotFoundException('Application feature not found');
        }

        return applicationFeatureRepository.update(id, data);
    }

    /**
     * Delete an application feature (hard delete)
     */
    async delete(id: string): Promise<ApplicationFeature> {
        // Check if feature exists
        const existingFeature = await applicationFeatureRepository.getById(id);

        if (!existingFeature) {
            throw new NotFoundException('Application feature not found');
        }

        return applicationFeatureRepository.delete(id);
    }
}
