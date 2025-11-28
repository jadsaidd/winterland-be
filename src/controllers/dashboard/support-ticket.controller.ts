import { NextFunction, Request, Response } from 'express';

import { supportTicketService } from '../../services/support-ticket.service';

export class DashboardSupportTicketController {
    /**
     * Get all support tickets with pagination and filters
     */
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit } = (req as any).pagination;
            const { search, status } = req.query;

            const result = await supportTicketService.getAllTickets(page, limit, {
                search: search as string | undefined,
                status: status as string | undefined,
            });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single support ticket by ID
     */
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const ticket = await supportTicketService.getTicketById(id);

            res.status(200).json({
                data: ticket,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update support ticket status
     */
    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const updatedTicket = await supportTicketService.updateTicketStatus(id, status);

            res.status(200).json({
                message: 'Support ticket status updated successfully',
                data: updatedTicket,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a support ticket
     */
    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            await supportTicketService.deleteTicket(id);

            res.status(200).json({
                message: 'Support ticket deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardSupportTicketController = new DashboardSupportTicketController();
