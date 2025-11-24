/**
 * Category Response DTOs
 */

export interface CategoryMediaDto {
    id: string;
    sortOrder: number | null;
    mediaId: string;
    media: {
        id: string;
        url: string;
        type: string;
        context: string | null;
        meta: any;
    };
}

export interface EventCategoryResponseDto {
    id: string;
    eventId: string;
    event: {
        id: string;
        name: any;
        eventSlug: string;
        active: boolean;
    };
}

export interface CategoryResponseDto {
    id: string;
    title: any; // JSON object for dashboard, localized string for mobile
    categorySlug: string;
    description: any; // JSON object for dashboard, localized string for mobile
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    categoryMedias: CategoryMediaDto[];
    eventCategories?: EventCategoryResponseDto[];
}

export interface CategoriesListResponseDto {
    success: boolean;
    message: string;
    data: CategoryResponseDto[];
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
        hasNext: boolean;
        hasPrevious: boolean;
        nextPage: number | null;
        previousPage: number | null;
    };
}

export interface CategoryDetailResponseDto {
    success: boolean;
    message: string;
    data: CategoryResponseDto;
}

export interface CategoryStatsResponseDto {
    success: boolean;
    message: string;
    data: {
        total: number;
        active: number;
        inactive: number;
        withEvents: number;
        withoutEvents: number;
        withMedia: number;
        withoutMedia: number;
        totalEvents: number;
        averageEventsPerCategory: number;
        topCategories: Array<{
            id: string;
            title: any;
            categorySlug: string;
            eventCount: number;
            active: boolean;
        }>;
        recentCategories: Array<{
            id: string;
            title: any;
            categorySlug: string;
            createdAt: Date;
            active: boolean;
        }>;
        categoryDistribution: {
            activeWithEvents: number;
            activeWithoutEvents: number;
            inactiveWithEvents: number;
            inactiveWithoutEvents: number;
        };
    };
}

export interface CategoryDeleteResponseDto {
    success: boolean;
    message: string;
}
