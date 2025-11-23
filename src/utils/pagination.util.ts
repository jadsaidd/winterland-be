export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginationResult {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextPage: number | null;
    previousPage: number | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationResult;
}

/**
 * Parse and validate pagination parameters from query
 * @param page Page number from query
 * @param limit Limit per page from query
 * @param defaultLimit Default limit if not provided
 * @param maxLimit Maximum allowed limit
 * @returns Validated pagination parameters
 */
export function parsePaginationParams(
    page: any,
    limit: any,
    defaultLimit: number = 10,
    maxLimit: number = 100
): { page: number; limit: number; skip: number } {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit) || defaultLimit));
    const skip = (pageNum - 1) * limitNum;

    return {
        page: pageNum,
        limit: limitNum,
        skip,
    };
}

/**
 * Create pagination metadata
 * @param totalItems Total number of items
 * @param currentPage Current page number
 * @param pageSize Number of items per page
 * @returns Pagination metadata
 */
export function createPaginationMeta(
    totalItems: number,
    currentPage: number,
    pageSize: number
): PaginationResult {
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNext = currentPage < totalPages;
    const hasPrevious = currentPage > 1;

    return {
        totalItems,
        totalPages,
        currentPage,
        pageSize,
        hasNext,
        hasPrevious,
        nextPage: hasNext ? currentPage + 1 : null,
        previousPage: hasPrevious ? currentPage - 1 : null,
    };
}

/**
 * Create a paginated response with data and metadata
 * @param data Array of items
 * @param totalItems Total number of items
 * @param currentPage Current page number
 * @param pageSize Number of items per page
 * @returns Paginated response
 */
export function createPaginatedResponse<T>(
    data: T[],
    totalItems: number,
    currentPage: number,
    pageSize: number
): PaginatedResponse<T> {
    return {
        data,
        pagination: createPaginationMeta(totalItems, currentPage, pageSize),
    };
}
