export interface EventResponseDto {
    id: string;
    name: any; // JSON i18n object or localized string
    eventSlug: string;
    description: any; // JSON i18n object or localized string
    active: boolean;
    haveSeats: boolean; // If true, prices may be null
    startAt: string;
    endAt: string;
    originalPrice?: number | null; // Optional when haveSeats is true
    discountedPrice?: number | null;
    createdAt: string;
    updatedAt: string;
    categories?: CategorySummaryDto[];
    locations?: LocationSummaryDto[];
    media?: MediaDto[];
}

export interface CategorySummaryDto {
    id: string;
    title: any; // JSON i18n object or localized string
    categorySlug: string;
    active: boolean;
    media?: MediaDto[];
}

export interface LocationSummaryDto {
    id: string;
    name: any; // JSON i18n object or localized string
    locationSlug: string;
    type: string;
    capacity?: number;
    latitude?: number;
    longitude?: number;
    active: boolean;
    media?: MediaDto[];
}

export interface MediaDto {
    id: string;
    url: string;
    type: string;
    context?: string;
    sortOrder?: number;
}

export interface EventStatisticsResponseDto {
    total: number;
    active: number;
    inactive: number;
    upcoming: number;
    ongoing: number;
    past: number;
}
