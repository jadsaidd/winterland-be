import { NotFoundException } from '../exceptions/http.exception';
import paymentMethodRepository, {
    PaymentMethodWithRelations,
} from '../repositories/payment-method.repository';
import { PaginatedResponse } from '../utils/pagination.util';

/**
 * PaymentMethod Service
 * Handles business logic for payment method operations
 */
export class PaymentMethodService {
    /**
     * Create a new payment method
     */
    async createPaymentMethod(
        data: {
            name: { en: string; ar?: string };
            description?: { en: string; ar?: string };
            mediaUrls?: string[];
        },
        uploadedBy?: string
    ): Promise<PaymentMethodWithRelations> {
        // Create payment method
        const paymentMethod = await paymentMethodRepository.create({
            name: data.name,
            description: data.description,
            isActive: true, // Default to active
        });

        // Link media if provided
        if (data.mediaUrls && data.mediaUrls.length > 0) {
            await Promise.all(
                data.mediaUrls.map((url, index) =>
                    paymentMethodRepository.createAndLinkMedia(
                        paymentMethod.id,
                        url,
                        index + 1, // sortOrder starts from 1
                        uploadedBy
                    )
                )
            );

            // Fetch updated payment method with media
            return await paymentMethodRepository.findById(paymentMethod.id) as PaymentMethodWithRelations;
        }

        return paymentMethod;
    }

    /**
     * Get payment method by ID
     */
    async getPaymentMethodById(id: string): Promise<PaymentMethodWithRelations> {
        const paymentMethod = await paymentMethodRepository.findById(id);

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        return paymentMethod;
    }

    /**
     * Get all payment methods with pagination and filters
     */
    async getAllPaymentMethods(
        page: number,
        limit: number,
        filters?: {
            isActive?: string;
            search?: string;
        }
    ): Promise<PaginatedResponse<PaymentMethodWithRelations>> {
        // Parse isActive filter
        const parsedFilters: { isActive?: boolean; search?: string } = {};

        if (filters?.isActive) {
            parsedFilters.isActive = filters.isActive === 'true';
        }

        if (filters?.search) {
            parsedFilters.search = filters.search;
        }

        return await paymentMethodRepository.findAll(page, limit, parsedFilters);
    }

    /**
     * Get all active payment methods (no pagination, for mobile)
     */
    async getAllActivePaymentMethods(includeWallet: boolean = true): Promise<PaymentMethodWithRelations[]> {
        const paymentMethods = await paymentMethodRepository.findAllActive();

        // Filter out wallet payment method if includeWallet is false
        if (!includeWallet) {
            return paymentMethods.filter(
                (method) => {
                    const nameEn = typeof method.name === 'object' && method.name !== null && 'en' in method.name
                        ? (method.name as any).en
                        : '';
                    return nameEn.toLowerCase() !== 'wallet';
                }
            );
        }

        return paymentMethods;
    }

    /**
     * Update payment method
     */
    async updatePaymentMethod(
        id: string,
        data: {
            name?: { en: string; ar?: string };
            description?: { en: string; ar?: string };
            mediaUrls?: string[];
            isActive?: boolean;
        },
        uploadedBy?: string
    ): Promise<PaymentMethodWithRelations> {
        // Check if payment method exists
        await this.getPaymentMethodById(id);

        // Prepare update data
        const updateData: any = {};

        if (data.name) {
            updateData.name = data.name;
        }

        if (data.description !== undefined) {
            updateData.description = data.description;
        }

        if (data.isActive !== undefined) {
            updateData.isActive = data.isActive;
        }

        // Update payment method
        await paymentMethodRepository.update(id, updateData);

        // Handle media replacement if provided
        if (data.mediaUrls !== undefined) {
            // Remove all existing media links
            await paymentMethodRepository.removeAllMedia(id);

            // Add new media
            if (data.mediaUrls.length > 0) {
                await Promise.all(
                    data.mediaUrls.map((url, index) =>
                        paymentMethodRepository.createAndLinkMedia(
                            id,
                            url,
                            index + 1,
                            uploadedBy
                        )
                    )
                );
            }
        }

        // Fetch and return updated payment method with all relations
        return await paymentMethodRepository.findById(id) as PaymentMethodWithRelations;
    }

    /**
     * Toggle payment method active status
     */
    async togglePaymentMethodActive(
        id: string,
        isActive: boolean
    ): Promise<PaymentMethodWithRelations> {
        // Check if payment method exists
        await this.getPaymentMethodById(id);

        // Update active status
        return await paymentMethodRepository.update(id, { isActive });
    }

    /**
     * Delete payment method
     */
    async deletePaymentMethod(id: string): Promise<void> {
        // Check if payment method exists
        await this.getPaymentMethodById(id);

        // Delete payment method (cascade will handle media links)
        await paymentMethodRepository.delete(id);
    }
}

export default new PaymentMethodService();
