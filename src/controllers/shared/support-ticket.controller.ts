import { NextFunction, Request, Response } from 'express';

import { supportTicketService } from '../../services/support-ticket.service';

export class SharedSupportTicketController {
    /**
     * Create a new support ticket (public endpoint)
     */
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { fullName, email, subject, description } = req.body;

            const ticket = await supportTicketService.createTicket({
                fullName,
                email,
                subject,
                description,
            });

            res.status(201).json({
                message: 'Support ticket created successfully',
                data: ticket,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const sharedSupportTicketController = new SharedSupportTicketController();
