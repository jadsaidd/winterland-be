import { CountryCode } from '@prisma/client';

import { logger } from '../config';
import { CreateCountryCodeDto, UpdateCountryCodeDto } from '../dtos/request/country-code.request.dto';
import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import prisma from '../utils/prisma.client';
import { MediaRepository } from './media.repository';

const mediaRepository = new MediaRepository();

export class CountryCodeRepository {
    /**
     * Create a new country code
     * @param countryCodeData Country code data
     * @returns Created country code
     */
    async createCountryCode(countryCodeData: CreateCountryCodeDto): Promise<CountryCode> {
        try {
            // Create media if flagUrl is provided
            let flagMediaId: string | undefined;
            if (countryCodeData.flagUrl) {
                const media = await mediaRepository.createMedia({
                    url: countryCodeData.flagUrl,
                    type: 'IMAGE',
                    context: 'country_code_flag',
                });
                flagMediaId = media.id;
            }

            return await prisma.countryCode.create({
                data: {
                    country: countryCodeData.country,
                    isoCode: countryCodeData.isoCode,
                    code: countryCodeData.code,
                    digits: countryCodeData.digits,
                    active: countryCodeData.active ?? true,
                    flagMediaId,
                },
                include: {
                    flagMedia: true,
                },
            });
        } catch (error) {
            logger.error('Error creating country code:', error);
            throw error;
        }
    }

    /**
     * Find country code by ID
     * @param id Country code ID
     * @returns Country code if found, null otherwise
     */
    async findById(id: string): Promise<CountryCode | null> {
        try {
            return await prisma.countryCode.findUnique({
                where: { id },
                include: {
                    flagMedia: true,
                },
            });
        } catch (error) {
            logger.error('Error finding country code by id:', error);
            throw error;
        }
    }

    /**
     * Find country code by code
     * @param code Country code
     * @returns Country code if found, null otherwise
     */
    async findByCode(code: string): Promise<CountryCode | null> {
        try {
            return await prisma.countryCode.findUnique({
                where: { code },
            });
        } catch (error) {
            logger.error('Error finding country code by code:', error);
            throw error;
        }
    }

    /**
     * Update a country code
     * @param id Country code ID
     * @param countryCodeData Country code data
     * @returns Updated country code
     */
    async updateCountryCode(id: string, countryCodeData: UpdateCountryCodeDto): Promise<CountryCode> {
        try {
            const existingCountryCode = await this.findById(id);

            // Handle flagUrl update
            let flagMediaId: string | undefined = existingCountryCode?.flagMediaId || undefined;

            if (countryCodeData.flagUrl) {
                if (existingCountryCode?.flagMediaId) {
                    // Update existing media
                    await mediaRepository.updateMedia(existingCountryCode.flagMediaId, {
                        url: countryCodeData.flagUrl,
                    });
                } else {
                    // Create new media
                    const media = await mediaRepository.createMedia({
                        url: countryCodeData.flagUrl,
                        type: 'IMAGE',
                        context: 'country_code_flag',
                    });
                    flagMediaId = media.id;
                }
            }

            return await prisma.countryCode.update({
                where: { id },
                data: {
                    country: countryCodeData.country,
                    isoCode: countryCodeData.isoCode,
                    code: countryCodeData.code,
                    digits: countryCodeData.digits,
                    active: countryCodeData.active,
                    flagMediaId,
                },
                include: {
                    flagMedia: true,
                },
            });
        } catch (error) {
            logger.error('Error updating country code:', error);
            throw error;
        }
    }

    /**
     * Toggle active status of a country code
     * @param id Country code ID
     * @param active Active status
     * @returns Updated country code
     */
    async toggleActive(id: string, active: boolean): Promise<CountryCode> {
        try {
            return await prisma.countryCode.update({
                where: { id },
                data: { active },
                include: {
                    flagMedia: true,
                },
            });
        } catch (error) {
            logger.error('Error toggling country code active status:', error);
            throw error;
        }
    }

    /**
     * Get all country codes with pagination and filtering
     * @param page Page number
     * @param limit Items per page
     * @param active Filter by active status (optional)
     * @returns Paginated list of country codes
     */
    async getAllCountryCodes(
        page: number = 1,
        limit: number = 10,
        active?: boolean
    ): Promise<PaginatedResponse<CountryCode>> {
        try {
            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = {};
            if (active !== undefined) {
                where.active = active;
            }

            const [countryCodes, total] = await Promise.all([
                prisma.countryCode.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { country: 'asc' },
                    include: {
                        flagMedia: true,
                    },
                }),
                prisma.countryCode.count({ where }),
            ]);

            return createPaginatedResponse(countryCodes, total, page, limit);
        } catch (error) {
            logger.error('Error getting all country codes:', error);
            throw error;
        }
    }

    /**
     * Get all active country codes (non-paginated, for mobile)
     * @returns List of active country codes with selected fields
     */
    async getAllActiveCountryCodes(): Promise<Partial<CountryCode>[]> {
        try {
            return await prisma.countryCode.findMany({
                where: { active: true },
                select: {
                    id: true,
                    country: true,
                    flagUrl: true,
                    isoCode: true,
                    code: true,
                    digits: true,
                    flagMedia: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                        },
                    },
                },
                orderBy: { country: 'asc' },
            });
        } catch (error) {
            logger.error('Error getting all active country codes:', error);
            throw error;
        }
    }

    /**
     * Delete a country code
     * @param id Country code ID
     * @returns Deleted country code
     */
    async deleteCountryCode(id: string): Promise<CountryCode> {
        try {
            const existingCountryCode = await this.findById(id);

            // Delete associated media if exists
            if (existingCountryCode?.flagMediaId) {
                await mediaRepository.deleteMedia(existingCountryCode.flagMediaId);
            }

            return await prisma.countryCode.delete({
                where: { id },
            });
        } catch (error) {
            logger.error('Error deleting country code:', error);
            throw error;
        }
    }
}
