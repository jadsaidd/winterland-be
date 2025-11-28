import { PaginatedResponse } from '../utils/pagination.util';
import { createPaginatedResponse } from '../utils/pagination.util';
import prisma from '../utils/prisma.client';

export interface CreateSupportTicketData {
    fullName: string;
    email: string;
    subject: string;
    description: string;
}

export interface UpdateSupportTicketData {
    status?: string;
}

export interface SupportTicketFilters {
    search?: string;
    status?: string;
}

export class SupportTicketRepository {
    /**
     * Create a new support ticket
     */
    async create(data: CreateSupportTicketData) {
        return await prisma.supportTicket.create({
            data,
        });
    }

    /**
     * Get all support tickets with pagination and filters
     */
    async getAll(
        page: number,
        limit: number,
        filters: SupportTicketFilters = {}
    ): Promise<PaginatedResponse<any>> {
        const skip = (page - 1) * limit;
        const { search, status } = filters;

        // Build where clause
        const where: any = {};

        // Add status filter
        if (status) {
            where.status = status;
        }

        // Add search filter (searches in fullName, email, and subject)
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.supportTicket.count({ where }),
        ]);

        return createPaginatedResponse(tickets, total, page, limit);
    }

    /**
     * Get a support ticket by ID
     */
    async getById(id: string) {
        return await prisma.supportTicket.findUnique({
            where: { id },
        });
    }

    /**
     * Update support ticket status
     */
    async updateStatus(id: string, status: string) {
        return await prisma.supportTicket.update({
            where: { id },
            data: { status },
        });
    }

    /**
     * Delete a support ticket
     */
    async delete(id: string) {
        return await prisma.supportTicket.delete({
            where: { id },
        });
    }

    /**
     * Check if support ticket exists
     */
    async exists(id: string): Promise<boolean> {
        const count = await prisma.supportTicket.count({
            where: { id },
        });
        return count > 0;
    }
}

export const supportTicketRepository = new SupportTicketRepository();
