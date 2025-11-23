export interface AuthTokensResponse {
    accessToken: string;
    refreshToken: string;
}

export interface PermissionResponse {
    id: string;
    name: string;
    resource: string;
    action: string;
}

export interface RoleResponse {
    id: string;
    name: string;
    roleType: 'WORKER' | 'CUSTOMER';
    description?: string | null;
    permissions: PermissionResponse[];
}

export interface UserDataResponse {
    id: string;
    email?: string | null;
    phoneNumber?: string | null;
    name?: string | null;
    profilePictureUrl?: string | null;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    platform?: string | null;
    applicationData?: UserApplicationDataResponse | null;
    roles: RoleResponse[];
}

export interface UserApplicationDataResponse {
    deviceId?: string | null;
    deviceModel?: string | null;
    osName?: string | null;
    osVersion?: string | null;
    appPlatform?: string | null;
    fcmToken?: string | null;
    timezoneName?: string | null;
    timezoneOffset?: number | null;
    appVersion?: string | null;
    buildNumber?: string | null;
    lastKnownIpAddress?: string | null;
    currentIpAddress?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        userId: string;
        channel: 'email' | 'phone';
        expiresIn: number;
    };
}

export interface VerifyResponse {
    success: boolean;
    message: string;
    data: {
        user: UserDataResponse;
        tokens: AuthTokensResponse;
        isNewUser: boolean;
    };
}

export interface GoogleLoginResponse {
    success: boolean;
    message: string;
    data: {
        user: UserDataResponse;
        tokens: AuthTokensResponse;
        isNewUser: boolean;
    };
}

export interface AppleLoginResponse {
    success: boolean;
    message: string;
    data: {
        user: UserDataResponse;
        tokens: AuthTokensResponse;
        isNewUser: boolean;
    };
}

export interface RefreshTokenResponse {
    success: boolean;
    message: string;
    data: {
        tokens: AuthTokensResponse;
    };
}

export interface LogoutResponse {
    success: boolean;
    message: string;
}

export interface ResendOTPResponse {
    success: boolean;
    message: string;
    data: {
        expiresIn: number;
    };
}

export interface GuestLoginResponse {
    success: boolean;
    message: string;
    data: {
        user: UserDataResponse;
        tokens: AuthTokensResponse;
        isNewUser: boolean;
    };
}
