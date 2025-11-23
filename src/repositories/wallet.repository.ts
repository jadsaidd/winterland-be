import { Wallet } from '@prisma/client';

import { prisma } from '../utils/prisma.client';

export class WalletRepository {
    /**
     * Create a new wallet
     * @param userId User ID
     * @param currency Currency code (e.g., "USD", "AED")
     * @returns Created wallet
     */
    async createWallet(userId: string, currency: string = 'AED'): Promise<Wallet> {
        return await prisma.wallet.create({
            data: {
                userId,
                currency,
                amount: 0,
                previousAmount: 0,
                active: true,
            },
        });
    }

    /**
     * Find wallet by user ID and currency
     * @param userId User ID
     * @param currency Currency code
     * @returns Wallet if found, null otherwise
     */
    async findByUserIdAndCurrency(userId: string, currency: string): Promise<Wallet | null> {
        return await prisma.wallet.findUnique({
            where: {
                userId_currency: {
                    userId,
                    currency,
                },
            },
        });
    }

    /**
     * Find wallet by ID
     * @param walletId Wallet ID
     * @returns Wallet if found, null otherwise
     */
    async findById(walletId: string): Promise<Wallet | null> {
        return await prisma.wallet.findUnique({
            where: { id: walletId },
        });
    }

    /**
     * Get user's wallet (defaults to AED currency)
     * @param userId User ID
     * @param currency Currency code (optional, defaults to AED)
     * @returns Wallet if found, null otherwise
     */
    async getUserWallet(userId: string, currency: string = 'AED'): Promise<Wallet | null> {
        return await this.findByUserIdAndCurrency(userId, currency);
    }

    /**
     * Get all wallets for a user
     * @param userId User ID
     * @returns Array of wallets
     */
    async getAllUserWallets(userId: string): Promise<Wallet[]> {
        return await prisma.wallet.findMany({
            where: { userId },
            orderBy: { currency: 'asc' },
        });
    }

    /**
     * Update wallet amount
     * @param walletId Wallet ID
     * @param newAmount New amount
     * @returns Updated wallet
     */
    async updateAmount(walletId: string, newAmount: number): Promise<Wallet> {
        // Get current amount first to store as previous
        const currentWallet = await prisma.wallet.findUnique({
            where: { id: walletId },
        });

        if (!currentWallet) {
            throw new Error('Wallet not found');
        }

        return await prisma.wallet.update({
            where: { id: walletId },
            data: {
                previousAmount: currentWallet.amount,
                amount: newAmount,
            },
        });
    }

    /**
     * Add amount to wallet
     * @param walletId Wallet ID
     * @param amount Amount to add
     * @returns Updated wallet
     */
    async addAmount(walletId: string, amount: number): Promise<Wallet> {
        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId },
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        return await this.updateAmount(walletId, wallet.amount + amount);
    }

    /**
     * Subtract amount from wallet
     * @param walletId Wallet ID
     * @param amount Amount to subtract
     * @returns Updated wallet
     */
    async subtractAmount(walletId: string, amount: number): Promise<Wallet> {
        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId },
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const newAmount = wallet.amount - amount;
        if (newAmount < 0) {
            throw new Error('Insufficient wallet balance');
        }

        return await this.updateAmount(walletId, newAmount);
    }

    /**
     * Activate or deactivate wallet
     * @param walletId Wallet ID
     * @param active Active status
     * @returns Updated wallet
     */
    async setActive(walletId: string, active: boolean): Promise<Wallet> {
        return await prisma.wallet.update({
            where: { id: walletId },
            data: { active },
        });
    }

    /**
     * Delete wallet (hard delete)
     * @param walletId Wallet ID
     * @returns Deleted wallet
     */
    async deleteWallet(walletId: string): Promise<Wallet> {
        return await prisma.wallet.delete({
            where: { id: walletId },
        });
    }
}
