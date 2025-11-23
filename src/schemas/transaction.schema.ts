import { z } from 'zod';

export const transactionIdParamSchema = z.object({
    id: z.string().cuid('Invalid transaction ID format'),
});

export const walletIdParamSchema = z.object({
    walletId: z.string().cuid('Invalid wallet ID format'),
});

export const updateTransactionStatusSchema = z.object({
    status: z.literal('COMPLETED'),
});

export const walletTopUpSchema = z.object({
    walletId: z.string().cuid('Invalid wallet ID format'),
    amount: z.number().positive('Amount must be greater than 0'),
    paymentMethodId: z.string().cuid('Invalid payment method ID format'),
});

export const transactionStatusQuerySchema = z.object({
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
});

export type TransactionIdParam = z.infer<typeof transactionIdParamSchema>;
export type WalletIdParam = z.infer<typeof walletIdParamSchema>;
export type UpdateTransactionStatusInput = z.infer<typeof updateTransactionStatusSchema>;
export type WalletTopUpInput = z.infer<typeof walletTopUpSchema>;
export type TransactionStatusQuery = z.infer<typeof transactionStatusQuerySchema>;
