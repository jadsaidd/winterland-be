export interface LocationMediaResponseDto {
    id: string;
    url: string;
    type: string;
    sortOrder: number | null;
}

export interface EventResponseDto {
    id: string;
    name: any;
    eventSlug: string;
    active: boolean;
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
    hasZones: boolean; // Indicates if location has zones/sections/rows/seats configured
    createdAt: Date;
    updatedAt: Date;
    media?: LocationMediaResponseDto[];
    events?: EventResponseDto[];
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
    hasZones: boolean; // Indicates if location has zones/sections/rows/seats configured
    createdAt: Date;
    updatedAt: Date;
    mediaCount?: number;
    eventCount?: number;
}

/**
 * Zone Pricing Response DTO
 */
export interface ZonePricingResponseDto {
    id: string;
    originalPrice: number;
    discountedPrice: number | null;
    eventId: string;
    scheduleId: string;
    schedule: {
        id: string;
        startAt: Date;
        endAt: Date;
    };
}

/**
 * Row Response DTO
 */
export interface LocationRowResponseDto {
    id: string;
    rowNumber: number;
    order: number;
    seatCount: number;
}

/**
 * Section Response DTO
 */
export interface LocationSectionResponseDto {
    id: string;
    position: string;
    numberOfRows: number;
    rows: LocationRowResponseDto[];
}

/**
 * Zone Details Response DTO
 */
export interface ZoneDetailsResponseDto {
    id: string;
    zoneId: string;
    zone: {
        id: string;
        type: string;
        priority: number;
    };
    totalSections: number;
    totalSeats: number;
    sections: LocationSectionResponseDto[];
    pricings: ZonePricingResponseDto[];
}

/**
 * Location Zones Response DTO
 */
export interface LocationZonesResponseDto {
    locationId: string;
    locationName: any;
    locationSlug: string;
    zones: ZoneDetailsResponseDto[];
}

/**
 * Set Zone Pricing Response DTO
 */
export interface SetZonePricingResponseDto {
    locationId: string;
    eventId: string;
    scheduleId: string;
    pricings: Array<{
        id: string;
        locationZoneId: string;
        zoneId: string;
        originalPrice: number;
        discountedPrice: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
