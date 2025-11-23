import { logger } from '../config';
import { CreateCountryCodeDto, UpdateCountryCodeDto } from '../dtos/request/country-code.request.dto';
import { BadRequestException, ConflictException, NotFoundException } from '../exceptions/http.exception';
import { CountryCodeRepository } from '../repositories/country-code.repository';
import { formatCountryCodeResponse, formatCountryCodesResponse } from '../utils/country-code.util';

const countryCodeRepository = new CountryCodeRepository();

export class CountryCodeService {
    /**
     * Create a new country code
     * @param countryCodeData Country code data
     * @returns Created country code
     */
    async createCountryCode(countryCodeData: CreateCountryCodeDto) {
        try {
            // Check if country code with the same code already exists
            const existingCountryCode = await countryCodeRepository.findByCode(countryCodeData.code);
            if (existingCountryCode) {
                throw new ConflictException(`Country code with code ${countryCodeData.code} already exists`);
            }

            // Create country code
            const result = await countryCodeRepository.createCountryCode(countryCodeData);
            return formatCountryCodeResponse(result);
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            logger.error('Error creating country code:', error);
            throw new BadRequestException('Failed to create country code');
        }
    }

    /**
     * Get country code by ID
     * @param id Country code ID
     * @returns Country code
     */
    async getCountryCodeById(id: string) {
        try {
            const countryCode = await countryCodeRepository.findById(id);
            if (!countryCode) {
                throw new NotFoundException(`Country code with ID ${id} not found`);
            }

            return formatCountryCodeResponse(countryCode);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            logger.error('Error getting country code by ID:', error);
            throw new BadRequestException('Failed to get country code');
        }
    }

    /**
     * Update a country code
     * @param id Country code ID
     * @param countryCodeData Country code data
     * @returns Updated country code
     */
    async updateCountryCode(id: string, countryCodeData: UpdateCountryCodeDto) {
        try {
            // Check if country code exists
            const existingCountryCode = await countryCodeRepository.findById(id);
            if (!existingCountryCode) {
                throw new NotFoundException(`Country code with ID ${id} not found`);
            }

            // Check if code is being updated and if it conflicts
            if (countryCodeData.code && countryCodeData.code !== existingCountryCode.code) {
                const countryCodeWithSameCode = await countryCodeRepository.findByCode(countryCodeData.code);
                if (countryCodeWithSameCode) {
                    throw new ConflictException(`Country code with code ${countryCodeData.code} already exists`);
                }
            }

            // Update country code
            const result = await countryCodeRepository.updateCountryCode(id, countryCodeData);
            return formatCountryCodeResponse(result);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }
            logger.error('Error updating country code:', error);
            throw new BadRequestException('Failed to update country code');
        }
    }

    /**
     * Toggle active status of a country code
     * @param id Country code ID
     * @param active Active status
     * @returns Updated country code
     */
    async toggleActive(id: string, active: boolean) {
        try {
            // Check if country code exists
            const existingCountryCode = await countryCodeRepository.findById(id);
            if (!existingCountryCode) {
                throw new NotFoundException(`Country code with ID ${id} not found`);
            }

            // Toggle active status
            const result = await countryCodeRepository.toggleActive(id, active);
            return formatCountryCodeResponse(result);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            logger.error('Error toggling country code active status:', error);
            throw new BadRequestException('Failed to toggle country code active status');
        }
    }

    /**
     * Get all country codes
     * @param page Page number
     * @param limit Items per page
     * @param active Filter by active status (optional)
     * @returns Paginated list of country codes
     */
    async getAllCountryCodes(page: number = 1, limit: number = 10, active?: boolean) {
        try {
            const result = await countryCodeRepository.getAllCountryCodes(page, limit, active);
            return {
                ...result,
                data: formatCountryCodesResponse(result.data),
            };
        } catch (error) {
            logger.error('Error getting all country codes:', error);
            throw new BadRequestException('Failed to get country codes');
        }
    }

    /**
     * Get all active country codes (non-paginated, for mobile)
     * @returns List of active country codes
     */
    async getAllActiveCountryCodes() {
        try {
            const result = await countryCodeRepository.getAllActiveCountryCodes();
            return formatCountryCodesResponse(result);
        } catch (error) {
            logger.error('Error getting all active country codes:', error);
            throw new BadRequestException('Failed to get active country codes');
        }
    }

    /**
     * Delete a country code
     * @param id Country code ID
     * @returns Deleted country code
     */
    async deleteCountryCode(id: string) {
        try {
            // Check if country code exists
            const existingCountryCode = await countryCodeRepository.findById(id);
            if (!existingCountryCode) {
                throw new NotFoundException(`Country code with ID ${id} not found`);
            }

            // Delete country code
            return await countryCodeRepository.deleteCountryCode(id);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            logger.error('Error deleting country code:', error);
            throw new BadRequestException('Failed to delete country code');
        }
    }
}
