import { WalletDataResponse } from './wallet.response.dto';

export interface TransactionResponse {
    id: string;
    amount: number;
    currency: string;
    platform: string;
    channel: string;
    action: string;
    status: string;
    completedBy?: string;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface GetTransactionResponse {
    success: boolean;
    message: string;
    data: {
        transaction: TransactionResponse;
    };
}

export interface CompleteTransactionResponse {
    success: boolean;
    message: string;
    data: {
        transaction: TransactionResponse;
        wallet?: WalletDataResponse;
    };
}

export interface CancelledBookingResponse {
    id: string;
    bookingNumber: string;
    status: string;
    isActive: boolean;
}

export interface CancelTransactionResponse {
    success: boolean;
    message: string;
    data: {
        transaction: TransactionResponse & {
            bookings?: CancelledBookingResponse[];
        };
    };
}
