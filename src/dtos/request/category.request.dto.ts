/**
 * Category Request DTOs
 */

export interface CreateCategoryRequestDto {
    title: {
        en: string;
        ar?: string;
    };
    description: {
        en: string;
        ar?: string;
    };
    mediaUrls?: string[];
}

export interface UpdateCategoryRequestDto {
    title?: {
        en: string;
        ar?: string;
    };
    description?: {
        en: string;
        ar?: string;
    };
    mediaUrls?: string[];
    active?: boolean;
}

export interface ToggleCategoryActiveRequestDto {
    active: boolean;
}

export interface GetCategoriesQueryDto {
    page?: string;
    limit?: string;
    active?: 'true' | 'false';
    search?: string;
}
