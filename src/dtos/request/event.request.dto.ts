export interface CreateEventRequestDto {
    name: {
        en: string;
        ar?: string;
    };
    description: {
        en: string;
        ar?: string;
    };
    startAt: string; // ISO datetime string
    endAt: string; // ISO datetime string
    originalPrice: number;
    discountedPrice?: number;
    categoryIds: string[];
    locationIds: string[];
    mediaUrls?: string[];
}

export interface UpdateEventRequestDto {
    name?: {
        en: string;
        ar?: string;
    };
    description?: {
        en: string;
        ar?: string;
    };
    startAt?: string; // ISO datetime string
    endAt?: string; // ISO datetime string
    originalPrice?: number;
    discountedPrice?: number;
    categoryIds?: string[];
    locationIds?: string[];
    mediaUrls?: string[];
}

export interface ToggleEventActiveRequestDto {
    active: boolean;
}

export interface ManageEventCategoriesRequestDto {
    categoryIds: string[];
}

export interface ManageEventLocationsRequestDto {
    locationIds: string[];
}

export interface GetAllEventsQueryDto {
    page?: string;
    limit?: string;
    active?: 'true' | 'false';
    search?: string;
    categoryId?: string;
    locationId?: string;
    startDate?: string; // ISO datetime string
    endDate?: string; // ISO datetime string
}
