/**
 * Response DTO for a support ticket
 */
export interface SupportTicketResponse {
    id: string;
    fullName: string;
    email: string;
    subject: string;
    description: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Response DTO for paginated support tickets list
 */
export interface SupportTicketsListResponse {
    data: SupportTicketResponse[];
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
