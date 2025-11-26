import { BookingStatus } from '@prisma/client';

import { logger } from '../config';
import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    NotFoundException,
} from '../exceptions/http.exception';
import bookingRepository from '../repositories/booking.repository';
import eventRepository from '../repositories/event.repository';
import { PaymentMethodRepository } from '../repositories/payment-method.repository';
import { MAX_PENDING_TRANSACTIONS, TransactionRepository } from '../repositories/transaction.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { CheckoutInput } from '../schemas/booking.schema';
import { prisma } from '../utils/prisma.client';

const paymentMethodRepository = new PaymentMethodRepository();
const walletRepository = new WalletRepository();
const transactionRepository = new TransactionRepository();

export class BookingService {
    /**
     * Validate that user can create a pending transaction
     * @throws BadRequestException if user has reached the limit
     */
    private async validatePendingTransactionLimit(userId: string) {
        const canCreate = await transactionRepository.canCreatePendingTransaction(userId);
        if (!canCreate) {
            throw new BadRequestException(
                `You have reached the maximum limit of ${MAX_PENDING_TRANSACTIONS} pending transactions. Please complete or cancel existing pending transactions before creating new ones.`
            );
        }
    }

    /**
     * Validate payment method exists and is active
     */
    private async validatePaymentMethod(paymentMethodId: string) {
        const paymentMethod = await paymentMethodRepository.findById(paymentMethodId);

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        if (!paymentMethod.isActive) {
            throw new BadRequestException('Payment method is not active');
        }

        return paymentMethod;
    }

    /**
     * Validate event is active and available
     */
    private async validateEvent(eventId: string) {
        const event = await eventRepository.findById(eventId);

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if (!event.active) {
            throw new BadRequestException('Event is not active');
        }

        // Check if event has already ended
        const now = new Date();
        if (event.endAt < now) {
            throw new BadRequestException('Event has already ended');
        }

        return event;
    }

    /**
     * Extract payment channel from payment method name
     */
    private extractPaymentChannel(paymentMethod: any): string {
        return typeof paymentMethod.name === 'object'
            ? (paymentMethod.name as any).en || 'Unknown'
            : String(paymentMethod.name);
    }

    /**
     * Process wallet payment
     * Validates wallet balance, deducts amount, and creates transaction
     */
    private async processWalletPayment(
        userId: string,
        amount: number,
        currency: string,
        paymentChannel: string
    ) {
        // Get user's wallet
        const wallet = await walletRepository.getUserWallet(userId, currency);

        if (!wallet) {
            throw new NotFoundException(`Wallet not found for currency ${currency}`);
        }

        if (!wallet.active) {
            throw new BadRequestException('Wallet is not active');
        }

        // Validate sufficient balance
        if (wallet.amount < amount) {
            throw new BadRequestException(
                `Insufficient wallet balance. Required: ${amount} ${currency}, Available: ${wallet.amount} ${currency}`
            );
        }

        // Deduct amount from wallet
        const updatedWallet = await walletRepository.subtractAmount(wallet.id, amount);

        // Create completed transaction
        const transaction = await transactionRepository.createCheckoutTransaction({
            userId,
            amount,
            currency,
            platform: 'mobile',
            channel: paymentChannel,
            status: 'COMPLETED',
            walletId: wallet.id,
            completedBy: userId,
        });

        logger.info(
            `Wallet payment processed: User ${userId}, Amount ${amount} ${currency}, Transaction ${transaction.id}`
        );

        return { transaction, wallet: updatedWallet };
    }

    /**
     * Process cash payment
     * Creates a pending transaction (to be completed later)
     */
    private async processCashPayment(
        userId: string,
        amount: number,
        currency: string,
        paymentChannel: string
    ) {
        // Create pending transaction for cash payment
        const transaction = await transactionRepository.createCheckoutTransaction({
            userId,
            amount,
            currency,
            platform: 'mobile',
            channel: paymentChannel,
            status: 'PENDING',
        });

        logger.info(
            `Cash payment initiated: User ${userId}, Amount ${amount} ${currency}, Transaction ${transaction.id} (PENDING)`
        );

        return { transaction };
    }

