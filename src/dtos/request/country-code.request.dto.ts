export interface CreateCountryCodeDto {
    country: string;
    flagUrl?: string;
    isoCode?: string;
    code: string;
    digits: number;
    active?: boolean;
}

export interface UpdateCountryCodeDto {
    country?: string;
    flagUrl?: string;
    isoCode?: string;
    code?: string;
    digits?: number;
    active?: boolean;
}

export interface ToggleActiveDto {
    active: boolean;
}

export interface CreateMediaDto {
    url: string;
    type?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
    context?: string;
    meta?: any;
    uploadedBy?: string;
}
