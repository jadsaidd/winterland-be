export interface LocationMediaResponseDto {
    id: string;
    url: string;
    type: string;
    sortOrder: number | null;
}

export interface EventLocationResponseDto {
    id: string;
    eventId: string;
    event: {
        id: string;
        name: any;
        eventSlug: string;
        active: boolean;
    };
}

export interface LocationResponseDto {
    id: string;
    name: any; // Will be i18n JSON object for dashboard, localized string for mobile
    locationSlug: string;
    description: any; // Will be i18n JSON object for dashboard, localized string for mobile
    active: boolean;
    type: string;
    capacity: number | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: Date;
    updatedAt: Date;
    media?: LocationMediaResponseDto[];
    eventLocations?: EventLocationResponseDto[];
}

export interface LocationListResponseDto {
    id: string;
    name: any;
    locationSlug: string;
    description: any;
    active: boolean;
    type: string;
    capacity: number | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: Date;
    updatedAt: Date;
    mediaCount?: number;
    eventCount?: number;
}
