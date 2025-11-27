/**
 * Request DTO for creating a support ticket
 */
export interface CreateSupportTicketRequest {
    fullName: string;
    email: string;
    subject: string;
    description: string;
}

/**
 * Request DTO for updating support ticket status
 */
export interface UpdateSupportTicketStatusRequest {
    status: 'OPEN' | 'CLOSED';
}

/**
 * Query DTO for filtering support tickets
 */
export interface SupportTicketQueryRequest {
    search?: string;
    status?: 'OPEN' | 'CLOSED';
}