    /**
     * Process other payment methods (placeholder for future integration)
     */
    private async processOtherPayment(
        userId: string,
        amount: number,
        currency: string,
        paymentChannel: string
    ) {
        // TODO: Implement payment gateway integration for:
        // - Apple Pay
        // - Google Pay
        // - Ziina
        // - Credit/Debit Cards
        // - Other payment methods

        // For now, create a pending transaction as placeholder
        const transaction = await transactionRepository.createCheckoutTransaction({
            userId,
            amount,
            currency,
            platform: 'mobile',
            channel: paymentChannel,
            status: 'PENDING',
        });

        logger.info(
            `[TODO] Payment gateway integration needed for: ${paymentChannel}. Transaction ${transaction.id} created as PENDING`
        );

        return { transaction };
    }

    /**
     * Direct event checkout
     * User purchases a specific event directly (not from cart)
     */
    async directEventCheckout(
        userId: string,
        eventId: string,
        quantity: number,
        paymentMethodId: string
    ) {
        try {
            // 1. Validate event
            const event = await this.validateEvent(eventId);

            // 2. Validate payment method
            const paymentMethod = await this.validatePaymentMethod(paymentMethodId);

            // 3. Calculate pricing
            const unitPrice = event.discountedPrice || event.originalPrice;
            const totalPrice = unitPrice * quantity;
            const currency = 'AED'; // Default currency

            // 4. Extract payment channel
            const paymentChannel = this.extractPaymentChannel(paymentMethod);

            // 5. Process payment based on method type
            let transaction;
            const paymentChannelLower = paymentChannel.toLowerCase();

            // Check pending transaction limit for non-wallet payments (they create PENDING transactions)
            if (paymentChannelLower !== 'wallet') {
                await this.validatePendingTransactionLimit(userId);
            }

            if (paymentChannelLower === 'wallet') {
                // Wallet payment: validate balance, deduct, create completed transaction
                const result = await this.processWalletPayment(
                    userId,
                    totalPrice,
                    currency,
                    paymentChannel
                );
                transaction = result.transaction;
            } else if (paymentChannelLower === 'cash') {
                // Cash payment: create pending transaction
                const result = await this.processCashPayment(
                    userId,
                    totalPrice,
                    currency,
                    paymentChannel
                );
                transaction = result.transaction;
            } else {
                // Other payment methods: create pending transaction (TODO: integrate payment gateway)
                const result = await this.processOtherPayment(
                    userId,
                    totalPrice,
                    currency,
                    paymentChannel
                );
                transaction = result.transaction;
            }

            // 6. Generate booking number
            const bookingNumber = await bookingRepository.generateBookingNumber();

            // 7. Determine booking status based on transaction status
            const bookingStatus: BookingStatus =
                transaction.status === 'COMPLETED' ? 'CONFIRMED' : 'PENDING';

            // 8. Create booking
            const booking = await bookingRepository.create({
                bookingNumber,
                userId,
                eventId,
                quantity,
                unitPrice,
                totalPrice,
                currency,
                status: bookingStatus,
                transactionId: transaction.id,
                paymentMethodId,
            });

            logger.info(
                `Direct checkout completed: Booking ${booking.bookingNumber}, Event ${eventId}, User ${userId}`
            );

            // 9. Get booking with full details
            const bookingWithDetails = await bookingRepository.findByIdWithDetails(booking.id);

            return {
                success: true,
                message: 'Checkout completed successfully',
                data: {
                    booking: bookingWithDetails,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Direct checkout error:', error);
            throw new BadRequestException('Failed to complete checkout');
        }
    }

    /**
     * Cart checkout
     * User purchases all items in their cart
     */
    async cartCheckout(userId: string, cartId: string, paymentMethodId: string) {
        try {
            // Use transaction to ensure atomicity
            const result = await prisma.$transaction(async (tx: any) => {
                // 1. Validate cart belongs to user and is active
                const cart = await tx.cart.findUnique({
                    where: { id: cartId },
                    include: {
                        cartItems: {
                            include: {
                                event: true,
                            },
                        },
                    },
                });

                if (!cart) {
                    throw new NotFoundException('Cart not found');
                }

                if (cart.userId !== userId) {
                    throw new ForbiddenException('This cart does not belong to you');
                }

                if (cart.status !== 'ACTIVE') {
                    throw new BadRequestException(`Cannot checkout cart with status: ${cart.status}`);
                }

                if (cart.cartItems.length === 0) {
                    throw new BadRequestException('Cart is empty');
                }

                // 2. Validate payment method
                const paymentMethod = await this.validatePaymentMethod(paymentMethodId);

                // 3. Validate all events in cart are still active and available
                for (const item of cart.cartItems) {
                    await this.validateEvent(item.eventId);
                }

                // 4. Calculate total (use cart's calculated totals)
                const totalAmount = cart.totalAmount;
                const currency = cart.currency;

                // 5. Extract payment channel
                const paymentChannel = this.extractPaymentChannel(paymentMethod);

                // 6. Process payment based on method type
                let transaction;
                const paymentChannelLower = paymentChannel.toLowerCase();

                // Check pending transaction limit for non-wallet payments (they create PENDING transactions)
                if (paymentChannelLower !== 'wallet') {
                    await this.validatePendingTransactionLimit(userId);
                }

                if (paymentChannelLower === 'wallet') {
                    // Wallet payment: validate balance, deduct, create completed transaction
                    const result = await this.processWalletPayment(
                        userId,
                        totalAmount,
                        currency,
                        paymentChannel
                    );
                    transaction = result.transaction;
                } else if (paymentChannelLower === 'cash') {
                    // Cash payment: create pending transaction
                    const result = await this.processCashPayment(
                        userId,
                        totalAmount,
                        currency,
                        paymentChannel
                    );
                    transaction = result.transaction;
                } else {
                    // Other payment methods: create pending transaction (TODO: integrate payment gateway)
                    const result = await this.processOtherPayment(
                        userId,
                        totalAmount,
                        currency,
                        paymentChannel
                    );
                    transaction = result.transaction;
                }

                // 7. Determine booking status based on transaction status
                const bookingStatus: BookingStatus =
                    transaction.status === 'COMPLETED' ? 'CONFIRMED' : 'PENDING';

                // 8. Create bookings for each cart item
                const bookings = [];
                const cartItemIds = [];

                // Generate base booking number once and increment sequence for each item
                const today = new Date();
                const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
                const prefix = `WL-${dateStr}-`;

                // Find the latest booking for today
                const latestBooking = await tx.booking.findFirst({
                    where: {
                        bookingNumber: {
                            startsWith: prefix,
                        },
                    },
                    orderBy: {
                        bookingNumber: 'desc',
                    },
                    select: {
                        bookingNumber: true,
                    },
                });

                let sequence = 1;
                if (latestBooking) {
                    // Extract sequence number from the last booking
                    const lastSequence = latestBooking.bookingNumber.split('-')[2];
                    sequence = parseInt(lastSequence, 10) + 1;
                }

                for (const item of cart.cartItems) {
                    const sequenceStr = sequence.toString().padStart(4, '0');
                    const bookingNumber = `${prefix}${sequenceStr}`;
                    sequence++; // Increment for next booking

                    const unitPrice = item.event.discountedPrice || item.event.originalPrice;
                    const totalPrice = unitPrice * item.quantity;

                    const booking = await tx.booking.create({
                        data: {
                            bookingNumber,
                            userId,
                            eventId: item.eventId,
                            quantity: item.quantity,
                            unitPrice,
                            totalPrice,
                            currency,
                            status: bookingStatus,
                            transactionId: transaction.id,
                            paymentMethodId,
                            cartId,
                            cartItemId: item.id,
                        },
                    });

                    bookings.push(booking);
                    cartItemIds.push(item.id);
                }

                // 9. Mark cart items as converted to booking
                await tx.cartItem.updateMany({
                    where: {
                        id: {
                            in: cartItemIds,
                        },
                    },
                    data: {
                        convertedToBooking: true,
                    },
                });

                // 10. Mark cart as CHECKED_OUT
                await tx.cart.update({
                    where: { id: cartId },
                    data: {
                        status: 'CHECKED_OUT',
                        checkedOutAt: new Date(),
                    },
                });

                logger.info(
                    `Cart checkout completed: Cart ${cartId}, User ${userId}, ${bookings.length} bookings created`
                );

                // Return booking IDs and transaction info
                return {
                    bookingIds: bookings.map((b) => b.id),
                    transaction: {
                        id: transaction.id,
                        amount: transaction.amount,
                        currency: transaction.currency,
                        status: transaction.status,
                        channel: transaction.channel,
                    },
                };
            });

            // 11. Get bookings with full details (outside transaction, after commit)
            const bookingsWithDetails = await Promise.all(
                result.bookingIds.map((bookingId: string) =>
                    bookingRepository.findByIdWithDetails(bookingId)
                )
            );

            return {
                success: true,
                message: 'Cart checkout completed successfully',
                data: {
                    bookings: bookingsWithDetails,
                    transaction: result.transaction,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Cart checkout error:', error);
            throw new BadRequestException('Failed to complete cart checkout');
        }
    }

    /**
     * Main checkout method that handles both direct and cart checkout
     */
    async checkout(userId: string, checkoutData: CheckoutInput) {
        // Check if it's a direct checkout or cart checkout
        if ('eventId' in checkoutData) {
            // Direct event checkout
            return await this.directEventCheckout(
                userId,
                checkoutData.eventId,
                checkoutData.quantity,
                checkoutData.paymentMethodId
            );
        } else {
            // Cart checkout
            return await this.cartCheckout(
                userId,
                checkoutData.cartId,
                checkoutData.paymentMethodId
            );
        }
    }

    /**
     * Get all user bookings with filters and pagination
     */
    async getUserBookings(
        userId: string,
        page: number,
        limit: number,
        filters?: {
            status?: BookingStatus;
            eventId?: string;
            startDate?: Date;
            endDate?: Date;
        }
    ) {
        try {
            const result = await bookingRepository.findByUserId(userId, page, limit, filters);

            return {
                success: true,
                message: 'Bookings retrieved successfully',
                data: result.data,
                pagination: result.pagination,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Get user bookings error:', error);
            throw new BadRequestException('Failed to retrieve bookings');
        }
    }

    /**
     * Update booking used quantity (workers only)
     * Increments the usedQuantity and marks as COMPLETED if quantity is reached
     */
    async updateBookingQuantity(bookingId: string, quantityToAdd: number) {
        try {
            // Get booking
            const booking = await bookingRepository.findById(bookingId);

            if (!booking) {
                throw new NotFoundException('Booking not found');
            }

            // Only allow updates to CONFIRMED bookings
            if (!['CONFIRMED'].includes(booking.status)) {
                throw new BadRequestException(
                    `Cannot update booking with status ${booking.status}. Only CONFIRMED bookings can be updated.`
                );
            }

            // Validate quantity
            const remainingQuantity = booking.quantity - booking.usedQuantity;

            if (quantityToAdd > remainingQuantity) {
                throw new BadRequestException(
                    `Quantity to add (${quantityToAdd}) exceeds remaining quantity (${remainingQuantity})`
                );
            }

            // Calculate new used quantity
            const newUsedQuantity = booking.usedQuantity + quantityToAdd;

            // Determine if booking should be marked as completed
            const shouldComplete = newUsedQuantity >= booking.quantity;
            const newStatus = shouldComplete ? BookingStatus.COMPLETED : booking.status;

            // Update booking
            await bookingRepository.updateUsedQuantity(
                bookingId,
                newUsedQuantity,
                shouldComplete ? newStatus : undefined
            );

            logger.info(
                `Booking ${bookingId} updated: usedQuantity ${booking.usedQuantity} -> ${newUsedQuantity}${shouldComplete ? ', marked as COMPLETED' : ''}`
            );

            // Fetch full booking details for response
            const bookingWithDetails = await bookingRepository.findByIdWithDetails(bookingId);

            return {
                success: true,
                message: shouldComplete
                    ? 'Booking quantity updated and marked as completed'
                    : 'Booking quantity updated successfully',
                data: {
                    booking: bookingWithDetails,
                },
            };
        } catch (error) {
            logger.error('Error updating booking quantity:', error);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new Error('Failed to update booking quantity');
        }
    }

    /**
     * Get booking by ID with full details
     */
    async getBookingById(bookingId: string) {
        try {
            const booking = await bookingRepository.findByIdWithDetails(bookingId);

            if (!booking) {
                throw new NotFoundException('Booking not found');
            }

            return {
                success: true,
                message: 'Booking retrieved successfully',
                data: {
                    booking,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            logger.error('Get booking by ID error:', error);
            throw new BadRequestException('Failed to retrieve booking');
        }
    }
}

export default new BookingService();
