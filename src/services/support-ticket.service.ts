import { BadRequestException, NotFoundException } from '../exceptions/http.exception';
import {
    CreateSupportTicketData,
    SupportTicketFilters,
    supportTicketRepository,
} from '../repositories/support-ticket.repository';
import { PaginatedResponse } from '../utils/pagination.util';

export class SupportTicketService {
    /**
     * Create a new support ticket
     */
    async createTicket(data: CreateSupportTicketData) {
        return await supportTicketRepository.create(data);
    }

    /**
     * Get all support tickets with pagination and filters
     */
    async getAllTickets(
        page: number,
        limit: number,
        filters: SupportTicketFilters = {}
    ): Promise<PaginatedResponse<any>> {
        return await supportTicketRepository.getAll(page, limit, filters);
    }

    /**
     * Get a support ticket by ID
     */
    async getTicketById(id: string) {
        const ticket = await supportTicketRepository.getById(id);

        if (!ticket) {
            throw new NotFoundException('Support ticket not found');
        }

        return ticket;
    }

    /**
     * Update support ticket status
     */
    async updateTicketStatus(id: string, status: string) {
        // Validate status value
        const validStatuses = ['OPEN', 'CLOSED'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestException('Invalid status. Must be OPEN or CLOSED');
        }

        const exists = await supportTicketRepository.exists(id);
        if (!exists) {
            throw new NotFoundException('Support ticket not found');
        }

        return await supportTicketRepository.updateStatus(id, status);
    }

    /**
     * Delete a support ticket
     */
    async deleteTicket(id: string) {
        const exists = await supportTicketRepository.exists(id);
        if (!exists) {
            throw new NotFoundException('Support ticket not found');
        }

        await supportTicketRepository.delete(id);
    }
}

export const supportTicketService = new SupportTicketService();
