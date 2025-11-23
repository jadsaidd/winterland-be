export interface WalletDataResponse {
    id: string;
    amount: number;
    previousAmount: number;
    currency: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TransactionDataResponse {
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

export interface GetWalletResponse {
    success: boolean;
    message: string;
    data: {
        wallet: WalletDataResponse;
    };
}

export interface GetAllWalletsResponse {
    success: boolean;
    message: string;
    data: {
        wallets: WalletDataResponse[];
    };
}

export interface WalletTopUpResponse {
    success: boolean;
    message: string;
    data: {
        wallet: WalletDataResponse;
        transaction: TransactionDataResponse;
    };
}
