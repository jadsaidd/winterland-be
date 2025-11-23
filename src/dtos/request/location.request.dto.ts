export interface CreateLocationRequestDto {
    name: {
        en: string;
        ar?: string;
    };
    description: {
        en: string;
        ar?: string;
    };
    type?: 'STADIUM' | 'ARENA' | 'THEATRE' | 'HALL' | 'OUTDOOR' | 'INDOOR' | 'OTHER';
    capacity?: number;
    latitude?: number;
    longitude?: number;
    mediaUrls?: string[];
}

export interface UpdateLocationRequestDto {
    name?: {
        en: string;
        ar?: string;
    };
    description?: {
        en: string;
        ar?: string;
    };
    type?: 'STADIUM' | 'ARENA' | 'THEATRE' | 'HALL' | 'OUTDOOR' | 'INDOOR' | 'OTHER';
    capacity?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    mediaUrls?: string[];
}

export interface ToggleLocationActiveRequestDto {
    active: boolean;
}

export interface GetLocationsQueryDto {
    page?: string;
    limit?: string;
    active?: 'true' | 'false';
    type?: 'STADIUM' | 'ARENA' | 'THEATRE' | 'HALL' | 'OUTDOOR' | 'INDOOR' | 'OTHER';
    search?: string;
}
