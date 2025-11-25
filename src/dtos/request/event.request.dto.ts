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
    haveSeats?: boolean; // If true, prices are optional
    originalPrice?: number; // Required if haveSeats is false
    discountedPrice?: number;
    categoryIds: string[];
    locationId: string;
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
    haveSeats?: boolean; // If true, prices are optional
    originalPrice?: number | null; // Can be null to clear when haveSeats is true
    discountedPrice?: number | null; // Can be null to clear when haveSeats is true
    categoryIds?: string[];
    locationId?: string;
    mediaUrls?: string[];
}

export interface ToggleEventActiveRequestDto {
    active: boolean;
}

export interface ManageEventCategoriesRequestDto {
    categoryIds: string[];
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
