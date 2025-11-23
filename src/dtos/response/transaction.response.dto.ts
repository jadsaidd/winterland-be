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
